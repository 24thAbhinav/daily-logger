## daily / logger

A local-first daily learning log. Add notes to a specific date, search across them, and keep the archive private by default.

### Run locally

1. Start PostgreSQL: `docker compose up -d postgres`
2. Start the API:

   ```bash
   cd backend
   cp .env.example .env
   uvicorn app.main:app --reload --app-dir .
   ```

3. Start the web app:

   ```bash
   cd frontend
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```

Open http://localhost:3000. Sign-in is required to access entries. To enable OAuth, add Google credentials and a shared `BETTER_AUTH_SECRET` in `frontend/.env.local`, register the callback at `/api/auth/callback/google`, then run Better Auth's schema migration (`npx @better-auth/cli migrate`). Set the same `BETTER_AUTH_SECRET` in the backend environment.

The frontend uses Better Auth for social login, Zustand for client state, and calls the FastAPI API at `NEXT_PUBLIC_API_URL`. The API uses Pydantic schemas, SQLAlchemy async models, and PostgreSQL.
