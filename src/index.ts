import express from 'express';
import cors from 'cors';
import { statsRouter } from './routes/stats';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'petablocks-stats', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`PETABLOCKS Stats API listening on port ${PORT}`);
});
