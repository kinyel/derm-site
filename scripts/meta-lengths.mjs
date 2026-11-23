// Dev helper: list frontmatter descriptions / titles that break the length limits (after {{token}} fill).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { r } from './lib.mjs';
import { fill } from '../src/lib/facts.ts';
import { clinic } from '../src/data/clinic.ts';

let bad = 0;
for (const dir of ['services', 'procedures', 'conditions', 'articles', 'team', 'legal']) {
  const full = r('src/content', dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full).filter((x) => x.endsWith('.md'))) {
    const m = fs.readFileSync(path.join(full, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    let d;
    try { d = YAML.parse(m[1]); } catch { console.log(dir + "/" + f + ": YAML error (run node scripts/fm-check.mjs)"); bad++; continue; }
    const desc = fill(String(d.description ?? ''));
    const title = fill(String(d.seoTitle ?? ''));
    const withSuffix = `${title} | ${clinic.shortName}`;
    const answerWords = fill(String(d.answer ?? '')).split(/\s+/).filter(Boolean).length;
    const issues = [];
    if (desc.length > 155) issues.push(`description ${desc.length} (>155)`);
    if (desc.length && desc.length < 70) issues.push(`description ${desc.length} (<70)`);
    if (title.length > 60) issues.push(`seoTitle ${title.length} (>60)`);
    const summary = fill(String(d.summary ?? ''));
    if (summary.length > 170) issues.push(`summary ${summary.length} (>170)`);
    if (process.argv.includes('--answers') && d.answer && (answerWords < 38 || answerWords > 64)) issues.push(`answer ${answerWords} words`);
    if (issues.length) {
      bad++;
      console.log(`${dir}/${f}: ${issues.join('; ')}${withSuffix.length > 60 ? ' [no suffix]' : ''}`);
    }
  }
}
console.log(bad ? `${bad} file(s) to fix` : 'all meta lengths OK');
