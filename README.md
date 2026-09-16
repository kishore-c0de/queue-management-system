# Real-Time Queue & Token Management System

React + Express + MySQL (via Prisma) + Socket.io + JWT, with an
AI-generated daily summary powered by a single REST call to Groq/OpenAI.

```
queue-management-system/
├── backend/     Express API + Prisma + Socket.io   (see backend/README.md)
└── frontend/    React (Vite) customer + admin UI    (see frontend/README.md)
```

## Quick start (local)

**1. Backend**
```
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, AI_API_KEY
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                 # http://localhost:5000
```

**2. Frontend** (new terminal)
```
cd frontend
cp .env.example .env        # defaults are fine for local dev
npm install
npm run dev                 # http://localhost:5173
```

**3. Try it**
- Open `http://localhost:5173` → join the queue as a customer.
- Open `http://localhost:5173/admin/login` → log in with `admin` / `admin123`.
- In the admin dashboard, click **Serve** on a token, then watch the
  customer's tab update live (no refresh) via Socket.io.
- Click **Generate Summary** to trigger the AI call.

## Getting a free AI API key (Groq)

1. Go to https://console.groq.com and sign up (free).
2. Create an API key.
3. Put it in `backend/.env` as `AI_API_KEY`.

Groq's API is OpenAI-compatible, so if you'd rather use OpenAI directly,
just change `AI_API_URL` to `https://api.openai.com/v1/chat/completions`
and `AI_MODEL` to a model you have access to (e.g. `gpt-4o-mini`).

## How the pieces fit together

- **Prisma** replaces hand-written SQL with a schema file
  (`backend/prisma/schema.prisma`) and a generated, type-safe query
  client. `npx prisma migrate dev` reads that schema and creates/updates
  the actual MySQL tables for you.
- **JWT auth** protects only admin actions (create service, update token
  status, view AI summary). Customers never log in — joining the queue
  and checking status are open endpoints, matching the "2 roles, no
  complex RBAC" requirement.
- **Socket.io** broadcasts a `queue:updated` event to every connected
  client whenever a token is created or changes status. The customer's
  status page and the admin dashboard both listen for this and refetch
  instead of polling.
- **Concurrency-safe token numbers**: see the big comment in
  `backend/src/controllers/tokenController.js` — a single atomic
  `INSERT ... ON DUPLICATE KEY UPDATE` statement avoids the classic
  race condition, backed by a `UNIQUE` constraint as a safety net.
- **AI summary**: `backend/src/utils/aiSummary.js` is the entire AI
  integration — one `fetch()` call to a chat-completions endpoint with
  the day's computed stats as the prompt. No ML libraries involved.

## Deployment (Step 7)

See the "Deployment" sections in `backend/README.md` and
`frontend/README.md` — backend on Render/Railway, frontend on Vercel,
MySQL on Railway or Aiven's free tier.

## What I verified before handing this to you

- `npm install` succeeds in both `backend/` and `frontend/`.
- Every backend `.js` file passes a Node syntax check.
- `npm run build` succeeds for the frontend (Vite/React compiles cleanly).
- I could **not** run `npx prisma generate` / `migrate` or actually hit a
  MySQL database in the environment I built this in (no DB, and Prisma's
  engine binaries aren't reachable from that sandbox) — so run those
  steps yourself first and shout if anything doesn't line up with what's
  documented here.

## Still matches your original constraints

Single business (no multi-tenancy), 2 roles only, no QR/WhatsApp/payments.
Everything is built — but if you're using this to actually *learn* Express,
Socket.io, and Prisma (not just to have a repo), I'd still recommend
reading through each controller in order and running the `curl` commands
in `backend/README.md` yourself rather than just trusting that it works.
