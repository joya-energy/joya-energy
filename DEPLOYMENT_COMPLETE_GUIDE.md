# 🚀 Complete Deployment Guide - Frontend (Vercel) + Backend (Railway)

## ✅ Status Check

- ✅ Frontend: **Deployed on Vercel**
- ⏳ Backend: **Ready to deploy on Railway**
- ✅ Configuration: **Verified and working**

---

## Part 1: Deploy Backend on Railway (15 minutes)

### Step 1: Create Railway Account & Project

1. Go to **https://railway.app**
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose: **`joya-energy`** repository
6. Branch: **`main`**

### Step 2: Configure Service

Railway will detect the Dockerfile automatically.

**Root Directory**: _(leave empty - uses repo root)_

### Step 3: Add Environment Variables

Click on your service → **Variables** tab → **Raw Editor**

Copy and paste this (**fill in YOUR values**):

```bash
# === REQUIRED (MUST FILL) ===
NODE_ENV=production
DB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/joya?retryWrites=true&w=majority
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# === RECOMMENDED ===
LOG_LEVEL=warn
JWT_SECRET=your-secret-key-at-least-32-characters-long

# === Energy Constants (copy as-is) ===
ENERGY_COST_PER_KWH=0.35
ENERGY_COST_PER_KWP=1500
ENERGY_AUDIT_K_CH=0.2
ENERGY_AUDIT_K_FR=0.3
ENERGY_AUDIT_ECS_GAS_EFF=0.92
ENERGY_AUDIT_ECS_ELEC_EFF=0.95
ENERGY_AUDIT_ECS_SOLAR_COVERAGE=0.7
ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF=0.9
ENERGY_AUDIT_ECS_PAC_COP=3.0

# === API Configs (copy as-is) ===
GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api/geocode/json
EXTERNAL_APIS_TIMEOUT=30000
NASA_POWER_API_URL=https://power.larc.nasa.gov/api/temporal/daily/point
NASA_POWER_COMMUNITY=ag
NASA_POWER_PARAMETER=ALL

# === Email ===
EMAIL_FROM=noreply@yourdomain.com
```

**⚠️ Don't forget to replace:**

- `YOUR_USER`, `YOUR_PASSWORD`, `YOUR_CLUSTER` in DB_URI
- `YOUR_GOOGLE_MAPS_API_KEY` with your actual key
- `your-secret-key-at-least-32-characters-long` with a random secret

### Step 4: Get Required API Keys

#### MongoDB (Required)

1. Go to **https://www.mongodb.com/cloud/atlas**
2. Create free account → Create free cluster (M0)
3. Click **"Connect"** → **"Connect your application"**
4. Copy connection string
5. In MongoDB Atlas: **Network Access** → **Add IP** → Allow `0.0.0.0/0` (all IPs)

#### Google Maps API (Required)

1. Go to **https://console.cloud.google.com/**
2. Create new project or select existing
3. Enable **"Geocoding API"**
4. **Credentials** → **Create Credentials** → **API Key**
5. Copy the key

### Step 5: Deploy

Click **"Deploy"** or push a commit to trigger deployment.

**Wait 2-3 minutes** for build to complete.

You'll get a URL like: `https://joya-backend-production.up.railway.app`

---

## Part 2: Connect Frontend to Backend (5 minutes)

### Step 1: Copy Your Railway URL

After Railway deployment, copy your backend URL (e.g., `https://joya-backend-production.up.railway.app`)

### Step 2: Update Vercel Environment Variables

1. Go to **Vercel** → Your frontend project
2. **Settings** → **Environment Variables**
3. Click **"Add Variable"**

**Variable 1:**

```
Name:  NG_APP_API_URL
Value: https://YOUR-RAILWAY-URL.railway.app/api
```

⚠️ **IMPORTANT**: Add `/api` at the end!

**Variable 2 (Optional):**

```
Name:  NG_APP_GOOGLE_MAPS_API_KEY
Value: YOUR_GOOGLE_MAPS_API_KEY
```

