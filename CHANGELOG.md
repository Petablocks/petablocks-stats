# 📝 PETABLOCKS Stats API — Changelog

All notable changes to the PETABLOCKS Player Statistics & Analytics API will be documented in this file.

---

## [1.1.0] - 2026-08-26
### Added
- **Plan v5 Database Aggregation**: Directly computes lifetime playtime, mob kills, deaths, KDR, and first joined / last seen timestamps from `plan_sessions` and `plan_users` tables on MariaDB port `:3307`.
- **High-Reliability Skin CDN**: Migrated 3D body renders, avatars, and skin downloads to `mc-heads.net` CDN.
- **Dedicated Version & Health Endpoints**: Added `GET /api/version` and updated `GET /api/health` with MDRCloud infrastructure provider attribution and uptime stats.
- **Debug & Diagnostic Tools**: Added `GET /api/players/debug/schema` for live table discovery.

### Fixed
- Fixed database port mapping to connect to `pb-mariadb-mc` on `10.20.110.117:3307`.
- Fixed UUID dash formatting for consistent Mojang profile lookups.

---

## [1.0.0] - 2026-08-20
### Added
- Initial REST API with Redis caching and player profile endpoints.
