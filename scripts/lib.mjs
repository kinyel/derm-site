// Shared helpers for the Node scripts (cross-platform: no shell-specific commands).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dist = path.join(root, 'dist');
export const r = (...p) => path.join(root, ...p);
const isWin = process.platform === 'win32';

/** Run a local binary from node_modules/.bin (or any command) and resolve with its exit code. */
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const local = path.join(root, 'node_modules', '.bin', isWin ? `${cmd}.cmd` : cmd);
    const bin = fs.existsSync(local) ? local : cmd;
    const child = spawn(bin, args, { cwd: root, stdio: 'inherit', shell: isWin, env: { ...process.env, ...(opts.env ?? {}) } });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

export function freePort(start = 4400) {
  return new Promise((resolve) => {
    const tryPort = (p) => {
      const s = net.createServer();
      s.once('error', () => tryPort(p + 1));
      s.once('listening', () => s.close(() => resolve(p)));
      s.listen(p, '127.0.0.1');
    };
    tryPort(start);
  });
}

/** Tiny static file server for dist/ (used by posters, e2e-free checks and Lighthouse). */
export async function serveDist(port) {
  const http = await import('node:http');
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
  const zlib = await import('node:zlib');
  // Apply dist/_headers the way Cloudflare Pages does, so every local check (end-to-end tests, Lighthouse,
  // posters, layout-shift scan) runs under the same Content-Security-Policy as the live site. Without this
  // a script the policy blocks works here and fails there (it did: DECISIONS D84). Two directives only make
  // sense on https and are left out on this plain-http server: HSTS and upgrade-insecure-requests.
  const rules = [];
  const headersFile = path.join(dist, '_headers');
  if (fs.existsSync(headersFile)) {
    let cur = null;
    for (const line of fs.readFileSync(headersFile, 'utf8').split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      if (!/^\s/.test(line)) {
        const pattern = line.trim();
        cur = { test: new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`), set: {} };
        rules.push(cur);
      } else if (cur) {
        const i = line.indexOf(':');
        if (i < 0) continue;
        const name = line.slice(0, i).trim().toLowerCase();
        let value = line.slice(i + 1).trim();
        if (name === 'strict-transport-security') continue;
        if (name === 'content-security-policy') value = value.split(';').map((d) => d.trim()).filter((d) => d && d !== 'upgrade-insecure-requests').join('; ');
        cur.set[name] = value;
      }
    }
  }
  const extraHeaders = (p) => Object.assign({}, ...rules.filter((r) => r.test.test(p)).map((r) => r.set));
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(dist, p);
    if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      const nf = path.join(dist, '404.html');
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found');
    }
    const ext = path.extname(file);
    const body = fs.readFileSync(file);
    const headers = { 'content-type': types[ext] ?? 'application/octet-stream', 'cache-control': p.startsWith('/_assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', ...extraHeaders(p) };
    if (!p.startsWith('/_assets/') && !/^\/(posters|og)\//.test(p) && p !== '/noise.webp') headers['cache-control'] = 'no-cache';
    const compressible = /\.(html|css|js|mjs|json|svg|xml|txt|webmanifest)$/.test(ext);
    if (compressible && /\bbr\b/.test(req.headers['accept-encoding'] ?? '')) {
      headers['content-encoding'] = 'br';
      return res.writeHead(200, headers).end(zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }));
    }
    if (compressible && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
      headers['content-encoding'] = 'gzip';
      return res.writeHead(200, headers).end(zlib.gzipSync(body));
    }
    res.writeHead(200, headers).end(body);
  });
  await new Promise((ok) => server.listen(port, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((ok) => server.close(ok)) };
}

/** Every built HTML page: [{ file, url }] */
export function htmlPages() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '_assets' || e.name === 'pagefind' || e.name === 'posters') continue;
        walk(full);
      } else if (e.name.endsWith('.html')) {
        const rel = path.relative(dist, full).split(path.sep).join('/');
        const url = rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
        out.push({ file: full, url });
      }
    }
  };
  if (fs.existsSync(dist)) walk(dist);
  return out.sort((a, b) => a.url.localeCompare(b.url));
}

export function requireDist() {
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/ not found. Run "npm run build" first.');
    process.exit(1);
  }
}

export const gzipSize = async (buf) => (await import('node:zlib')).gzipSync(buf).length;
export const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
