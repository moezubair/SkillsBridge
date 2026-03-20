# Backend — UniPath API

FastAPI backend with PostgreSQL, async connection pooling, and dependency injection.

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── schemas/
│   │       │   ├── req/              # Request schemas
│   │       │   └── res/              # Response schemas
│   │       ├── health.py             # Health endpoint
│   │       └── router.py             # API router aggregation
│   ├── config/
│   │   └── settings.py               # Configuration with pydantic-settings
│   ├── core/
│   │   ├── redis_client.py           # Redis connection manager
│   │   ├── postgres_client.py        # PostgreSQL connection pool
│   │   └── exceptions.py             # Custom exceptions
│   ├── models/
│   │   └── base.py                   # Base models and enums
│   ├── repositories/
│   │   └── base_repository.py        # Repository base class
│   ├── services/
│   │   └── base_service.py           # Service base class
│   └── dependencies.py               # FastAPI dependencies
├── tests/
├── deployment/
│   ├── docker-compose.yml            # Full stack (app + postgres)
│   └── docker-compose.dev.yml        # Postgres only (for local dev)
├── main.py                           # Application entry point
├── Makefile
├── Dockerfile
├── requirements.txt
└── .env.example
```

## Setup

### 1. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

### 2. Copy the environment file

```bash
cp .env.example .env
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start infrastructure and run

**Option A — Local development (recommended)**

Start only Postgres, run the app yourself:

```bash
make dev          # starts postgres in docker
python main.py    # runs the fastapi app locally
```

**Option B — Full Docker stack**

```bash
make up           # builds and starts app + postgres
```

The API will be available at `http://localhost:8000`.

## Makefile Commands

| Command      | Description                              |
|--------------|------------------------------------------|
| `make up`    | Build and start all services (app + pg)  |
| `make dev`   | Start only postgres for local dev        |
| `make down`  | Stop all services                        |
| `make clean` | Stop all services and delete volumes     |
| `make logs`  | Tail logs                                |
| `make ps`    | Show running containers                  |

## API Endpoints

### Health Check

```
GET /api/v1/health
```

```json
{
  "status": "healthy",
  "service": "FastAPI Service",
  "version": "1.0.0",
  "dependencies": [
    { "name": "redis", "status": true },
    { "name": "postgres", "status": true }
  ]
}
```

Status values: `healthy` (all good), `degraded` (one or more dependencies down).

## Environment Variables

See `.env.example` for all options.

| Variable            | Default          | Description                |
|---------------------|------------------|----------------------------|
| `APP_NAME`          | FastAPI Service  | Application name           |
| `APP_VERSION`       | 1.0.0            | Application version        |
| `ENVIRONMENT`       | development      | development/staging/prod   |
| `DEBUG`             | true             | Enable debug & auto-reload |
| `LOG_LEVEL`         | DEBUG            | DEBUG/INFO/WARNING/ERROR   |
| `HOST`              | 0.0.0.0          | Server host                |
| `PORT`              | 8000             | Server port                |
| `REDIS_HOST`        | localhost         | Redis host                 |
| `REDIS_PORT`        | 6379             | Redis port                 |
| `POSTGRES_HOST`     | localhost         | PostgreSQL host            |
| `POSTGRES_PORT`     | 5432             | PostgreSQL port            |
| `POSTGRES_DB`       | app_db           | Database name              |
| `POSTGRES_USER`     | postgres         | Database user              |
| `POSTGRES_PASSWORD` | postgres         | Database password          |

## Testing

```bash
pytest
pytest --cov=app --cov-report=html
```

## Architecture Principles

- **No global singletons** — services initialized in `lifespan()`, stored in `app.state`
- **Dependency injection** — via `Depends()` from `app/dependencies.py`
- **Settings as constructor params** — never read inside classes
- **Testability** — use `app.dependency_overrides` for mocking
