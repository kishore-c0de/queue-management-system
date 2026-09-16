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

1. Push `frontend/` to GitHub (or a subfolder of your repo).
2. Import the project in Vercel, set root directory to `frontend`.
3. Build command: `npm run build`, output directory: `dist` (Vercel
   detects this automatically for Vite).
4. Set environment variables in the Vercel dashboard:
   - `VITE_API_URL` — your deployed backend URL + `/api`
   - `VITE_SOCKET_URL` — your deployed backend URL (no path)
