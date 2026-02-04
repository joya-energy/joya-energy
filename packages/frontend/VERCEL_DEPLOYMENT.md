# Deploying the frontend on Vercel

## Build status

- **Production build**: `npm run build:production` completes successfully.
- **Output**: `dist/joya-frontend/` (browser assets in `browser/`, server in `server/`).
- **Prerendered routes**: 14 routes are prerendered at build time.

## Deployment options

### Option A: Deploy from `packages/frontend` (recommended)

1. In Vercel, create a new project and import your Git repo.
2. Set **Root Directory** to `packages/frontend`.
3. Vercel will use the `vercel.json` in this folder:
   - **Build Command**: `npm run build:production`
   - **Output Directory**: `dist/joya-frontend/browser`
4. Add environment variables in Vercel (Project Settings → Environment Variables). Use the same names as in `.env.example` so the build script can inject them:
   - `NG_APP_API_URL` — e.g. `/api` (relative) or full API base URL.
   - `NG_APP_GOOGLE_MAPS_API_KEY` — your Google Maps API key (leave empty if not using maps in prod).
     The `build:production` script runs `scripts/generate-env.js` first, which reads these env vars and writes `src/environments/environment.prod.generated.ts`. Production build then uses those values.
5. Deploy.

### Option B: Monorepo from repo root

If the Vercel project root is the repo root (e.g. `joya-energy`):

1. Set **Root Directory** to `packages/frontend`.
2. **Build Command**: `npm run build:production` (run from `packages/frontend`).
3. **Output Directory**: `dist/joya-frontend/browser`.
4. **Install Command**: `npm install` (Vercel runs this in the root directory by default; if dependencies are only in `packages/frontend`, you may need to run `npm install` from the root so the monorepo is installed, or configure Vercel to use the frontend package).

## Checklist before deploy

| Item                                                     | Status                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Production build succeeds                                | Yes                                                                                      |
| Production uses `environment.prod.ts` (`apiUrl: '/api'`) | Yes (via `fileReplacements` in `angular.json`)                                           |
| `vercel.json` present (build, output, rewrites)          | Yes                                                                                      |
| No hardcoded secrets in prod                             | Yes (use `.env` / Vercel env: `NG_APP_*`; script writes `environment.prod.generated.ts`) |
| SPA routing (rewrites to `index.html` for non-files)     | Yes (in `vercel.json`)                                                                   |

## Notes

- **SSR**: The app is built with Angular SSR (`outputMode: "server"`). This config deploys only the **browser** (static/prerendered) output. So deployment is **static + prerendered**, not full SSR on Vercel. For full SSR you would need a Node serverless function that runs the server bundle; that is not configured here.
- **API**: Production `apiUrl` is `/api`. Ensure your backend is deployed (e.g. on the same domain under `/api` or behind a proxy) or update `environment.prod.ts` / env to point to the correct API URL.
- **Budget warnings**: Production build may report bundle size warnings (e.g. initial bundle or `audit-solaire.component.scss`). They do not block the build but are worth optimizing over time.
- **Google Maps**: Set `NG_APP_GOOGLE_MAPS_API_KEY` in Vercel (or in local `.env`) so the build script inlines it into the production env.
