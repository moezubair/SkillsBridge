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

### PDF uploads (job vs school)

**Job (CV / career)** — metadata in `job_uploaded_files`, files under `UPLOAD_ROOT/jobs/…`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/job/files/upload` | Multipart `file` (PDF); `jobs/{uuid}.pdf` |
| `GET` | `/api/v1/job/files/{job_file_id}` | JSON metadata |
| `GET` | `/api/v1/job/files/{job_file_id}/download` | Stream PDF |
| `POST` | `/api/v1/job/files/{job_file_id}/extract-cv` | LandingAI CV extract → `cv_extractions` |
| `GET` | `/api/v1/job/files/{job_file_id}/cv-extraction` | Latest CV extraction row |

**School (transcript)** — metadata in `school_uploaded_files`, files under `UPLOAD_ROOT/school/…`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/school/files/upload` | Multipart `file` (PDF); `school/{uuid}.pdf` |
| `GET` | `/api/v1/school/files/{school_file_id}` | JSON metadata |
| `GET` | `/api/v1/school/files/{school_file_id}/download` | Stream PDF |
| `POST` | `/api/v1/school/files/{school_file_id}/extract-transcript` | LandingAI transcript extract → `transcript_extractions` |
| `GET` | `/api/v1/school/files/{school_file_id}/transcript-extraction` | Latest transcript row |

Query param on extract: `schema_version` (`cv_v1` / `transcript_v1`). Requires `LANDINGAI_API_KEY`.

Downstream: `job_file_id` on `/api/v1/job-preferences`, `/api/v1/jobs/search`; `school_file_id` on `/api/v1/student-extras`, `/api/v1/school-matches/harvard`.

### TinyFish: job search vs Harvard school match

Both flows stay **separate** (different uploads, repos, and file ids). They share only the **TinyFish client** pattern: **one** automation run per request — URL + natural-language goal → agent output coerced to JSON.

| Flow | URL setting | Goal built from | Primary outcome |
|------|-------------|-----------------|-----------------|
| Job search | `TINYFISH_JOB_SEARCH_URL` | CV extraction + job preferences (DB) + optional per-request `target_role`; goal asks for gap arrays vs profile | Structured job listing JSON + `missing_or_weak_vs_job` / `improvements_to_close_gaps` → normalized; optional OpenAI learning plan JSON |

**Job search** `POST /api/v1/jobs/search` body:

- `job_file_id` (required).
- `target_role` (optional) — free-text primary role for this run only (also stored on `preferences_snapshot` for the run).
- `include_learning_plan` (optional, default `true`) — if `OPENAI_API_KEY` is set, after TinyFish the API calls OpenAI with `response_format: json_object` to build a staged roadmap (`stages` with timeline, activities, resources, reason, difficulty, impact). If the key is missing or the call fails, the listing is still returned with `learning_plan: null`.

**Limitation:** On many job boards the agent only sees **snippets** on the listing page, not the full job description — gap analysis may be incomplete until a detail-page step is added.
| Harvard match | `HARVARD_CATALOG_URL` | Latest transcript extraction + optional IELTS/skills from **student_extras** row | Ranked majors JSON → `HarvardMatchResponse` |

**Harvard** `POST /api/v1/school-matches/harvard` body (IDs only):

- `school_file_id` (optional) — transcript upload id; loads latest transcript extraction from `transcript_extractions`.
- `ielts_id` (optional) — UUID of a row in `student_extras` (returned by `PUT`/`GET` `/api/v1/student-extras`). Loads IELTS + skills from Postgres (JSONB on that row, not a separate file). If `school_file_id` is omitted, it is inferred from this row. If both are sent, they must refer to the same upload or the API returns 404.

At least one of `school_file_id` or `ielts_id` is required.

Seed major names from `app/data/harvard_majors_seed.json` are passed **into the goal text** as context (Option A: no separate TinyFish catalog scrape on the match hot path). If TinyFish is missing, times out, or returns no parseable list, the service falls back to the local heuristic (`catalog_source` will be `heuristic_*`).

Env: `TINYFISH_API_KEY`, `TINYFISH_BASE_URL`, `TINYFISH_SSE_TIMEOUT_SECONDS`, `HARVARD_CATALOG_URL`, `TINYFISH_HARVARD_TIMEOUT_SECONDS`. The Harvard catalog DB cache (`harvard_catalog_cache`) may still exist for other tooling but is **not** used in the match service path.

Legacy table `uploaded_files` is kept only for startup backfill when migrating old rows.

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
| `LANDINGAI_API_KEY` | (empty)          | Required for `/extract-cv` |
| `LANDINGAI_BASE_URL` | `https://api.va.landing.ai` | ADE API host        |
| `LANDINGAI_PARSE_MODEL` | `dpt-2-latest` | PDF → markdown model   |
| `LANDINGAI_EXTRACT_MODEL` | `extract-latest` | Schema extract model |
| `OPENAI_API_KEY` | (empty) | Optional; job learning plan + school assessments |
| `OPENAI_JOB_LEARNING_MODEL` | `gpt-4o-mini` | Chat model for job learning-plan JSON |

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
