# ISAI - Local MERN Setup

This project now runs as a local MERN stack:
- Frontend: React + Vite (`/`)
- Backend: Express + MongoDB (`/server`)

## 1) Install dependencies

```bash
npm install
npm --prefix server install
```

## 2) Configure environment

Create frontend env:

```bash
cp .env.example .env
```

Create backend env:

```bash
cp server/.env.example server/.env
```

Update `server/.env`:
- `PORT` (for Render use platform port)
- `MONGO_URI` (MongoDB Atlas connection string)
- `JWT_SECRET`
- `FRONTEND_URL` (Vercel URL)
- `GITHUB_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL`
- `APP_BASE_URL` (frontend URL used in invite links)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`

Update frontend `.env`:
- `VITE_API_URL=https://your-render-backend-url.onrender.com/api`

## 3) Start backend + frontend

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:client
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:5000/api`

Webhook endpoint: `POST /api/webhooks/github`

## Notes

- Supabase is no longer used by app auth/data hooks.
- Auth now uses JWT stored in localStorage.
- Google/GitHub social login uses OAuth callbacks through the backend.
- Invitation emails in Settings -> Invite People are sent using SMTP.
- Existing UI pages (dashboard/workspaces/boards/tasks/comments/profile) now read/write via local Express API + MongoDB.
