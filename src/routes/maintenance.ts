import { Router } from 'express';
import { getPool } from '../db';

export const maintenanceRouter = Router();

maintenanceRouter.get('/active', async (_req, res) => {
  try {
    const pool = getPool();
    const now = Date.now();
    const upcomingThreshold = now + 24 * 60 * 60 * 1000;

    const [rows]: any = await pool.query(
      `SELECT * FROM maintenance_windows
       WHERE status = 'in_progress' 
          OR (status = 'scheduled' AND start_time <= ?)
       ORDER BY CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END, start_time ASC`,
      [upcomingThreshold]
    );

    const windows = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      serverIds: typeof r.server_ids === 'string' ? JSON.parse(r.server_ids) : (r.server_ids || []),
      status: r.status,
      startTime: Number(r.start_time),
      estimatedDurationMin: r.estimated_duration_min,
      endTime: r.end_time ? Number(r.end_time) : null,
    }));

    res.json({
      hasActive: windows.some((w: any) => w.status === 'in_progress'),
      hasScheduled: windows.some((w: any) => w.status === 'scheduled'),
      windows,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve active maintenance', message: err.message });
  }
});
