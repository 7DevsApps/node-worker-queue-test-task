# Async Job Processing System

Reliable async job processing with REST API, PostgreSQL persistence, BullMQ queue, and exponential backoff retries.

## Quick Start

```bash
docker-compose up -d        # Start Postgres + Redis
npm install                  # Install dependencies
npm run migrate              # Create database tables
npm run start:api            # Start API server (port 3000)
npm run start:worker         # Start worker (separate terminal)
```

## API

| Method | Endpoint      | Description                          |
|--------|---------------|--------------------------------------|
| POST   | /jobs         | Create a new job                     |
| GET    | /jobs/:id     | Get job by ID                        |
| GET    | /jobs?status= | List jobs, optional status filter    |

## Usage Examples

**completed** — job succeeds on first attempt:

```bash
curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d '{"task":"email","payload":{"forceFailure":false}}'
```

**failed** — job fails all 5 attempts, ends up as failed:

```bash
curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d '{"task":"report","payload":{"forceFailure":true}}'
```

**retrying** — same as failed, but check status while retries are in progress:

```bash
curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d '{"task":"sync","payload":{"forceFailure":true}}'
# immediately check — status will be "retrying" between attempts:
curl http://localhost:3000/jobs?status=retrying
```

**queued** — stop the worker, then create a job:

```bash
# 1. Stop npm run start:worker (Ctrl+C)
# 2. Create a job — it will stay queued with no worker to pick it up:
curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d '{"task":"idle","payload":{}}'
curl http://localhost:3000/jobs?status=queued
# 3. Restart worker to resume processing: npm run start:worker
```

**random** — 40% failure chance (default behavior):

```bash
curl -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d '{"task":"process","payload":{}'
```

Filter by any status:

```bash
curl "http://localhost:3000/jobs?status=completed"
curl "http://localhost:3000/jobs?status=failed"
curl "http://localhost:3000/jobs?status=retrying"
curl "http://localhost:3000/jobs?status=queued"
curl "http://localhost:3000/jobs?status=processing"
```

Get job by ID:

```bash
curl http://localhost:3000/jobs/<id>
```

## Architecture

API → PostgreSQL + Redis/BullMQ → Worker → PostgreSQL

The database is the source of truth. The worker runs as a separate process.
