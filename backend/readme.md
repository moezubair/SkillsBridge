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
│   │   ├── upload/                   # PDF validation, disk storage, upload service
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
├── run.ps1                           # Windows PowerShell: pick venv, run API
├── run.bat                           # Windows CMD: same
├── run.sh                            # macOS/Linux/Git Bash: same
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

Start only Postgres, then start the API:

```bash
make dev          # starts postgres in docker (needs Docker + make)
```

**Run the API (recommended — uses the right Python on Windows):**

| Shell | Command |
|-------|---------|
| PowerShell | `.\run.ps1` (if execution policy blocks scripts: `powershell -ExecutionPolicy Bypass -File .\run.ps1`) |
| CMD | `run.bat` |
| macOS / Linux / WSL | `chmod +x run.sh && ./run.sh` |

These scripts run `main.py` using, in order:

1. `../.lotushack` (repo virtualenv next to `backend/`)
2. `./venv` (classic `python -m venv venv` inside `backend/`)
3. `python` on your `PATH` (last resort — ensure it has `pip install -r requirements.txt`)

Equivalent manual command (after `Activate.ps1` / `source venv/bin/activate` so `python` is the venv):

```bash
python main.py
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

### PDF uploads

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/files/upload` | Multipart field `file` (PDF only); saves bytes under `UPLOAD_ROOT`, metadata in `uploaded_files` |
| `GET` | `/api/v1/files/{uuid}` | JSON metadata for a stored file |
| `GET` | `/api/v1/files/{uuid}/download` | Streams the PDF with original filename |

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
