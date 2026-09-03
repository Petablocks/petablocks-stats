# Standard Operating Procedures (SOP) — PETABLOCKS Stats API

> **Target Audience**: AI Coding Assistants, Backend Engineers, and Automation Agents.
> **Repository Status**: PUBLIC on GitHub (`Petablocks/petablocks-stats`).
> **Scope**: Public REST API microservice (`api.petablocks.com` / port 3001).

---

## 1. Security & Sensitive Data Protection (MANDATORY)

Because this repository is **PUBLIC**:
1. **Zero Secrets in Git**:
   * NEVER commit database passwords, connection strings with embedded credentials, Redis auth strings, or internal cluster private IP addresses.
   * NEVER hardcode default credentials as fallbacks in production code (e.g. `const url = process.env.DATABASE_URL || 'mysql://user:realpassword@...'`).
2. **Environment Variables**:
   * All database and cache connections must be supplied via `process.env.DATABASE_URL` and `process.env.REDIS_URL`.
   * Update `.env.example` with dummy values whenever adding new configuration parameters.

---

## 2. Version Numbering Standards

Adheres to [Semantic Versioning 2.0.0](https://semver.org/):

$$\text{MAJOR}.\text{MINOR}.\text{PATCH}$$

* **PATCH ($1.2.\mathbf{X}$)**: SQL query optimizations, bug fixes, error handling improvements.
* **MINOR ($1.\mathbf{X}.0$)**: New public endpoints (e.g. `/api/maintenance/active`), new cache layers, data schema enhancements.
* **MAJOR ($\mathbf{X}.0.0$)**: Breaking REST API schema changes, endpoint deprecations.

### Mandatory Version Synchronization:
Whenever bumping the version, you MUST update:
1. `package.json` (`"version": "x.y.z"`)
2. `CHANGELOG.md` (`## [x.y.z] - YYYY-MM-DD` following Keep a Changelog)

---

## 3. Pre-Commit Quality Assurance & Build Checks

Before pushing any changes:
```bash
npm run build
```
* Must execute `tsc` and output clean JavaScript into `dist/` with **ZERO errors**.
* Never push broken code to `main`.

---

## 4. Deployment Pipeline

* **Node**: `PETABLOCKS-FEA` (`10.20.110.116`).
* **Container**: `petablocks-stats` managed via Dokploy.
* **Reverse Proxy**: Caddy exposing `https://api.petablocks.com` forwarding to port `3001`.
* **Database**: Read access to MariaDB `petablocks` database (Plan v5 & maintenance tables).
