// npm run test:all — every check from brief §18.2, in order, with a summary.
import { run } from './lib.mjs';
const steps = [
  ['check', 'npm', ['run', 'check']],
  ['build', 'npm', ['run', 'build']],
  ['contrast', 'node', ['scripts/contrast.mjs']],
  ['lint:content', 'node', ['scripts/lint-content.mjs']],
  ['test:seo', 'node', ['scripts/test-seo.mjs']],
  ['test:keywords', 'node', ['scripts/test-keywords.mjs']],
  ['test:e2e', 'playwright', ['test']],
  ['test:cls', 'node', ['scripts/cls-probe.mjs']],
  ['test:viewports', 'node', ['scripts/viewport-audit.mjs']],
  ['lhci', 'node', ['scripts/lhci.mjs']],
];
const results = [];
for (const [name, cmd, args] of steps) {
  console.log(`\n━━ ${name} ━━`);
  results.push([name, await run(cmd, args)]);
}
console.log('\nSummary');
results.forEach(([n, code]) => console.log(`  ${code === 0 ? '✓' : '✗'} ${n}`));
process.exit(results.some(([, c]) => c !== 0) ? 1 : 0);
