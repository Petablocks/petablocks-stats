import { Router, Request, Response } from 'express';
import { pingService } from '../services/ping.service';

export const serversRouter = Router();

// GET /api/servers — Get live status for all 3 PETABLOCKS game servers
serversRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const servers = await pingService.getAllServers();
    const totalOnline = servers.reduce((acc, s) => acc + (s.online ? s.players.online : 0), 0);
    const totalMax = servers.reduce((acc, s) => acc + (s.online ? s.players.max : 0), 0);

    res.json({
      totalPlayersOnline: totalOnline,
      totalMaxPlayers: totalMax,
      servers,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching servers:', err);
    res.status(500).json({ error: 'Failed to query servers' });
  }
});

// GET /api/servers/:id — Get status for a specific server (e.g. 'fabric-main', 'create-2', 'create-patreon')
serversRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const server = await pingService.getServerById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    return res.json(server);
  } catch (err: any) {
    console.error(`Error fetching server ${req.params.id}:`, err);
    return res.status(500).json({ error: 'Failed to query server' });
  }
});
