/** Reads colour tokens from tokens.css at build time, so code that cannot use CSS variables (OG images) still has one source of truth. */
import fs from 'node:fs';
import path from 'node:path';

let cache: Record<string, string> | undefined;

export function tokens(): Record<string, string> {
  if (!cache) {
    const css = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
    cache = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
  }
  return cache;
}
