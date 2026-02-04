# 🔗 Connecting Frontend (Vercel) to Backend (Railway)

## Quick Setup

### 1. Deploy Backend on Railway First

Follow `RAILWAY_DEPLOYMENT.md` to deploy your backend.

After deployment, Railway gives you a URL like:

```
https://joya-backend-production.up.railway.app
```

### 2. Update Frontend Environment Variables

Go to **Vercel** → Your Frontend Project → **Settings** → **Environment Variables**

Add this variable:

**Variable Name**: `NG_APP_API_URL`

**Value**: `https://YOUR-RAILWAY-URL.railway.app/api`

⚠️ **Important**: Add `/api` at the end!

**Example**:

```
NG_APP_API_URL=https://joya-backend-production.up.railway.app/api
```

**Environment**: All (Production, Preview, Development)

### 3. Redeploy Frontend

After adding the environment variable:

1. Go to Vercel → Deployments
2. Click on latest deployment → "Redeploy"
3. Wait ~1 minute for redeployment

### 4. Verify Connection

Open your frontend URL and check browser console (F12):

**✅ Working:**

```
GET https://your-backend.railway.app/api/some-endpoint
Status: 200 OK
```

**❌ Not working:**

```
GET /api/some-endpoint (calls wrong URL)
```

## How It Works

### Production Build Process

1. **Frontend build** runs `scripts/generate-env.js`
2. Script reads `NG_APP_API_URL` from Vercel environment
3. Generates `environment.prod.generated.ts`:
   ```typescript
   export const generatedEnv = {
     apiUrl: 'https://your-backend.railway.app/api',
     googleMapsApiKey: '',
   };
   ```
4. Angular uses this in `environment.prod.ts`

### Environment Files

```
packages/frontend/src/environments/
├── environment.ts              (local dev: localhost:3001/api)
├── environment.prod.ts         (imports generated)
└── environment.prod.generated.ts  (auto-generated at build)
```

## Troubleshooting

### Issue 1: API calls go to /api (relative path)

**Symptom**: Frontend tries `https://your-frontend.vercel.app/api` (404)

**Cause**: `NG_APP_API_URL` not set in Vercel

**Fix**:

1. Add `NG_APP_API_URL` to Vercel environment variables
2. Redeploy frontend

### Issue 2: CORS errors

**Symptom**:

```
Access to XMLHttpRequest at 'https://backend.railway.app/api/...'
from origin 'https://frontend.vercel.app' has been blocked by CORS
```

**Cause**: Backend CORS not configured for Vercel domain

**Fix**: Check `packages/backend/src/index.ts` CORS config (should be already configured)

### Issue 3: Backend returns 404

**Symptom**: Backend responds but returns 404 for all routes

**Cause**: API routes not registered

**Fix**: Check Railway logs to verify server started correctly

## Environment Variables Summary

### Vercel (Frontend)

```bash
NG_APP_API_URL=https://your-backend.railway.app/api
NG_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key  # Optional
NODE_VERSION=20.x
```

### Railway (Backend)

```bash
NODE_ENV=production
PORT=                         # Auto-set by Railway
DB_URI=                       # Your MongoDB URI
GOOGLE_MAPS_API_KEY=          # Same as frontend
# ... (see RAILWAY_DEPLOYMENT.md for full list)
```

## Testing Locally

To test backend connection locally:

```bash
# 1. Set environment variable
export NG_APP_API_URL=https://your-backend.railway.app/api

# 2. Build frontend
cd packages/frontend
npm run build:production

# 3. Check generated file
cat src/environments/environment.prod.generated.ts
```

Should show your Railway URL.

## Next Steps After Connection

1. ✅ Test all simulators work
2. ✅ Test PDF generation
3. ✅ Test email sending (if configured)
4. ✅ Monitor Railway logs for errors
5. ✅ Set up MongoDB Atlas backups

**Both services are now connected! 🎉**
