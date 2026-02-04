# Vercel Frontend Deployment Guide

## Configuration Summary

This project uses a monorepo structure with the frontend in `packages/frontend`.

## Vercel Project Settings

Configure your Vercel project with these **exact** settings:

### 1. Root Directory

Set to: `packages/frontend`

### 2. Build Settings

- **Framework Preset**: Other
- **Build Command**: (leave empty, uses vercel.json)
- **Output Directory**: (leave empty, uses vercel.json)
- **Install Command**: (leave empty, uses vercel.json)

### 3. Node Version

Add Environment Variable:

- Key: `NODE_VERSION`
- Value: `20.x`

## How the Build Works

1. Vercel starts in `packages/frontend` (Root Directory)
2. Runs `npm install --prefix ../..` to install all workspace dependencies from repo root
3. Runs `node scripts/generate-env.js` to generate environment config
4. Runs Angular CLI from root `node_modules`: `node ../../node_modules/@angular/cli/bin/ng.js build --configuration production`
5. Outputs to `dist/joya-frontend/browser`

## Deployment Steps

1. **Commit and push** the updated `packages/frontend/vercel.json`:

   ```bash
   git add packages/frontend/vercel.json VERCEL_DEPLOYMENT.md
   git rm vercel.json
   git commit -m "fix: configure Vercel for monorepo frontend deployment"
   git push origin main
   ```

2. **Configure Vercel**:

   - Go to your Vercel project → Settings → General
   - Set **Root Directory** to `packages/frontend`
   - Go to Settings → Environment Variables
   - Add `NODE_VERSION` = `20.x`

3. **Deploy**:
   - Go to Deployments
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

## Troubleshooting

If the build still fails:

1. **Check Root Directory**: Must be `packages/frontend`, not empty or anything else
2. **Check Node Version**: Should see Node 20.x in build logs, not 24.x
3. **Check Build Log**: The install command should run from repo root (`npm install --prefix ../..`)

## Local Testing

Test the exact build command locally:

```bash
cd packages/frontend
npm install --prefix ../..
node scripts/generate-env.js
node ../../node_modules/@angular/cli/bin/ng.js build --configuration production
```

Build output will be in `packages/frontend/dist/joya-frontend/browser`.
