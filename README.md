# 📊 PETABLOCKS Stats API (`petablocks-stats`)

> High-performance REST API providing real-time player statistics, lifetime leaderboards, and Minecraft skin resolution for the PETABLOCKS ecosystem.
>
> 🚀 **Hosted & Powered by [MDRCloud](https://mdrcloud.co.uk)** • **Version**: `v1.1.0` • **Endpoint**: `https://stats.petablocks.com`

---

## 🌟 Endpoints

* **`GET /api/players/:usernameOrUuid`**: Full player profile with lifetime playtime, rank, mob kills, deaths, KDR, and 3D skin CDN renders.
* **`GET /api/players/leaderboard/playtime`**: Lifetime network playtime leaderboard sorted descending.
* **`GET /api/server`**: Aggregate network concurrency and online player roster.
* **`GET /api/health`**: API health check, database status, and MDRCloud hosting provider info.
* **`GET /api/version`**: API version badge and ecosystem release metadata.

---

## 🛠️ Architecture

* **Database Engine**: MariaDB 11 on `PETABLOCKS-DB` (`10.20.110.117:3307`) querying Plan v5 tables (`plan_users`, `plan_sessions`, `plan_user_info`).
* **Caching**: Redis on `10.20.110.117:6379` with 30s-60s TTL for fast repeated lookups.
* **Skin Resolution**: [mc-heads.net](https://mc-heads.net) CDN + Mojang Session API.
