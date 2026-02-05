/**
 * Writes environment.prod.generated.ts from process.env (or .env via dotenv).
 * Run before production build so Vercel/local env vars are inlined.
 */
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch {
  // dotenv optional; on Vercel env vars are already in process.env
}

const apiUrl = (
  process.env.NG_APP_API_URL || 'https://joya-backend-production.up.railway.app/api'
).replace(/'/g, "\\'");
const googleMapsApiKey = (
  process.env.NG_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBls9111rmwlK89NjAaqVRHMEhJdzeZs9Q'
).replace(/'/g, "\\'");

const content = `// Auto-generated at build time – do not edit
export const generatedEnv = {
  apiUrl: '${apiUrl}',
  googleMapsApiKey: '${googleMapsApiKey}',
};
`;

const outPath = path.join(__dirname, '../src/environments/environment.prod.generated.ts');
fs.writeFileSync(outPath, content, 'utf8');
