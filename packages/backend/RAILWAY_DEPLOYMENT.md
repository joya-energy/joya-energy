# Deploy Joya Backend on Railway

This guide covers deploying the backend to [Railway](https://railway.app) using the provided Dockerfile and config.

## Prerequisites

- A Railway account
- This repo connected to Railway (GitHub/GitLab)
- MongoDB (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas)) and its connection string

## 1. Create a new project and service

1. In Railway: **New Project** → **Deploy from GitHub repo** (or **Empty Project** and connect later).
2. Select the `joya-energy` repo.
3. Add a **Service** and choose **GitHub Repo** → select `joya-energy`.
4. Railway will detect the repo; we use a **Dockerfile** for the backend.

## 2. Configure the build

1. In the service **Settings** → **Build**:
   - **Builder**: Dockerfile
   - **Dockerfile path**: `Dockerfile.backend`
   - **Root directory**: leave empty (build from repo root)
2. **Docker build context**: repo root (so `packages/backend` and `packages/shared` are available).

If you use **railway.toml** (already in the repo), Railway will use:

- `builder = "dockerfile"`
- `dockerfilePath = "Dockerfile.backend"`

So you only need to set **Root directory** to empty so the Dockerfile at repo root is used.

## 3. Add environment variables

In the service **Variables** tab, add the variables your backend needs. You can paste from `.env.example` and replace placeholders.

### Minimum for a running app

| Variable   | Description                    | Example             |
| ---------- | ------------------------------ | ------------------- |
| `NODE_ENV` | Environment                    | `production`        |
| `PORT`     | Port (Railway often sets this) | `3000`              |
| `DB_URI`   | MongoDB connection string      | `mongodb+srv://...` |

### Optional (recommended for full features)

- **OpenAI**: `OPENAI_API_KEY` – for bill extraction.
- **Email**: `POSTMARK_SERVER_TOKEN` and `POSTMARK_FROM` (or SMTP vars) – for contact form and report emails.
- **Google Maps**: `GOOGLE_MAPS_API_KEY` – for audit solaire geocoding.
- **Energy constants**: `ENERGY_COST_PER_KWH`, `ENERGY_AUDIT_K_CH`, etc. – see `.env.example`.
- **GCS**: `GCS_BUCKET_NAME` (and credentials) – for storing PDFs; see `GCS_PRODUCTION_SETUP.md`.

All variables from **packages/backend/.env.example** can be added in Railway; the app reads `process.env`, so Railway’s Variables are used and override any `.env` file in the image.

## 4. Deploy

1. Push to the branch Railway watches (e.g. `main`); Railway will build and deploy.
2. Or trigger a deploy manually: **Deploy** → **Deploy now**.
3. After deploy, open the generated URL (e.g. `https://your-service.up.railway.app`). Health: `GET /` or your API root; docs: `GET /api-docs` if Swagger is enabled.

## 5. Custom domain and PORT

- Railway sets **PORT** automatically; the app uses `process.env.PORT` (default 3000), so no change is needed.
- To use a custom domain: **Settings** → **Networking** → **Generate domain** or add your own.

## 6. Docker build (local)

To build and run the same image locally:

```bash
# From repo root
docker build -f Dockerfile.backend -t joya-backend .
docker run --rm -p 3000:3000 -e NODE_ENV=production -e DB_URI="mongodb://..." joya-backend
```

For many variables, use an env file:

```bash
docker run --rm -p 3000:3000 --env-file packages/backend/.env.example joya-backend
```

## Files involved

| File                                     | Purpose                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `Dockerfile.backend` (repo root)         | Multi-stage build: compile backend + shared, run with Node and path resolution. |
| `railway.toml` (repo root)               | Railway config: Dockerfile path, watch paths.                                   |
| `packages/backend/.env.example`          | List of env vars; copy to Railway Variables or `.env.*`.                        |
| `packages/backend/tsconfig.runtime.json` | Path aliases for `@shared` at runtime in the built app.                         |

## Troubleshooting

- **Build fails**: Ensure **Root directory** is empty so the Dockerfile and `packages/` are in context.
- **Module not found (@shared)**: The image uses `tsconfig-paths/register` and `TS_NODE_PROJECT=tsconfig.runtime.json`; if you change the start command, keep these.
- **DB connection fails**: Check `DB_URI` in Variables and that the MongoDB host allows Railway’s IPs (e.g. Atlas: allow all `0.0.0.0/0` for testing).
- **Env not applied**: Variables must be set in the Railway service **Variables** tab; they are injected at runtime and override any `.env` in the image.
