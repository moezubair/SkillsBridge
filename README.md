## TO Run Frontend

```bash
cd d:\LotusHack26\SkillsBridge\frontend
npm install
npm run dev

```

## TO Run Backend

### Setting up docker first

```bash
cd d:\LotusHack26\SkillsBridge\backend
docker compose -f deployment/docker-compose.dev.yml -p lotushack-dev up -d

```

From `SkillsBridge/backend` (Postgres/Redis up per `backend/readme.md`):

- **PowerShell:** `.\run.ps1`
- **CMD:** `run.bat`

Both prefer `..\.lotushack\Scripts\python.exe`, then `venv\Scripts\python.exe`, then `python` on PATH.
