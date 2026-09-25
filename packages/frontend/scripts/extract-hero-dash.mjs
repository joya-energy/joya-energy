import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(
  'C:/Users/safou/Downloads/joya-energy-site-handoff/joya-energy-site/index.html',
  'utf8'
);
const start = html.indexOf('<div class="hero-dash" id="heroOs"');
const endMarker = '</div>\n        </div></div>\n        <div class="hero-laptop__base"';
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) {
  console.error('bounds', start, end);
  process.exit(1);
}

let chunk = html.slice(start, end) + '</div>';
chunk = chunk.replace(/id="heroOs"/, '[attr.id]="dashId"');
chunk = chunk.replace(
  /src="data:image\/png;base64,[^"]+"/,
  'src="/handoff/brand/joya-energy-logo.png"'
);
chunk = chunk.replace(
  /role="img" aria-label="([^"]+)"/,
  '[attr.role]="decorative ? null : \'img\'" [attr.aria-label]="decorative ? null : \'$1\'" [attr.aria-hidden]="decorative ? \'true\' : null"'
);

const outDir =
  'D:/Work/joya-energy/packages/frontend/src/app/pages/landing/components/hero-os-dashboard';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'hero-os-dashboard.component.html'), chunk);
console.log('wrote', chunk.length, 'chars');
