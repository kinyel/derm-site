// Dev helper: validate frontmatter YAML in every content file; with --fix, quote plain scalars that contain ": ".
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { r } from './lib.mjs';

const fix = process.argv.includes('--fix');
let errors = 0;
for (const dir of fs.readdirSync(r('src/content'))) {
  const full = r('src/content', dir);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const f of fs.readdirSync(full).filter((x) => x.endsWith('.md'))) {
    const file = path.join(full, f);
    let src = fs.readFileSync(file, 'utf8');
    const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) { console.log(`${dir}/${f}: no frontmatter`); errors++; continue; }
    let fm = m[1];
    if (fix) {
      const fixed = fm.replace(/^(\s*(?:- )?[A-Za-z][\w]*): ([^"'\[{>|\n][^\n]*: [^\n]*)$/gm, (_all, key, val) => `${key}: ${JSON.stringify(val.trim())}`);
      if (fixed !== fm) {
        src = src.replace(fm, fixed);
        fs.writeFileSync(file, src);
        fm = fixed;
      }
    }
    try {
      YAML.parse(fm);
    } catch (e) {
      errors++;
      console.log(`${dir}/${f}: ${String(e.message).split('\n')[0]}`);
    }
  }
}
console.log(errors ? `${errors} frontmatter error(s)` : 'frontmatter OK');
process.exit(errors ? 1 : 0);
