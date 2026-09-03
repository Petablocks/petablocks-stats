# 📊 PETABLOCKS Stats API (`petablocks-stats`)

> High-performance REST API providing real-time player statistics, lifetime leaderboards, network maintenance state, and Minecraft skin resolution for the PETABLOCKS ecosystem.
>
> 🚀 **Hosted & Powered by [MDRCloud](https://mdrcloud.co.uk)** • **Version**: `v1.2.0` • **Endpoint**: `https://api.petablocks.com` / `https://stats.petablocks.com`

---

## 🌟 Endpoints

* **`GET /api/maintenance/active`**: Exposes currently running and upcoming scheduled maintenance windows with affected server IDs and countdown timestamps.
* **`GET /api/players/:usernameOrUuid`**: Full player profile with lifetime playtime, rank, mob kills, deaths, KDR, and 3D skin CDN renders.
* **`GET /api/players/leaderboard/playtime`**: Lifetime network playtime leaderboard sorted descending.
* **`GET /api/server`**: Aggregate network concurrency and online player roster.
* **`GET /api/health`**: API health check, database status, and MDRCloud hosting provider info.
* **`GET /api/version`**: API version badge and ecosystem release metadata.

---

## 📜 Standard Operating Procedures

This repository is **PUBLIC**. All contributors and AI agents must strictly follow **[`STANDARD_PROCEDURES.md`](./STANDARD_PROCEDURES.md)**:
* **Zero Secrets in Git**: Database passwords, Redis auth, and cluster private IPs must never be hardcoded.
* Provide clean `.env.example` templates for configuration.
* All changes must bump the version and be logged in `CHANGELOG.md`.

---

## 🛠️ Architecture

* **Database Engine**: MariaDB 11 on `PETABLOCKS-DB` (`10.20.110.117:3307`) querying Plan v5 tables and maintenance tables.
* **Caching**: Redis with 30s-60s TTL for fast repeated lookups.
* **Skin Resolution**: [mc-heads.net](https://mc-heads.net) CDN + Mojang Session API.
* **Deployment**: Docker container on `PETABLOCKS-FEA` (`10.20.110.116`).
