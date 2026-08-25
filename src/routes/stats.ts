import { Router, Request, Response } from 'express';
import { getPool } from '../db';

export const statsRouter = Router();

// GET /api/stats — leaderboard (top 100 by playtime)
statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT
        rank() OVER (ORDER BY playtime_seconds DESC) AS rank,
        username,
        uuid,
        playtime_seconds,
        kills,
        deaths
       FROM player_stats
       ORDER BY playtime_seconds DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('Stats query error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/stats/:uuid — single player stats by UUID
statsRouter.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM player_stats WHERE uuid = ? LIMIT 1',
      [req.params.uuid]
    );
    const players = rows as unknown[];
    if (players.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.json(players[0]);
  } catch (err) {
    console.error('Player stats query error:', err);
    return res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});
