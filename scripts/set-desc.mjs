// Dev helper: node scripts/set-desc.mjs <json-file>  — { "services/x.md": "new description", ... }
import fs from 'node:fs';
import { r } from './lib.mjs';
const map = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const [file, desc] of Object.entries(map)) {
  const p = r('src/content', file);
  const src = fs.readFileSync(p, 'utf8');
  const out = src.replace(/^description: .*$/m, `description: ${JSON.stringify(desc)}`);
  if (out === src) console.log('unchanged', file);
  fs.writeFileSync(p, out);
}
