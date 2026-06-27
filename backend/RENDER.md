# Render deploy settings (Root Directory = backend)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |

**Fallback:** If build still fails, set Start Command to:
```
npm run render:start
```
(This builds then starts in one step.)

Do **not** use `yarn` or `npm run dev`.

After deploy, check: `https://realview-realty-crm.onrender.com/health`
