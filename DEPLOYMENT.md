# CRM Deployment Guide (Vercel + Render)

Git repo root is this folder (`realview-realty-crm`):

```
realview-realty-crm/     ← GitHub repo root
├── backend/             → Render (Root Directory: backend)
├── frontend/            → Vercel (Root Directory: frontend)
└── render.yaml          → Render blueprint (optional)
```

**Do NOT use `crm/backend` or `crm/frontend`** — those paths are wrong for this repo.

---

## Architecture

| Service | Platform | URL example |
|---------|----------|-------------|
| Next.js CRM UI | **Vercel** | `https://crm.yourdomain.com` |
| Express API | **Render** | `https://realview-crm-api.onrender.com` |
| MongoDB | **MongoDB Atlas** | Cloud connection string |

Auth uses a **cookie on the Vercel domain** + **Bearer token** in API calls. Frontend and API can be on different domains — set CORS correctly on the backend.

---

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and allow access from anywhere (`0.0.0.0/0`) for testing
3. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/realview_crm`

---

## 2. Render (Backend API)

### Option A — Blueprint (`render.yaml`)

1. Push repo to GitHub
2. Render Dashboard → **New** → **Blueprint**
3. Connect repo; Render detects `crm/render.yaml`
4. Set secret env vars when prompted:
   - `MONGODB_URI`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://realview-crm.vercel.app`)
   - `WEBSITE_URL` = public website URL if used

### Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| Root Directory | **`backend`** (not `crm/backend`) |
| Runtime | Node |
| Build Command | **`npm install --include=dev && npm run build`** |
| Start Command | **`npm start`** (fallback: `npm run render:start`) |
| Health Check | `/health` |

> **Important:** `npm run dev` uses `ts-node-dev` (dev-only). Production must use **`npm start`** which runs `node dist/server.js` after the TypeScript build.

**Environment variables** (see `crm/backend/.env.example`):

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=at_least_32_character_random_string
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=SecurePassword123!
FRONTEND_URL=https://your-crm.vercel.app
WEBSITE_URL=https://your-website.com
UPLOAD_DIR=./uploads
```

**Uploads note:** Render free tier has **ephemeral disk** — uploaded files are lost on redeploy. For client testing, this may be OK. For production, add Render persistent disk or S3/Cloudinary later.

After deploy, API URL: `https://realview-realty-crm.onrender.com`

Set on Render:
```env
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app
```
(No trailing slash — must match your Vercel URL exactly for CORS.)

---

## 3. Vercel (Frontend)

1. Vercel Dashboard → **Add New Project** → import `realview-realty-crm` repo
2. **Root Directory:** **`frontend`** (not `crm/frontend`)
3. Framework: Next.js (auto-detected)

**Environment variables** (Production):

```env
NEXT_PUBLIC_API_URL=https://realview-realty-crm.onrender.com/api
NEXT_PUBLIC_UPLOADS_URL=https://realview-realty-crm.onrender.com
NEXT_PUBLIC_UPLOADS_HOST=realview-realty-crm.onrender.com
```

See also `frontend/.env.production.example`.

4. Deploy

**Note:** `frontend/vercel.json` must be valid JSON only (no comments). Vercel auto-detects Next.js; the file is optional.

### Production images

Update `crm/frontend/next.config.ts` `images.remotePatterns` with your Render hostname, or set:

```ts
hostname: process.env.NEXT_PUBLIC_UPLOADS_HOST ?? 'localhost'
```

---

## 4. Post-deploy checklist

- [ ] Login works (admin seeded on first API boot)
- [ ] API health: `GET https://your-api.onrender.com/health`
- [ ] CORS: `FRONTEND_URL` on backend matches exact Vercel URL (no trailing slash)
- [ ] Re-login after deploy so JWT includes latest permissions
- [ ] Test reports, uploads, and property images

---

## 5. First-load performance (already applied)

This CRM is **client-rendered** — pages fetch data after JS loads (no heavy SSR).

Optimizations in place:

- Server `redirect()` for stub routes (`/`, `/leads/create`, etc.) — no blank flash
- `next/dynamic` + `ssr: false` for Recharts (dashboard + reports)
- Lazy tables/forms on list pages and property create
- `react-datepicker` CSS loaded only where date pickers are used
- `optimizePackageImports` for lucide, date-fns, recharts, react-query

**Expected behavior:** First visit loads shell + JS bundle, then API data appears. This is normal for a client-side CRM.

---

## 6. Custom domain (optional)

| Domain | Points to |
|--------|-----------|
| `crm.yourdomain.com` | Vercel |
| `api.yourdomain.com` | Render (CNAME) |

Update `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_UPLOADS_URL` accordingly.

---

## 7. Do you need separate repos?

**No**, unless your team prefers isolated CI/CD. Monorepo is simpler:

- One PR updates frontend + backend together
- Vercel and Render each set their own **Root Directory**
- No code duplication

Separate repos only help if different teams own frontend/backend with independent release cycles.
