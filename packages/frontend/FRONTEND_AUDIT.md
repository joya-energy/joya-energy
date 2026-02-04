# Frontend Audit & Cleanup Report

**Date:** February 2025  
**Scope:** `packages/frontend` — pre-production merge

---

## 1. Critical Fixes Applied

### 1.1 Route bug (fixed)

- **File:** `app.routes.ts`
- **Issue:** Bilan Carbone route used `bilan-carbon.component.js` instead of `bilan-carbon.component` (Angular resolves `.ts` at build time; other routes use no extension).
- **Change:** Updated to `bilan-carbon.component` so the route matches the rest of the app.

### 1.2 Debug console statements removed (fixed)

- **audit-solaire.component.ts:** Removed all `console.log` / `console.warn` debug lines (🔵, ⚠️, 🚀, ✅). Kept `console.error` for real errors and PDF/download failures.
- **solar-audit.component.ts:** Removed `console.log('Invalid form fields:', ...)`. Kept `console.warn` / `console.error` for parse and API errors.
- **google-maps-input.component.ts:** Removed `console.log` for “already loaded”, “Loading…”, “loaded successfully”, “Initializing autocomplete”, “Autocomplete initialized”. Kept `console.error` for missing input, API not loaded, init errors, geolocation, geocoding.

### 1.3 Environment / security (documented)

- **environment.ts:** Added a short comment that this file is for development only and that production secrets must not be committed. Production uses `environment.prod.ts` (relative `apiUrl`, empty or env-based `googleMapsApiKey`).
- **Recommendation:** For production, ensure `googleMapsApiKey` is never committed; use build-time env (e.g. Vercel/host env vars) or a backend proxy for Maps.

### 1.4 Routes cleanup (fixed)

- **app.routes.ts:** Removed commented-out route blocks (old home, old audit-energetique, old audit-solaire) so only active routes remain.

---

## 2. Unused Code Removed

### 2.1 Unused shared components (deleted)

- **approach-section** (`app-approach-section`): Not used in any template; removed component + HTML + SCSS.
- **solar-simulator-section** (`app-solar-simulator-section`): Not used in any template; removed component + HTML + SCSS.

---

## 3. Remaining TODOs (no code change)

- **footer.component.ts:** `// TODO: Replace with actual API endpoint` — newsletter submit is currently simulated with `setTimeout`. Replace with real API when backend is ready.
- **solar-audit.component.ts:** `// TODO: Backend will accept these fields soon - they're already being sent` — backend follow-up only.

---

## 4. Env & Vercel (post-audit)

- **`.env.example`** in `packages/frontend`: Template with `NG_APP_API_URL` and `NG_APP_GOOGLE_MAPS_API_KEY`. Copy to `.env` locally; in Vercel use the same names in Environment Variables.
- **`scripts/generate-env.js`**: Runs before production build; reads `process.env` (and optional `.env` via dotenv) and writes `src/environments/environment.prod.generated.ts`. Committed default has safe values; script overwrites at build time.
- **`environment.prod.ts`**: Imports `generatedEnv` from `environment.prod.generated.ts` and spreads it. Production build uses these values.
- **Commented blocks** in templates were left as requested.

## 5. Home & old audit pages removed (post-audit)

- **pages/home** removed (replaced by landing).
- **Shared components only used by home** removed: `hero`, `feature-highlights`, `faq-section`, `simulators-section`, `feature-icon`.
- **pages/audit-energetique** removed entirely (route uses `energy-audit`).
- **pages/audit-solaire** component files removed (`.component.ts`, `.html`, `.scss`); **kept** `audit-solaire.form.service.ts` and `audit-solaire.types.ts` because `solar-audit` imports them.

## 6. Financing prerender fix (post-audit)

- **comparaison-financements.component.ts**: `fetchLocations()` and `fetchAdvantages()` were called in the constructor (ran during SSR/prerender and hit the API). Moved to `ngOnInit()` and only run when `isPlatformBrowser(this.platformId)`, so prerender no longer triggers `/api/financing-comparisons/locations` or `/advantages`.

## 7. Optional / future

### 7.1 Commented block in landing

- **landing.component.html:** Large commented block for `<app-landing-simple-section>` (estimation form + map placeholder). Left as requested; remove the block if you do not plan to use it.

---

## 8. Console usage left on purpose

- **main.ts:** `console.error(err)` in bootstrap catch — keep for startup failures.
- **server.ts:** `console.log` for “Node Express server listening…” — acceptable for SSR startup.
- **contact, energy-audit, audit-energetique, solar-audit:** `console.error` in HTTP/PDF/contact error handlers — keep for debugging production issues.
- **http-error.interceptor.ts:** `console.error('HTTP Interceptor Error:', ...)` — keep.
- **financing-comparison.service.ts:** `console.error` for fetch errors — keep.

---

## 6. Unused import (fixed)

- **landing.component.ts:** `LandingSimpleSectionComponent` was imported and in `imports` but the only use in the template is inside a commented block. Removed the import so the build no longer warns (NG8113). The section folder `landing-simple-section` is still in the repo; re-add the import if you uncomment the estimation block in `landing.component.html`.

## 10. Build & sanity check

Run before merge:

```bash
cd packages/frontend
npm run build:production
```

**Note:** Production build uses SSR and prerenders routes. Prerender may fail if a route triggers API calls (e.g. `/comparaison-financements` calling `/api/financing-comparisons/locations`) and the API is not available or times out during build. That is an environment/backend concern, not caused by this audit. For a quick check without full prerender you can use `ng build --configuration development` or fix API availability during build.

If you use tests:

```bash
npm run test
```

---

## 11. Summary

| Category            | Action                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| Route bug           | Fixed (bilan-carbon `.js` → no extension)                                             |
| Debug console       | Removed from audit-solaire, solar-audit, google-maps-input                            |
| Routes comments     | Removed obsolete commented routes                                                     |
| Environment         | .env + generate-env.js; Vercel uses NG*APP*\*                                         |
| Unused components   | Removed approach-section, solar-simulator-section                                     |
| Home + related      | Removed home, hero, feature-highlights, faq-section, simulators-section, feature-icon |
| Old audit pages     | Removed audit-energetique; audit-solaire component (kept form.service + types)        |
| Financing prerender | fetchLocations/fetchAdvantages only in browser                                        |
| Commented blocks    | Left as requested                                                                     |
| TODOs               | Left as-is (footer API, backend fields)                                               |

The frontend is in a good state for merge and production deployment after you run a production build and any test suite you use.
