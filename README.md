# H4ck-2026

## Docker

### Development stack

Uses live-reload in both backend and frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Services:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/healthz
- Postgres: localhost:5432

Database seeding:

- On backend startup (after DB is healthy), the app auto-seeds data up to at least 100 active items.
- Seeded links now use real, reachable documentation URLs (no synthetic `/resource/...` paths).
- Legacy seeded links are auto-repaired on startup when detected.
- The seed also guarantees showcase link items for each frontend link card type: `web`, `video`, `location`, `reel`, and `social`.
- Seed controls are environment-based and enabled by default in Docker:
  - `SEED_ENABLED` (default `true`)
  - `SEED_MIN_ITEMS` (default `100`)
  - `SEED_RANDOM_SEED` (default `2026`)

Link preview behavior:

- `GET /items/{item_id}/link-preview` retries against the domain homepage when the stored URL returns upstream `404`, improving resilience for stale links.

Frontend item creation:

- The right sidebar `Entrada` panel now creates real items via `POST /items/`.
- The frontend sends only the entered content; format assignment is handled by the backend.
- Categories/tags are assigned automatically by the backend.

Stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

### Production-style stack

Builds static frontend with nginx and proxies `/api/*` to backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Service:

- Frontend (nginx): http://localhost
- Proxied backend health: http://localhost/api/healthz
- Seeded paginated items endpoint: http://localhost/api/items/?skip=0&limit=20

Stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```
