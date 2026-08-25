import { getPool } from '../db';
import { cacheService } from './redis.service';

export interface PlayerProfile {
  uuid: string;
  username: string;
  avatarUrl: string;
  headUrl: string;
  bodyUrl: string;
  skinUrl: string;
  rank?: string;
  prefix?: string;
  playtimeSeconds: number;
  playtimeFormatted: string;
  firstJoined?: string;
  lastSeen?: string;
  kills?: number;
  deaths?: number;
  kdr?: string;
}

export class PlayerService {
  private formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }

  async resolveMojangUser(query: string): Promise<{ uuid: string; username: string } | null> {
    const cacheKey = `mojang:${query.toLowerCase()}`;
    const cached = await cacheService.get<{ uuid: string; username: string }>(cacheKey);
    if (cached) return cached;

    // Check if query is already a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query) ||
                   /^[0-9a-f]{32}$/i.test(query);

    try {
      if (isUuid) {
        const cleanUuid = query.replace(/-/g, '');
        const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${cleanUuid}`);
        if (!res.ok) return null;
        const data: any = await res.json();
        const result = { uuid: data.id, username: data.name };
        await cacheService.set(cacheKey, result, 86400); // 24h cache
        return result;
      } else {
        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(query)}`);
        if (!res.ok) return null;
        const data: any = await res.json();
        const result = { uuid: data.id, username: data.name };
        await cacheService.set(cacheKey, result, 86400); // 24h cache
        return result;
      }
    } catch {
      return null;
    }
  }

  async getPlayerProfile(query: string): Promise<PlayerProfile | null> {
    const cacheKey = `player:profile:${query.toLowerCase()}`;
    const cached = await cacheService.get<PlayerProfile>(cacheKey);
    if (cached) return cached;

    // 1. Resolve Mojang UUID & Case-Correct Username
    const mojang = await this.resolveMojangUser(query);
    const uuid = mojang ? mojang.uuid : query;
    const username = mojang ? mojang.username : query;

    const baseProfile: PlayerProfile = {
      uuid,
      username,
      avatarUrl: `https://crafatar.com/avatars/${uuid}?size=128&overlay`,
      headUrl: `https://crafatar.com/renders/head/${uuid}?overlay`,
      bodyUrl: `https://crafatar.com/renders/body/${uuid}?overlay`,
      skinUrl: `https://crafatar.com/skins/${uuid}`,
      playtimeSeconds: 0,
      playtimeFormatted: '0m',
      rank: 'Player',
    };

    // 2. Query Plan database or local player_stats if available
    try {
      const pool = getPool();

      // Check if plan_users / plan_user_info exists
      const [rows]: any = await pool.query(
        `SELECT
           u.uuid,
           u.name as username,
           COALESCE(i.registered, 0) as registered,
           COALESCE(i.playtime, 0) as playtime_ms,
           COALESCE(i.last_seen, 0) as last_seen
         FROM plan_users u
         LEFT JOIN plan_user_info i ON u.id = i.user_id
         WHERE u.name = ? OR u.uuid = ?
         LIMIT 1`,
        [username, uuid]
      ).catch(() => [[]]);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const playtimeSeconds = Math.floor((row.playtime_ms || 0) / 1000);
        baseProfile.playtimeSeconds = playtimeSeconds;
        baseProfile.playtimeFormatted = this.formatPlaytime(playtimeSeconds);
        if (row.registered) baseProfile.firstJoined = new Date(row.registered).toISOString();
        if (row.last_seen) baseProfile.lastSeen = new Date(row.last_seen).toISOString();
      }

      // Check LuckPerms primary group
      const [lpRows]: any = await pool.query(
        `SELECT primary_group FROM luckperms_players WHERE username = ? OR uuid = ? LIMIT 1`,
        [username, uuid]
      ).catch(() => [[]]);

      if (lpRows && lpRows.length > 0) {
        const lp = lpRows[0];
        if (lp.primary_group) {
          baseProfile.rank = lp.primary_group.charAt(0).toUpperCase() + lp.primary_group.slice(1);
        }
      }
    } catch {
      // Database not yet configured or tables not ready — return profile with avatar
    }

    await cacheService.set(cacheKey, baseProfile, 60);
    return baseProfile;
  }

  async getLeaderboard(type: 'playtime' | 'kills' = 'playtime', limit: number = 25): Promise<any[]> {
    const cacheKey = `leaderboard:${type}:${limit}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const pool = getPool();
      // Try querying Plan leaderboard
      const [rows]: any = await pool.query(
        `SELECT
           RANK() OVER (ORDER BY COALESCE(i.playtime, 0) DESC) AS rank,
           u.name as username,
           u.uuid,
           FLOOR(COALESCE(i.playtime, 0) / 1000) as playtime_seconds
         FROM plan_users u
         JOIN plan_user_info i ON u.id = i.user_id
         WHERE COALESCE(i.playtime, 0) > 0
         ORDER BY i.playtime DESC
         LIMIT ?`,
        [limit]
      ).catch(() => [[]]);

      if (rows && rows.length > 0) {
        const results = rows.map((r: any) => ({
          rank: r.rank,
          username: r.username,
          uuid: r.uuid,
          playtimeSeconds: r.playtime_seconds,
          playtimeFormatted: this.formatPlaytime(r.playtime_seconds),
          avatarUrl: `https://crafatar.com/avatars/${r.uuid}?size=64&overlay`,
        }));
        await cacheService.set(cacheKey, results, 60);
        return results;
      }
    } catch {
      // Fallback
    }

    return [];
  }
}

export const playerService = new PlayerService();