**Environment**: Select **All** (Production, Preview, Development)

### Step 3: Redeploy Frontend

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **"Redeploy"**
4. Wait ~1 minute

---

## Part 3: Test Everything Works (5 minutes)

### Test Backend Directly

Open in browser:

```
https://YOUR-RAILWAY-URL.railway.app/
```

You should see a response (not 404).

### Test Frontend → Backend Connection

1. Open your Vercel frontend URL
2. Open browser console (Press F12)
3. Try using a simulator (e.g., Audit Énergétique)
4. Check console for:
   - ✅ API calls to `https://YOUR-RAILWAY-URL.railway.app/api/...`
   - ✅ Status 200 responses
   - ❌ NO CORS errors

### Check Railway Logs

Railway → Your Service → **Logs** tab

Look for:

```
✅ Server is running on port 3000
✅ MongoDB connected successfully
```

---

## Verification Checklist

**Backend (Railway):**

- [ ] Build completed successfully
- [ ] Service status: "Active"
- [ ] Logs show: "Server is running on port..."
- [ ] MongoDB connection successful
- [ ] URL responds (not 404)

**Frontend (Vercel):**

- [ ] Deployment successful
- [ ] Environment variable `NG_APP_API_URL` is set
- [ ] Can access frontend URL
- [ ] API calls reach Railway backend
- [ ] No CORS errors in console

**Connection:**

- [ ] Frontend can call backend APIs
- [ ] Simulators work end-to-end
- [ ] Data saves to MongoDB

---

## Common Issues & Solutions

### 1. MongoDB Connection Failed

**Error in Railway logs**: "MongoServerError: Authentication failed"

**Fix:**

1. Check DB_URI has correct username/password
2. MongoDB Atlas → **Network Access** → Add IP: `0.0.0.0/0`
3. Check database user has read/write permissions

### 2. Frontend calls /api (wrong URL)

**Error in browser console**: "GET https://your-frontend.vercel.app/api/... 404"

**Fix:**

1. Add `NG_APP_API_URL` to Vercel environment variables
2. Redeploy frontend

### 3. CORS Error

**Error**: "Access-Control-Allow-Origin header is missing"

**Fix:**

- Backend CORS is already configured ✅
- Check frontend is using HTTPS (not HTTP)
- Check Railway URL is correct in Vercel env vars

### 4. Railway Build Failed

**Error**: "Build failed with exit code 1"

**Fix:**

1. Check Railway logs for error message
2. Verify `Dockerfile.backend` exists in repo root
3. Ensure `railway.toml` is committed

---

## Port Configuration ✅

**Frontend expects**: `/api` (relative) or full URL from `NG_APP_API_URL`

**Backend listens on**: `process.env.PORT` (Railway sets this automatically)

**Railway exposes**: Standard HTTPS (443) to public

**No port configuration needed** - everything is automatic! ✅

---

## Files You Should Commit

```bash
git add RAILWAY_DEPLOYMENT.md
git add RAILWAY_ENV_VARIABLES.txt
git add FRONTEND_BACKEND_CONNECTION.md
git add DEPLOYMENT_COMPLETE_GUIDE.md
git commit -m "docs: add complete deployment guides"
git push origin main
```

---

## Next Steps After Deployment

1. **Monitor Railway logs** for any errors
2. **Test all features** (simulators, contact form, etc.)
3. **Set up MongoDB backups** (in Atlas)
4. **Add custom domain** (optional, in Railway settings)
5. **Enable health checks** (Railway auto-detects)

---

## Support Files Created

- ✅ `RAILWAY_DEPLOYMENT.md` - Detailed Railway setup
- ✅ `RAILWAY_ENV_VARIABLES.txt` - All environment variables explained
- ✅ `FRONTEND_BACKEND_CONNECTION.md` - How frontend connects to backend
- ✅ `DEPLOYMENT_COMPLETE_GUIDE.md` - This file (step-by-step)

**Everything is configured and ready to deploy!** 🚀
