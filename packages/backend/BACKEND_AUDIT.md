# Backend production audit – Joya Energy

Audit date: 2025-02-04. Goal: avoid process crashes in production and handle bad/malformed input safely (log and respond with 4xx/5xx instead of restarting the server).

---

## Executive summary

- **Critical:** Central error handlers (HTTP 4xx/5xx) were never mounted, so all thrown errors were turned into a generic 500 and `err.message` was exposed.
- **Critical:** Malformed JSON or oversized body can cause `express.json()` to throw; that throw was not guaranteed to be passed to Express error middleware and could crash the process.
- **Critical:** No process-level handlers for `uncaughtException` / `unhandledRejection`, so any unhandled error could bring down the server.
- **High:** Contact validation (e.g. wrong email format) used `HTTP401Error` and could throw if `email`/`phoneNumber` were not strings (e.g. number from frontend), causing a crash before validation.
- **High:** Mongoose `ValidationError` (e.g. required field missing) was wrapped in `RepositoryError` and returned as 404/500 instead of 400 with field details.
- **Medium:** Custom errors from domain (e.g. financing `InvalidInputError`, `InvalidLocationError`) are generic `Error`; they are not mapped to HTTP 4xx, so they end up as 500.

Fixes applied in code address the critical and high items above; medium/low items are documented for follow-up.

---

## 1. Error handling pipeline

### 1.1 Central error handlers not applied

**Location:** `src/middlewares/index.ts`, `src/server.ts`

**Issue:** `errorHandlers` (handleRepositoryError, handleApiValidationError, handleClientError, handleServerError) are defined in `error.handlers.ts` and exported but **never applied** to the router. Only `handleDataBaseConnection` is in the `middlewares` array.

**Impact:** When a controller throws `HTTP400Error`, `HTTP404Error`, or `RepositoryError`, the request still reaches the single global handler in `server.ts`, which always returns **500** and sends `err.message` in the response (information leak in production).

**Fix:** Apply `errorHandlers` to the router after routes (see server.ts changes). Keep a final app-level fallback that does not expose stack or message in production.

---

### 1.2 Global error handler in server.ts

**Location:** `src/server.ts` (global `app.use((err, ...) => ...)`)

**Issues:**

- Always responds with 500.
- Sends `details: err.message` in the JSON body → in production this can expose internal details.
- No distinction between client errors (4xx) and server errors (5xx).

**Fix:** Use the proper error handler chain (Repository → ApiValidation → Client → Server) on the router and replace the global handler with a last-resort that logs, hides message in production, and returns a generic “Internal Server Error”.

---

## 2. Body parsing (crash risk)

### 2.1 Malformed JSON / body size

**Location:** `src/server.ts` – `express.json({ limit: '50mb' })`, `express.urlencoded(...)`.

**Issue:** If the client sends invalid JSON or a body that triggers a parse error, `express.json()` can **throw**. In Express 4, that throw may not be passed to `next(err)` in all cases and can crash the Node process.

**Fix:** Wrap body parsers in middleware that catches errors and calls `next(err)` so the error is handled by the central error pipeline and returns 400 (e.g. “Invalid JSON”) instead of crashing.

---

## 3. Process-level crashes

### 3.1 Uncaught exception / unhandled rejection

**Location:** Process entry – `src/index.ts` (only calls `createServer()`).

**Issue:** There are no `process.on('uncaughtException')` or `process.on('unhandledRejection')` handlers. Any unhandled rejection or synchronous exception outside the request pipeline can terminate the process.

**Fix:** In `index.ts` (or server bootstrap):

- **unhandledRejection:** Log with the Logger and optionally set a default so the process does not exit (avoid crashing on a single bad request).
- **uncaughtException:** Log, then exit gracefully (e.g. `process.exit(1)`) after a short delay, since the process state may be undefined.

Winston is already configured with `handleExceptions` and `rejectionHandlers`; adding explicit process handlers ensures nothing is missed and allows a controlled exit on uncaughtException.

---

## 4. Contact module (email / validation)

### 4.1 Wrong email format / type causing crash

**Location:** `packages/shared/src/functions/user-check.ts` – `validateEmail`, `validatePhoneNumber`.  
Also `packages/backend/src/models/contact/contact.model.ts` – pre-save hook.

**Issue:**

- If the frontend sends `email: 123` (number) or `email: null`, the contact model pre-save calls `validateEmail(this.email)`. In `user-check.ts`, `validateEmail(email)` uses `re.test(email)`. If `email` is not a string, `RegExp.prototype.test` can throw (e.g. `TypeError`), which is uncaught in the model layer and can crash the request or bubble as an unhandled error.
- Same risk for `validatePhoneNumber` if `phoneNumber` is not a string.

**Fix:** In shared `user-check.ts`, coerce input to string (e.g. `String(value).trim()`) before using `re.test()` so non-string input is validated (and fails validation) instead of throwing.

---

### 4.2 Contact model: 401 vs 400

**Location:** `src/models/contact/contact.model.ts` – pre-save hook.

**Issue:** Wrong email or phone format throws `HTTP401Error` (“Wrong Email format” / “Wrong Phone Number format”). Validation failures should be **400 Bad Request**, not 401 Unauthorized.

**Fix:** Use a 400-style error (e.g. `HTTP400Error` or a validation error type) for “Wrong Email format” / “Wrong Phone Number format”.

---

### 4.3 Mongoose ValidationError → 400 with details

