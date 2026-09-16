# Queue System — Frontend

React (Vite) — customer join/status pages + admin dashboard.

## Setup

1. Make sure the backend is running first (see `../backend/README.md`).
2. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Defaults point at `http://localhost:5000` — fine for local dev.
3. Install and run:
   ```
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173`.

## Pages

- `/` — customer joins the queue (name + service)
- `/status/:tokenId` — live position, updates via Socket.io without refreshing
- `/admin/login` — admin login (seeded: `admin` / `admin123`)
- `/admin` — dashboard: manage waiting tokens (Serve / Skip / Complete), generate AI summary

## Deployment (Vercel)

1. Push `frontend/` to GitHub. Import the project in Vercel, root
   directory `frontend`.
2. Framework: Vite. Build command `npm run build`, output `dist`
   (auto-detected).
3. Environment variables:
   - `VITE_API_URL` — deployed backend URL + `/api`
   - `VITE_SOCKET_URL` — deployed backend URL (no path)
