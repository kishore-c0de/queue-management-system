# Queue System — Backend

Express + Prisma + MySQL + Socket.io + JWT.

## Setup

1. **Create a MySQL database** named `queue_system` (empty is fine — Prisma
   creates the tables for you):
   ```
   mysql -u root -p -e "CREATE DATABASE queue_system;"
   ```

2. **Configure environment variables.**
   ```
   cp .env.example .env
   ```
   Edit `.env`:
   - `DATABASE_URL` — your real MySQL user/password
   - `JWT_SECRET` — any long random string (a generator command is in the file)
   - `AI_API_KEY` — free key from https://console.groq.com (see root README)

3. **Install dependencies.**
   ```
   npm install
   ```

4. **Generate the Prisma client and create tables.**
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   This reads `prisma/schema.prisma` and creates the `services`, `tokens`,
   `daily_counters`, `admins`, and `daily_summaries` tables in MySQL.

5. **Seed a default admin + sample services.**
   ```
   npm run prisma:seed
   ```
   Creates admin login: `admin` / `admin123`, and 3 sample services.

6. **Run the server.**
   ```
   npm run dev
   ```
   You should see `Server running on http://localhost:5000`.

## Verify it works

```
curl http://localhost:5000/health
curl http://localhost:5000/api/services
curl -X POST http://localhost:5000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"customer_name": "Ravi", "service_id": 1}'
```

Get an admin token:
```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Use that token for protected routes:
```
curl -X PATCH http://localhost:5000/api/tokens/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "serving"}'
```

Generate the AI daily summary (requires `AI_API_KEY` set):
```
curl http://localhost:5000/api/summary/today \
  -H "Authorization: Bearer <token>"
```

## API summary

| Method | Path                        | Auth  | Purpose                        |
|--------|-----------------------------|-------|----------------------------------|
| GET    | /health                     | none  | Server + DB check                |
| POST   | /api/auth/login              | none  | Admin login -> JWT               |
| GET    | /api/services                | none  | List active services             |
| POST   | /api/services                | admin | Create a service                 |
| POST   | /api/tokens                  | none  | Customer joins the queue         |
| GET    | /api/tokens?status=waiting   | none  | List today's tokens              |
| PATCH  | /api/tokens/:id/status        | admin | Update a token's status          |
| GET    | /api/summary/today            | admin | Get/generate today's AI summary  |

Socket.io emits a `queue:updated` event (payload: `{ waiting: [...] }`)
whenever a token is created or its status changes.

## Concurrency-safe token numbers

`tokenController.js` uses `INSERT ... ON DUPLICATE KEY UPDATE counter = counter + 1`
against a `daily_counters` table inside a Prisma transaction. That single
SQL statement is atomic in MySQL, so simultaneous requests can't read the
same "before" value the way a naive `COUNT(*) + 1` would. The `UNIQUE KEY`
on `(token_number, queue_date)` in the schema is a second safety net.

## Deployment (Render or Railway)

1. Push this `backend/` folder to a GitHub repo (or a subfolder of one).
2. Create a new Web Service, root directory `backend`.
3. Build command: `npm install && npx prisma generate`
4. Start command: `npx prisma migrate deploy && npm start`
5. Set the same environment variables as your `.env` (`DATABASE_URL`,
   `JWT_SECRET`, `AI_API_KEY`, `AI_API_URL`, `AI_MODEL`) in the platform's
   dashboard — point `DATABASE_URL` at your hosted MySQL instance
   (Railway or Aiven both offer free-tier MySQL).
6. Note the deployed URL — the frontend's `VITE_API_URL` and
   `VITE_SOCKET_URL` need to point at it.