**Location:** `src/modules/contact/contact.repository.ts` – `createOne` catch block.  
Also `src/modules/common/common.repository.ts` – `modelCreateOne` catch.

**Issue:** When Mongoose schema validation fails (e.g. required field missing, wrong type), Mongoose throws `ValidationError` with a `errors` object. The repository catches and rethrows `RepositoryError`, so the API returns 404/500 and the client does not get field-level validation errors.

**Fix:** In contact repository (and optionally in common repository), detect `mongoose.Error.ValidationError`, map it to `ApiValidationError` with field errors, and rethrow so the error middleware returns 400 with a safe payload (e.g. field names and messages, no stack).

---

## 5. Other modules (non-crash, but worth tightening)

### 5.1 Throwing generic `Error`

**Locations (examples):**

- `carbon-simulator`: `throw new Error('Unknown building type...')`.
- `audit-solaire`: `throw new Error('Invalid consumption...')`, `throw new Error('Unknown building type or month...')`, etc.
- `audit-energetique`: `pv-report.builder.ts`, `bill-extraction.service.ts`, `audit-report.controller.ts`, etc.
- `financing-comparison`: `InvalidInputError`, `InvalidLocationError` (custom but not HTTP errors).

**Impact:** These are caught by the generic server error handler and return 500. For “unknown building type” or “invalid consumption”, 400 is more appropriate.

**Recommendation:** In controllers or a thin service layer, catch domain errors and rethrow `HTTP400Error` (or `ApiValidationError`) with a safe message so the pipeline returns 4xx and logs the full error server-side.

---

### 5.2 Sub-routers using plain `Router()` → unhandled rejections

**Location:** All route modules (`contact.routes.ts`, `audit-solaire.routes.ts`, `audit-energetique.routes.ts`, `file.routes.ts`, `carbon-simulator.routes.ts`, `comparison.routes.ts`).

**Issue:** Sub-routers were created with Express’s `Router()`, not `express-promise-router`. When an async route handler threw (e.g. `HTTP400Error('Invalid email format')` in audit-solaire), the rejection was never passed to `next(err)` and became an **unhandled rejection** (logged by process handler, client could get no response or a generic error).

**Fix:** Use `asyncRouter()` from `express-promise-router` in every route module so that async rejections are caught and passed to `next(err)`, then to the central error handlers (400/404/500 as appropriate).

---

## 6. Security / production hygiene

- **Logging:** Avoid logging full request bodies or tokens. The audit did not change logging content; ensure PII and secrets are not written to logs in production.
- **CORS:** Currently `app.use(cors())` is permissive; for production, restrict origin to the frontend domain(s).
- **Helmet:** Commented out in server.ts; enabling and configuring Helmet is recommended for production headers.

---

## 7. Checklist before merge to main / production

- [x] Error handlers (Repository, ApiValidation, Client, Server) applied to the router.
- [x] Global fallback error handler does not expose `err.message` or stack in production.
- [x] Body parser (JSON/urlencoded) errors caught and passed to `next(err)` (400 for bad JSON).
- [x] Process handlers for `uncaughtException` and `unhandledRejection` (log + controlled exit for uncaughtException).
- [x] Shared `validateEmail` / `validatePhoneNumber` accept non-string input without throwing (coerce to string).
- [x] Contact model uses 400 (not 401) for “Wrong Email format” / “Wrong Phone Number format”.
- [x] Contact repository maps Mongoose `ValidationError` to `ApiValidationError` (400 with field errors).
- [x] All route modules use `asyncRouter()` so async rejections (e.g. invalid email) reach error handlers, not unhandledRejection.
- [x] Sync route handlers that can throw (e.g. carbon-simulator `/summary`) wrapped in try/catch and call `next(err)`.
- [x] `createServer()` rejection caught in `index.ts` so startup failures (e.g. DB) don’t become unhandled rejections.
- [ ] (Optional) Map domain errors (e.g. financing, audit-solaire) to HTTP 4xx in controllers.
- [ ] (Optional) Restrict CORS and enable Helmet for production.

---

## 8. Files changed in this audit

| File                                                              | Change                                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                                    | Process handlers; `createServer().catch(...)` so startup failures don’t become unhandled rejections. |
| `src/server.ts`                                                   | Apply error handlers to router; safe body parser wrapper; production-safe global fallback.           |
| `src/middlewares/index.ts`                                        | Export and use `errorHandlers` in middleware list (or apply in server – see implementation).         |
| `src/modules/contact/contact.repository.ts`                       | Map Mongoose ValidationError → ApiValidationError.                                                   |
| `src/models/contact/contact.model.ts`                             | Use HTTP400Error (or validation error) for email/phone format.                                       |
| `packages/shared/src/functions/user-check.ts`                     | Coerce email/phone to string before regex in validateEmail/validatePhoneNumber.                      |
| `src/modules/audit-solaire/audit-solaire.routes.ts`               | Use `asyncRouter()` so async rejections reach error handlers.                                        |
| `src/modules/audit-energetique/audit-energetique.routes.ts`       | Same.                                                                                                |
| `src/modules/contact/contact.routes.ts`                           | Same.                                                                                                |
| `src/modules/file/file.routes.ts`                                 | Same.                                                                                                |
| `src/modules/carbon-simulator/carbon-simulator.routes.ts`         | asyncRouter(); `/summary` wrapped in try/catch and `next(err)` so sync throws don’t crash.           |
| `src/interfaces/financing-comparison/routes/comparison.routes.ts` | Same (asyncRouter).                                                                                  |
