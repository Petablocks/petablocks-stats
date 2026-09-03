# 📝 PETABLOCKS Stats API — Changelog

All notable changes to the PETABLOCKS Player Statistics & Analytics API will be documented in this file.

---

## [1.2.0] - 2026-09-03
### Added
- **🔴 Public Active Maintenance Endpoint (`GET /api/maintenance/active`)**:
  - Exposes active and upcoming maintenance windows for consumption by `petablocks-website` (`<MaintenanceBanner />`).
  - Queries MariaDB `maintenance_windows` table with server list parsing, status ordering, and 24-hour lookahead filter.
- **📜 Standard Operating Procedures (`STANDARD_PROCEDURES.md`)**:
  - Detailed operational instructions for AI agents regarding SemVer versioning, build checks, and public repo security.

### Security
- **🛡️ Public Repository Security Sanitization**:
  - Stripped hardcoded database fallback password from `src/db.ts`.
  - Added `.env.example` template with clean documentation.

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
