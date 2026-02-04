# PVGIS API Setup Guide

## 🔧 Fix: "Invalid URL" Error

The error `PVGIS API request failed Invalid URL` means the `PVGIS_API_URL` environment variable is not set.

## ✅ Solution

### Step 1: Add PVGIS URL to your `.env` file

Create or update your `.env` file in `packages/backend/`:

```bash
# PVGIS API (Photovoltaic Geographical Information System)
PVGIS_API_URL=https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
EXTERNAL_APIS_TIMEOUT=30000
```

### Step 2: Restart your server

After adding the environment variable, restart your Node.js server:

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

## 📝 Complete .env Example

Your `.env` file should include:

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/joya

# Google Maps (for geocoding)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api/geocode/json

# PVGIS (for solar calculations)
PVGIS_API_URL=https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
EXTERNAL_APIS_TIMEOUT=30000

# Other configs...
```

## 🔍 Verify It's Working

After restarting, try creating an Audit Solaire simulation again. You should see in the logs:

```
✅ Fetching solar data from PVGIS: lat=36.800723, lon=10.1898818
✅ PVGIS data parsed: XXXX kWh/kWp/year
```

Instead of:
```
❌ PVGIS API request failed Invalid URL
```

## 📚 About PVGIS

PVGIS (Photovoltaic Geographical Information System) is a free service provided by the European Commission's Joint Research Centre. It provides:
- Solar irradiation data
- PV system performance calculations
- Monthly and annual production estimates

**No API key required** - it's a public service!

## 🚨 If Still Not Working

1. **Check the URL is correct:**
   ```
   https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
   ```

2. **Test the API manually:**
   ```bash
   curl "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=36.8&lon=10.18&peakpower=1&loss=14&angle=30&outputformat=json"
   ```

3. **Check your internet connection** - PVGIS requires internet access

4. **Check firewall/proxy settings** - Make sure your server can access external APIs

