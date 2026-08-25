# petablocks-stats

Player Stats REST API for [stats.petablocks.com](https://stats.petablocks.com). Built with **Node.js + Express + TypeScript**, backed by MariaDB on PETABLOCKS-DB.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stats` | Leaderboard — top 100 players by playtime |
| `GET` | `/api/stats/:uuid` | Single player stats by UUID |

## Development

```bash
npm install
cp .env.example .env
# Edit .env with your local DB credentials
npm run dev
```

## Database Schema

The API expects a `player_stats` table in the `petablocks` database:

```sql
CREATE TABLE player_stats (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uuid            VARCHAR(36) NOT NULL UNIQUE,
  username        VARCHAR(16) NOT NULL,
  playtime_seconds BIGINT DEFAULT 0,
  kills           INT DEFAULT 0,
  deaths          INT DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

This table is populated by your MC stats plugin (e.g. StatsCore, Essentials, or custom plugin).

## Deployment

Automatically deployed to `PETABLOCKS-FEA (10.20.110.116)` via GitHub Actions on every push to `main`.
Requires the `DISCORD_WEBHOOK` secret in repository settings.
