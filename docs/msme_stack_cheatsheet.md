# MSME OS - Architecture Cheat Sheet (Paste into Antigravity IDE)

## Quick Decisions
- **Financial / transactional data**: PostgreSQL (ACID, strong constraints)
- **Flexible JSON & metadata**: MongoDB (Mongoose)
- **Cache / Sessions / Locks**: Redis
- **Full-text / UI search**: Meilisearch (lightweight) or Elasticsearch (advanced)
- **Background jobs**: BullMQ (Redis) or RabbitMQ
- **File storage**: S3 or MinIO
- **Real-time**: Socket.IO (self-host) or Pusher/Ably (managed)

---

## Recommended module-to-technology mapping
- **Billing & Ledger**: PostgreSQL + Prisma (transactions, constraints)
- **Inventory & Products**: PostgreSQL (stock counts) + Redis (fast cache)
- **Invoices & PDF generation**: Postgres (records) + BullMQ (queue) + S3/MinIO (storage)
- **Users & Permissions**: Postgres (relations)
- **Activity Logs / Audit / Dynamic Templates**: MongoDB (collections)
- **Search**: Index Postgres data into Meilisearch/Elasticsearch
- **Notifications**: Queue + Socket.IO or managed service
- **Observability**: Winston/Pino logs, OpenTelemetry traces, Prometheus metrics, Grafana dashboards

---

## Recommended Libraries (Node + TypeScript)
- **Frameworks**: Express, NestJS (opinionated), Fastify (performance)
- **Postgres ORM**: Prisma (recommended), Drizzle (lightweight)
- **MongoDB**: Mongoose or native driver
- **Queues**: BullMQ (Redis)
- **Search**: Meilisearch, Elasticsearch
- **Storage**: AWS SDK (S3), MinIO client, Cloudinary (images)
- **Auth**: JWT, OAuth libraries, Passport or custom strategies
- **Testing**: Jest, Supertest, Playwright (E2E)

---

## Dev & Ops (local)
Use Docker Compose to run:
- postgres
- mongo
- redis
- meilisearch
- pgadmin (optional)

Backups:
- Postgres: pg_dump/pg_restore
- Mongo: mongodump/mongorestore

---

## Practical Rules-of-Thumb
1. Financial/accounting data → **Postgres**
2. Logs and flexible JSON → **MongoDB**
3. Fast ephemeral data → **Redis**
4. Full-text search & analytics → **Meilisearch/Elasticsearch**
5. Use job queues for CPU/IO heavy jobs (PDF, emails, reconciliation)

---

## Files you may want to add to the repo
- `prisma/schema.prisma`
- `docker-compose.yml`
- `.env.example`
- `scripts/migrate-mongo.js` (if migrating existing Mongo data to Postgres)
- `scripts/backup.sh` (db backups)

--- 
Generated for: Deepu — paste into Antigravity IDE or save as a project reference.
