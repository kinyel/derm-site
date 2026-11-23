// Static server for dist/ (used by Playwright's webServer and for quick local checks): node scripts/serve.mjs [port]
import { serveDist, requireDist } from './lib.mjs';
requireDist();
const port = Number(process.argv[2] ?? 4173);
const s = await serveDist(port);
console.log(`Serving dist/ at ${s.url}`);
