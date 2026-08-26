import { Router, Request, Response } from 'express';
import { playerService } from '../services/player.service';
import { getPool } from '../db';

export const playersRouter = Router();

// GET /api/players/debug/schema — Debug schema & tables
playersRouter.get('/debug/schema', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    const [tables]: any = await pool.query('SHOW TABLES');
    let planUsersSample: any = [];
    let planUserInfoSample: any = [];
    let planSessionsSample: any = [];
    let schemaErrors: any = {};

    try {
      const [u]: any = await pool.query('SELECT * FROM plan_users LIMIT 5');
      planUsersSample = u;
    } catch (e: any) {
      schemaErrors.plan_users = e.message;
    }

    try {
      const [info]: any = await pool.query('SELECT * FROM plan_user_info LIMIT 5');
      planUserInfoSample = info;
    } catch (e: any) {
      schemaErrors.plan_user_info = e.message;
    }

    try {
      const [s]: any = await pool.query('SELECT * FROM plan_sessions LIMIT 5');
      planSessionsSample = s;
    } catch (e: any) {
      schemaErrors.plan_sessions = e.message;
    }

    res.json({
      dbUrlConfigured: Boolean(process.env.DATABASE_URL),
      tables,
      schemaErrors,
      planUsersSample,
      planUserInfoSample,
      planSessionsSample,
    });
  } catch (err: any) {
    res.json({
      error: true,
      errorMessage: err.message,
      errorCode: err.code,
      stack: err.stack,
    });
  }
});

// GET /api/players/leaderboard/:type — Leaderboard (e.g. playtime)
playersRouter.get('/leaderboard/:type?', async (req: Request, res: Response) => {
  try {
    const type = (req.params.type as 'playtime' | 'kills') || 'playtime';
    const limit = Math.min(parseInt(req.query.limit as string || '25', 10), 100);
    const leaderboard = await playerService.getLeaderboard(type, limit);
    res.json({
      type,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to query leaderboard' });
  }
});

// GET /api/players/:query — Player profile by username or UUID
playersRouter.get('/:query', async (req: Request, res: Response) => {
  try {
    const profile = await playerService.getPlayerProfile(req.params.query);
    if (!profile) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.json(profile);
  } catch (err: any) {
    console.error(`Error fetching player ${req.params.query}:`, err);
    return res.status(500).json({ error: 'Failed to query player' });
  }
});
