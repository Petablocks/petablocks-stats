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

    // 2. Query Plan database or LuckPerms
    try {
      const pool = getPool();
      const cleanUuid = uuid.replace(/-/g, '');

      // Query plan_users + plan_user_info
      let matchedRow: any = null;

      try {
        const [rows]: any = await pool.query(
          `SELECT
             u.uuid,
             u.name as username,
             COALESCE(i.registered, u.registered, 0) as registered,
             COALESCE(i.playtime, 0) as playtime_ms,
             COALESCE(i.last_seen, 0) as last_seen
           FROM plan_users u
           LEFT JOIN plan_user_info i ON u.id = i.user_id
           WHERE LOWER(u.name) = LOWER(?) OR REPLACE(u.uuid, '-', '') = ?
           ORDER BY i.playtime DESC
           LIMIT 1`,
          [username, cleanUuid]
        );
        if (rows && rows.length > 0) matchedRow = rows[0];
      } catch {
        // Fallback for alternate Plan schema (e.g. plan_sessions or direct activity)
      }

      // If playtime_ms is 0 or plan_user_info empty, check plan_sessions
      if (!matchedRow || !matchedRow.playtime_ms) {
        try {
          const [sessionRows]: any = await pool.query(
            `SELECT
               u.uuid,
               u.name as username,
               COALESCE(u.registered, 0) as registered,
               COALESCE(SUM(s.session_end - s.session_start), 0) as playtime_ms,
               MAX(s.session_end) as last_seen
             FROM plan_users u
             LEFT JOIN plan_sessions s ON u.id = s.user_id
             WHERE LOWER(u.name) = LOWER(?) OR REPLACE(u.uuid, '-', '') = ?
             GROUP BY u.id
             LIMIT 1`,
            [username, cleanUuid]
          );
          if (sessionRows && sessionRows.length > 0 && sessionRows[0].playtime_ms) {
            matchedRow = sessionRows[0];
          }
        } catch {
          // Ignore
        }
      }

      if (matchedRow) {
        const playtimeSeconds = Math.floor((matchedRow.playtime_ms || 0) / 1000);
        baseProfile.playtimeSeconds = playtimeSeconds;
        baseProfile.playtimeFormatted = this.formatPlaytime(playtimeSeconds);
        if (matchedRow.registered && matchedRow.registered > 0) {
          baseProfile.firstJoined = new Date(Number(matchedRow.registered)).toISOString();
        }
        if (matchedRow.last_seen && matchedRow.last_seen > 0) {
          baseProfile.lastSeen = new Date(Number(matchedRow.last_seen)).toISOString();
        }
      }

      // Check LuckPerms primary group
      try {
        const [lpRows]: any = await pool.query(
          `SELECT primary_group FROM luckperms_players WHERE LOWER(username) = LOWER(?) OR REPLACE(uuid, '-', '') = ? LIMIT 1`,
          [username, cleanUuid]
        );

        if (lpRows && lpRows.length > 0 && lpRows[0].primary_group) {
          const group = lpRows[0].primary_group;
          baseProfile.rank = group.charAt(0).toUpperCase() + group.slice(1);
        }
      } catch {
        // LuckPerms table not in this DB
      }
    } catch (err) {
      // Database not yet configured or tables not ready
    }

    await cacheService.set(cacheKey, baseProfile, 30);
    return baseProfile;
  }

  async getLeaderboard(type: 'playtime' | 'kills' = 'playtime', limit: number = 25): Promise<any[]> {
    const cacheKey = `leaderboard:${type}:${limit}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const pool = getPool();
      let results: any[] = [];

      // Query plan_user_info
      try {
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
        );

        if (rows && rows.length > 0) {
          results = rows.map((r: any) => ({
            rank: r.rank,
            username: r.username,
            uuid: r.uuid,
            playtimeSeconds: r.playtime_seconds,
            playtimeFormatted: this.formatPlaytime(r.playtime_seconds),
            avatarUrl: `https://crafatar.com/avatars/${r.uuid}?size=64&overlay`,
          }));
        }
      } catch {
        // Fallback to plan_sessions
      }

      if (results.length === 0) {
        try {
          const [sessionRows]: any = await pool.query(
            `SELECT
               RANK() OVER (ORDER BY SUM(s.session_end - s.session_start) DESC) AS rank,
               u.name as username,
               u.uuid,
               FLOOR(SUM(s.session_end - s.session_start) / 1000) as playtime_seconds
             FROM plan_users u
             JOIN plan_sessions s ON u.id = s.user_id
             GROUP BY u.id
             HAVING playtime_seconds > 0
             ORDER BY playtime_seconds DESC
             LIMIT ?`,
            [limit]
          );

          if (sessionRows && sessionRows.length > 0) {
            results = sessionRows.map((r: any) => ({
              rank: r.rank,
              username: r.username,
              uuid: r.uuid,
              playtimeSeconds: r.playtime_seconds,
              playtimeFormatted: this.formatPlaytime(r.playtime_seconds),
              avatarUrl: `https://crafatar.com/avatars/${r.uuid}?size=64&overlay`,
            }));
          }
        } catch {
          // Ignore
        }
      }

      if (results.length > 0) {
        await cacheService.set(cacheKey, results, 30);
        return results;
      }
    } catch {
      // Ignore
    }

    return [];
  }
}

export const playerService = new PlayerService();
