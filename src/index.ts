import express from 'express';
import cors from 'cors';
import { serversRouter } from './routes/servers';
import { playersRouter } from './routes/players';
import { statsRouter } from './routes/stats';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'petablocks-stats',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
  });
});

// REST Routes
app.use('/api/servers', serversRouter);
app.use('/api/players', playersRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`PETABLOCKS Stats API v1.1.0 listening on port ${PORT}`);
});
