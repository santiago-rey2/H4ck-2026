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

Stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```
