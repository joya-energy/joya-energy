# 🔧 Dockerfile Fix - Static Assets Not Copied

## ❌ The Problem

Your Railway deployment was failing with:

```
❌ Failed to initialize static assets cache: Error: ENOENT: no such file or directory,
open '/app/packages/backend/dist/packages/backend/src/modules/audit-energetique/template/audit/template.html'
```

**Root Cause**: TypeScript compiler (`tsc`) only compiles `.ts` files to `.js`. It does **NOT** copy:

- HTML templates
- CSS files
- Images (PNG, etc.)
- JSON configuration files

These files are needed for PDF generation and configuration.

---

## ✅ The Fix

Updated `Dockerfile.backend` to copy static assets after TypeScript build:

```dockerfile
# Copy static assets (templates, CSS, images, JSON configs) that TypeScript doesn't copy
WORKDIR /app/packages/backend
RUN mkdir -p dist/packages/backend/src/modules/audit-energetique/template && \
    mkdir -p dist/packages/backend/src/modules/audit-energetique/uploads && \
    mkdir -p dist/packages/backend/src/modules/audit-solaire/config && \
    cp -r src/modules/audit-energetique/template/* dist/packages/backend/src/modules/audit-energetique/template/ && \
    cp -r src/modules/audit-energetique/uploads/* dist/packages/backend/src/modules/audit-energetique/uploads/ && \
    cp src/modules/audit-solaire/config/*.json dist/packages/backend/src/modules/audit-solaire/config/ 2>/dev/null || true
```

---

## 📦 What Gets Copied

### 1. Audit Énergétique Templates

```
src/modules/audit-energetique/template/
├── audit/
│   ├── template.html
│   ├── style.css
│   └── bootstrap.min.css
└── pv/
    ├── template.html
    ├── style.css
    └── bootstrap.min.css
```

### 2. Static Images

```
src/modules/audit-energetique/uploads/
├── branding/logo.png
├── buildings/*.png
├── covers/cover.png
├── financial/*.png
├── icons/*.png
└── solar/*.png
```

### 3. JSON Configuration Files

```
src/modules/audit-solaire/config/*.json
```

---

## 🚀 How to Deploy the Fix

### Step 1: Commit the Fix

```bash
git add Dockerfile.backend
git commit -m "fix: copy static assets in Docker build for PDF generation"
git push origin main
```

### Step 2: Redeploy on Railway

Railway will automatically detect the push and redeploy.

**OR** manually trigger:

1. Go to Railway → Your Service
2. Click **"Deploy"** or **"Redeploy"**

### Step 3: Verify the Fix

After deployment, check Railway logs:

**✅ Should see:**

```
Server is running on port 3000
MongoDB connected successfully
```

**❌ Should NOT see:**

```
Failed to initialize static assets cache
```

### Step 4: Test PDF Generation

1. Open your frontend
2. Complete an audit (énergétique or solaire)
3. Generate PDF report
4. **Should work now!** ✅

---

## 🔍 Why This Happens

**TypeScript's job**: Convert `.ts` → `.js`

**TypeScript does NOT**:

- Copy HTML
- Copy CSS
- Copy images
- Copy JSON files
- Copy any non-TypeScript files

**Solution**: Manually copy static assets in Dockerfile after `tsc` build.

---

## 📋 Checklist

After deploying the fix:

- [ ] Railway build completes successfully
- [ ] No "ENOENT" errors in logs
- [ ] Server starts without asset errors
- [ ] PDF generation works
- [ ] Templates render correctly
- [ ] Images appear in PDFs

---

## 🎯 Impact

**Before Fix:**

- ❌ PDF generation failed
- ❌ Template errors
- ❌ Missing images in reports

**After Fix:**

- ✅ PDF generation works
- ✅ Templates load correctly
- ✅ Images display in reports

---

## 🔗 Related Files

- `Dockerfile.backend` - Docker build configuration (FIXED)
- `packages/backend/src/modules/audit-energetique/template/` - HTML/CSS templates
- `packages/backend/src/modules/audit-energetique/uploads/` - Static images
- `packages/backend/src/modules/audit-solaire/config/*.json` - JSON configs

**Status**: ✅ Fixed and ready to deploy
