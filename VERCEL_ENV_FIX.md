# 🔧 Vercel Environment Variables Not Working - Fix Guide

## ❌ Problem

API requests aren't reaching the backend and Google Maps isn't working because:

**Current generated environment (WRONG):**

```typescript
apiUrl: '/api',           // ❌ Using relative path instead of Railway URL
googleMapsApiKey: '',     // ❌ Empty instead of actual key
```

**Should be:**

```typescript
apiUrl: 'https://joya-backend-production.up.railway.app/api',  // ✅
googleMapsApiKey: 'AIzaSyBls9111rmwlK89NjAaqVRHMEhJdzeZs9Q',   // ✅
```

## 🔍 Root Cause

Environment variables in Vercel are only applied **at build time**, not runtime. If you:

1. Deployed first
2. Added env vars later
3. Didn't redeploy

→ The build used default values (empty strings)

## ✅ Solution

### Step 1: Verify Environment Variables Are Set

Go to **Vercel** → Your Project → **Settings** → **Environment Variables**

You should see:

| Variable Name                | Value                                                | Environment |
| ---------------------------- | ---------------------------------------------------- | ----------- |
| `NG_APP_API_URL`             | `https://joya-backend-production.up.railway.app/api` | All         |
| `NG_APP_GOOGLE_MAPS_API_KEY` | `AIzaSyBls9111rmwlK89NjAaqVRHMEhJdzeZs9Q`            | All         |

⚠️ **Critical**: Variable names must be **EXACT**:

- ✅ `NG_APP_API_URL` (not `NG_API_URL`, not `API_URL`)
- ✅ `NG_APP_GOOGLE_MAPS_API_KEY` (not `GOOGLE_MAPS_API_KEY`)

### Step 2: Redeploy Frontend

After setting environment variables, you **MUST** redeploy:

**Option A: Trigger Redeploy**

1. Go to **Vercel** → **Deployments**
2. Click on latest deployment
3. Click **"Redeploy"** button
4. Wait ~1-2 minutes

**Option B: Push a Commit**

```bash
# Make a small change to trigger build
git commit --allow-empty -m "trigger redeploy with env vars"
git push origin main
```

### Step 3: Verify Build Output

After redeploy, check the build logs in Vercel:

1. Go to **Deployments** → Click latest deployment
2. Click **"Building"** or **"View Function Logs"**
3. Look for:
   ```
   Running "node scripts/generate-env.js"
   ```

### Step 4: Test the Fix

**1. Check Generated File (Dev Tools)**

Open your deployed frontend → Open browser console (F12) → Network tab

Make an API call and check:

- ✅ Request URL should be: `https://joya-backend-production.up.railway.app/api/...`
- ❌ NOT: `https://your-frontend.vercel.app/api/...`

**2. Check Google Maps**

Try the address input field:

- Should show Google Places autocomplete
- Should accept addresses
- Should geocode addresses

## 🚨 Common Mistakes

### Mistake 1: Wrong Variable Names

❌ `API_URL` → Should be `NG_APP_API_URL`
❌ `GOOGLE_MAPS_KEY` → Should be `NG_APP_GOOGLE_MAPS_API_KEY`

The `NG_APP_` prefix is **required** because `generate-env.js` looks for these exact names.

### Mistake 2: Forgot to Redeploy

Environment variables are read **at build time**, not runtime.
→ Always redeploy after changing env vars.

### Mistake 3: Wrong Environment Scope

Variables must be set for **"All"** environments (Production, Preview, Development)
→ If only set for "Production", preview builds won't have them.

### Mistake 4: Trailing Spaces

❌ `https://backend.railway.app/api ` (space at end)
✅ `https://backend.railway.app/api`

Copy-paste can add spaces. Check for trailing spaces in variable values.

## 📋 Complete Checklist

- [ ] Environment variables set in Vercel Settings
- [ ] Variable names are exactly: `NG_APP_API_URL` and `NG_APP_GOOGLE_MAPS_API_KEY`
- [ ] Applied to "All" environments
- [ ] No trailing spaces in values
- [ ] Railway URL ends with `/api`
- [ ] Redeployed frontend on Vercel
- [ ] Build completed successfully
- [ ] Tested API calls in browser (F12 → Network)
- [ ] Tested Google Maps input field

## 🔍 Debug: Check What Was Built

If still not working, check what environment was actually built:

**Method 1: Check Network Requests**

1. Open your frontend in browser
2. Press F12 → Network tab
3. Trigger an API call (e.g., submit form)
4. Check request URL:
   - ✅ Should start with `https://joya-backend-production.up.railway.app/api`
   - ❌ If starts with just `/api`, env vars not applied

**Method 2: Check Console**

1. Open browser console (F12)
2. Type: `window.location.origin`
3. All API calls should go to Railway, not to this origin

## 🎯 Expected Result After Fix

**Before Fix:**

- ❌ API calls: `GET /api/contacts` → 404
- ❌ Google Maps: Input doesn't work
- ❌ Console: CORS errors or 404 errors

**After Fix:**

- ✅ API calls: `GET https://joya-backend-production.up.railway.app/api/contacts` → 200 OK
- ✅ Google Maps: Autocomplete works
- ✅ Console: No CORS errors, API responds

## 📞 Still Not Working?

If after following all steps it still doesn't work:

1. **Check Railway is running**

   - Visit: `https://joya-backend-production.up.railway.app/`
   - Should NOT return 404 or error

2. **Check CORS on backend**

   - Backend already has CORS enabled ✅
   - Should allow all origins

3. **Check Vercel build logs**

   - Look for "generate-env.js" step
   - Should not show errors

4. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
   - Or open in incognito/private window

## 📝 Quick Fix Commands

```bash
# If you need to trigger a rebuild
cd c:\Users\safou\Desktop\work\joya-energy
git commit --allow-empty -m "redeploy: apply Vercel environment variables"
git push origin main
```

Then wait for Vercel to build and deploy (~1-2 minutes).

**Status**: Follow these steps and your frontend will connect to backend! ✅
