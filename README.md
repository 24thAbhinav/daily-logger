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

Open http://localhost:3000. The app works in local demo mode immediately. To enable OAuth, add Google and X credentials in `frontend/.env.local`, register callbacks at `/api/auth/callback/google` and `/api/auth/callback/twitter`, then run Better Auth's schema migration (`npx @better-auth/cli migrate`).

The frontend uses Better Auth for social login, Zustand for client state, and calls the FastAPI API at `NEXT_PUBLIC_API_URL`. The API uses Pydantic schemas, SQLAlchemy async models, and PostgreSQL.
