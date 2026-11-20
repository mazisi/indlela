# Indlela

React SPA for Indlela, an SEO tool for agencies and SMEs in South Africa. Ported from `workforce-app`; see `CLAUDE.md` for architecture and conventions, and `../indlela-api` for the backend. Progress lives in `docs/PROGRESS.md` (git-ignored).

## Run locally

```bash
nvm use                 # Node 24 LTS (React Router 8 needs ≥ 22.22)
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8000/api (indlela-api's APP_PORT)
npm run dev             # http://localhost:5173
```

Start the API first (`./vendor/bin/sail up -d` in `indlela-api`). Seeded login: `admin@indlela.local` / `Indlela@2026`; one-time PINs and reset/invite links arrive in Mailpit (http://localhost:8025). Or create a new workspace at `/register`.

Checks: `npm run build`, `npm run lint`, `npx vitest run`.

## Screens

| Route | Screen |
|---|---|
| `/login` | Sign in → one-time PIN (email or SMS) |
| `/register` | Create your workspace (signed in as its Owner) |
| `/forgot-password` | Request a reset link |
| `/reset-password?token=…&email=…` | Choose a new password (also the invite link; `/set-password` shows invite wording) |
| `/dashboard` | Welcome: workspace, role, clients and what your role can do |
| `/dashboard/account` | My account: cell number, PIN channel, change password |
| `/dashboard/clients/clients`, `/dashboard/clients/sites` | Clients and their sites |
| `/dashboard/settings/{users,roles,login-history,email-templates,workspace}` | Settings |
| `/dashboard/{search-console,site-audit,rank-tracking,reports}` | Permission-guarded placeholders |
| `/dashboard/local-grid`, `/local-grid/:siteId`, `/local-grid/:siteId/:gridId` | Local map pack grid: overview, a site's grids, a grid's heatmap (Leaflet; tiles from `VITE_MAP_TILE_URL`) |
