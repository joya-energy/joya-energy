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
4. Add environment variables in Vercel if needed (e.g. `GOOGLE_MAPS_API_KEY` for production; set in Vercel dashboard, then use in app via a build-time or runtime mechanism if you add one).
5. Deploy.

### Option B: Monorepo from repo root

If the Vercel project root is the repo root (e.g. `joya-energy`):

1. Set **Root Directory** to `packages/frontend`.
2. **Build Command**: `npm run build:production` (run from `packages/frontend`).
3. **Output Directory**: `dist/joya-frontend/browser`.
4. **Install Command**: `npm install` (Vercel runs this in the root directory by default; if dependencies are only in `packages/frontend`, you may need to run `npm install` from the root so the monorepo is installed, or configure Vercel to use the frontend package).

## Checklist before deploy

| Item                                                     | Status                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Production build succeeds                                | Yes                                                      |
| Production uses `environment.prod.ts` (`apiUrl: '/api'`) | Yes (via `fileReplacements` in `angular.json`)           |
| `vercel.json` present (build, output, rewrites)          | Yes                                                      |
| No hardcoded secrets in `environment.prod.ts`            | Yes (`googleMapsApiKey` is empty; set via env if needed) |
| SPA routing (rewrites to `index.html` for non-files)     | Yes (in `vercel.json`)                                   |

## Notes

- **SSR**: The app is built with Angular SSR (`outputMode: "server"`). This config deploys only the **browser** (static/prerendered) output. So deployment is **static + prerendered**, not full SSR on Vercel. For full SSR you would need a Node serverless function that runs the server bundle; that is not configured here.
- **API**: Production `apiUrl` is `/api`. Ensure your backend is deployed (e.g. on the same domain under `/api` or behind a proxy) or update `environment.prod.ts` / env to point to the correct API URL.
- **Budget warnings**: Production build may report bundle size warnings (e.g. initial bundle or `audit-solaire.component.scss`). They do not block the build but are worth optimizing over time.
- **Google Maps**: If you use the map in production, set `GOOGLE_MAPS_API_KEY` in Vercel and wire it into your app (e.g. replace the empty `googleMapsApiKey` in `environment.prod.ts` with a build-time or runtime env value).
