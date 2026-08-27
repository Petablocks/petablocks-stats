export interface GameServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  type: 'fabric' | 'neoforge';
  version: string;
  hasPlan: boolean;
  hasLuckPerms: boolean;
  description: string;
}

export const GAME_SERVERS: GameServerConfig[] = [
  {
    id: 'fabric-main',
    name: 'PETABLOCKS Modpack Server',
    host: process.env.SERVER_FABRIC_HOST || 'play.petablocks.com',
    port: parseInt(process.env.SERVER_FABRIC_PORT || '11691', 10),
    type: 'fabric',
    version: '1.20.1',
    hasPlan: true,
    hasLuckPerms: true,
    description: 'Main Fabric 1.20.1 Modpack Server',
  },
  {
    id: 'create-2',
    name: 'PETABLOCKS Create 2',
    host: process.env.SERVER_CREATE2_HOST || 'create2.petablocks.com',
    port: parseInt(process.env.SERVER_CREATE2_PORT || '11681', 10),
    type: 'neoforge',
    version: '1.21.1',
    hasPlan: false,
    hasLuckPerms: false,
    description: 'NeoForge 1.21.1 Create 2 Server',
  },
  {
    id: 'create-patreon',
    name: 'PETABLOCKS Patreon Server',
    host: process.env.SERVER_PATREON_HOST || 'createcreative.petablocks.com',
    port: parseInt(process.env.SERVER_PATREON_PORT || '11651', 10),
    type: 'neoforge',
    version: '1.21.1',
    hasPlan: false,
    hasLuckPerms: false,
    description: 'NeoForge 1.21.1 Patreon Creative Server',
  },
];
