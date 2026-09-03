import express from 'express';
import cors from 'cors';
import { serversRouter } from './routes/servers';
import { playersRouter } from './routes/players';
import { statsRouter } from './routes/stats';
import { maintenanceRouter } from './routes/maintenance';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health & Version check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'petablocks-stats',
    version: '1.2.0',
    hostingProvider: 'MDRCloud Enterprise Infrastructure',
    providerUrl: 'https://mdrcloud.com',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (_req, res) => {
  res.json({
    service: 'petablocks-stats',
    version: '1.2.0',
    environment: 'production',
    hosting: {
      provider: 'MDRCloud',
      url: 'https://mdrcloud.com',
      datacenterHost: '10.20.110.116',
    },
    changelog: [
      { version: '1.2.0', notes: 'Multi-server SLP ping protocol, Redis caching, MDRCloud attribution' },
      { version: '1.0.0', notes: 'Initial player stats REST API with MariaDB connectivity' },
    ],
  });
});

// REST Routes
app.use('/api/servers', serversRouter);
app.use('/api/players', playersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/maintenance', maintenanceRouter);

app.listen(PORT, () => {
  console.log(`PETABLOCKS Stats API v1.2.0 (Powered by MDRCloud) listening on port ${PORT}`);
});
