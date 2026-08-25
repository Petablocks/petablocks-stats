import * as util from 'minecraft-server-util';
import { GameServerConfig, GAME_SERVERS } from '../config/servers';
import { cacheService } from './redis.service';

export interface ServerStatusResult {
  id: string;
  name: string;
  host: string;
  port: number;
  type: 'fabric' | 'neoforge';
  version: string;
  description: string;
  online: boolean;
  players: {
    online: number;
    max: number;
    sample?: Array<{ name: string; id: string }>;
  };
  motd?: {
    clean: string;
    html?: string;
  };
  latency?: number;
  favicon?: string;
  hasPlan: boolean;
  hasLuckPerms: boolean;
  lastUpdated: string;
}

export class PingService {
  async pingServer(server: GameServerConfig): Promise<ServerStatusResult> {
    const cacheKey = `server:status:${server.id}`;
    const cached = await cacheService.get<ServerStatusResult>(cacheKey);
    if (cached) return cached;

    const baseResult: ServerStatusResult = {
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      type: server.type,
      version: server.version,
      description: server.description,
      online: false,
      players: { online: 0, max: 0 },
      hasPlan: server.hasPlan,
      hasLuckPerms: server.hasLuckPerms,
      lastUpdated: new Date().toISOString(),
    };

    try {
      const response = await util.status(server.host, server.port, {
        timeout: 3000,
        enableSRV: true,
      });

      const result: ServerStatusResult = {
        ...baseResult,
        online: true,
        players: {
          online: response.players.online,
          max: response.players.max,
          sample: response.players.sample || [],
        },
        motd: {
          clean: response.motd.clean,
          html: response.motd.html,
        },
        latency: response.roundTripLatency,
        favicon: response.favicon || undefined,
        lastUpdated: new Date().toISOString(),
      };

      // Cache for 30 seconds
      await cacheService.set(cacheKey, result, 30);
      return result;
    } catch (err: any) {
      // Server is offline or unreachable
      const offlineResult: ServerStatusResult = {
        ...baseResult,
        online: false,
        lastUpdated: new Date().toISOString(),
      };

      // Cache offline result for 15 seconds
      await cacheService.set(cacheKey, offlineResult, 15);
      return offlineResult;
    }
  }

  async getAllServers(): Promise<ServerStatusResult[]> {
    const promises = GAME_SERVERS.map((server) => this.pingServer(server));
    return Promise.all(promises);
  }

  async getServerById(id: string): Promise<ServerStatusResult | null> {
    const server = GAME_SERVERS.find((s) => s.id === id);
    if (!server) return null;
    return this.pingServer(server);
  }
}

export const pingService = new PingService();
