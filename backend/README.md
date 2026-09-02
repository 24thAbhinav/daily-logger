# Daily Logger API

```bash
cp .env.example .env
uv sync  # from the repository root, after adding backend deps to your environment
uvicorn app.main:app --reload --app-dir backend
```

The API creates its tables on startup. For local Postgres, run `docker compose up -d postgres` from the repository root.
