# 🚂 Railway Backend Deployment Guide

## ✅ Configuration Verified

Your Railway setup is correctly configured:

- ✅ `railway.toml` exists and is correct
- ✅ `Dockerfile.backend` exists and builds properly
- ✅ Port is dynamically set by Railway (no hardcoding needed)
- ✅ Monorepo structure supported

## Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `joya-energy` repository
5. Choose branch: `main`

## Step 2: Configure Railway Service

### General Settings

- **Root Directory**: Leave empty (repo root)
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile.backend`

### Environment Variables (Copy-Paste Ready)

Railway will set `PORT` automatically. Add these variables:

```bash
# === REQUIRED ===
NODE_ENV=production
DB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/joya?retryWrites=true&w=majority

# === OPTIONAL (Recommended) ===
LOG_LEVEL=warn
JWT_SECRET=generate-a-random-secret-key-here

# === Energy Audit Constants ===
ENERGY_COST_PER_KWH=0.35
ENERGY_COST_PER_KWP=1500
ENERGY_AUDIT_K_CH=0.2
ENERGY_AUDIT_K_FR=0.3
ENERGY_AUDIT_ECS_GAS_EFF=0.92
ENERGY_AUDIT_ECS_ELEC_EFF=0.95
ENERGY_AUDIT_ECS_SOLAR_COVERAGE=0.7
ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF=0.9
ENERGY_AUDIT_ECS_PAC_COP=3.0

# === Google Maps (for geocoding) ===
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api/geocode/json
EXTERNAL_APIS_TIMEOUT=30000

# === NASA Power (for solar data) ===
NASA_POWER_API_URL=https://power.larc.nasa.gov/api/temporal/daily/point
NASA_POWER_COMMUNITY=ag
NASA_POWER_PARAMETER=ALL

# === Email via Postmark (optional) ===
# POSTMARK_SERVER_TOKEN=your-postmark-token
# POSTMARK_FROM=noreply@yourdomain.com
# POSTMARK_MESSAGE_STREAM=outbound
# POSTMARK_CONTACT_TEMPLATE_ID=12345678
# POSTMARK_AUDIT_TEMPLATE_ID=12345679
# POSTMARK_PV_TEMPLATE_ID=12345680
EMAIL_FROM=noreply@yourdomain.com

# === Google Cloud Storage (for PDFs) ===
GCS_BUCKET_NAME=your-bucket-name
# For Railway, use impersonation:
# GCS_IMPERSONATE_SERVICE_ACCOUNT=your-service-account@project.iam.gserviceaccount.com
```

### Critical Variables Explained

1. **DB_URI** (REQUIRED)

   - Your MongoDB connection string
   - Get it from MongoDB Atlas or your MongoDB provider
   - Format: `mongodb+srv://user:password@cluster.mongodb.net/database`

2. **GOOGLE_MAPS_API_KEY** (REQUIRED for audit-solaire)

   - Get from: https://console.cloud.google.com/apis/credentials
   - Enable: Geocoding API

3. **OPENAI_API_KEY** (Optional - for bill extraction)

   - Get from: https://platform.openai.com/api-keys
   - Only needed if using AI bill extraction feature

4. **GCS_BUCKET_NAME** (Optional - for PDF storage)
   - Google Cloud Storage bucket for storing generated PDFs
   - Can skip if not using cloud storage

## Step 3: Deploy on Railway

1. After setting environment variables, click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Railway will assign a URL like: `https://your-app.railway.app`

## Step 4: Connect Frontend to Backend

Once Railway is deployed, copy your Railway URL and update Vercel:

### Vercel Environment Variables

Go to Vercel → Your Frontend Project → Settings → Environment Variables

Add:

```bash
NG_APP_API_URL=https://your-backend.railway.app/api
```

Replace `your-backend.railway.app` with your actual Railway domain.

Then redeploy frontend on Vercel.

## Step 5: Test the Connection

1. Open your Vercel frontend URL
2. Open browser console (F12)
3. Try using a simulator or feature that calls the API
4. Check:
   - No CORS errors
   - API calls reach `https://your-backend.railway.app/api`
   - Responses return successfully

## Verification Checklist

- ✅ Railway shows "Active" status
- ✅ Railway logs show: "Server listening on port..."
- ✅ Railway URL responds (visit `https://your-backend.railway.app/`)
- ✅ Frontend calls backend without CORS errors
- ✅ MongoDB connection successful (check Railway logs)

## Expected Railway Build Output

```
Building...
✓ [1/2] STEP 1/9: FROM node:20-alpine AS builder
✓ [2/2] STEP 9/9: CMD ["node", "-r", "tsconfig-paths/register", "dist/packages/backend/src/index.js"]
✓ Successfully built image

Deploying...
✓ Service deployed
✓ Health check passed
```

## Common Issues

### 1. MongoDB Connection Failed

**Error**: "MongoServerError: Authentication failed"

**Fix**:

- Check DB_URI is correct
- Whitelist Railway IPs in MongoDB Atlas (or allow all: 0.0.0.0/0)
- Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere

### 2. CORS Errors in Frontend

**Error**: "Access-Control-Allow-Origin"

**Check**:

- Backend CORS is configured to allow your Vercel domain
- Frontend is using correct API URL

### 3. Port Binding Error

**Error**: "EADDRINUSE"

**Fix**:

- Ensure backend uses `process.env.PORT` (already configured ✅)
- Railway automatically sets PORT variable

## Need Help?

1. **Check Railway Logs**: Click on your service → View Logs
2. **Check Build Logs**: If build fails, shows why
3. **Check Runtime Logs**: Shows server errors and MongoDB connection

## Files Configured

- ✅ `railway.toml` - Railway configuration
- ✅ `Dockerfile.backend` - Production Docker image
- ✅ `packages/backend/.env.example` - All variables documented
- ✅ `packages/backend/src/configs/server.config.ts` - Reads from env vars

**Status**: Ready to deploy ✅
