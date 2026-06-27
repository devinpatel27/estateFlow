# Render deploy settings

## Dashboard settings (Root Directory = `backend`)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |

**Note:** The `backend/ $` prefix in Render's UI is only a path hint — do **not** type it into the command field. Enter only the command itself.

---

## If deploy still fails

Set **Start Command** to:

```
npm run render:start
```

This installs dependencies, builds TypeScript, then starts the server.

---

## Verify

After deploy, open: `https://realview-realty-crm.onrender.com/health`

Expected: `{"status":"ok","timestamp":"..."}`

## Required env vars on Render

- `MONGODB_URI`
- `JWT_SECRET` (32+ characters)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL` (your Vercel URL, no trailing slash)
