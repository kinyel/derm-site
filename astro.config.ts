import { defineConfig } from 'astro/config';
import { origin, listTodos, extraTodos, isTodo, clinic } from './src/data/clinic.ts';
import { remarkFacts, remarkCallouts, rehypePolish } from './src/lib/markdown-plugins.ts';

const isDev = process.argv.includes('dev');

// Keystatic (git-based CMS) is a dev-only admin at /keystatic — see docs/DECISIONS.md D5.
const cmsIntegrations = [];
if (isDev && process.env.KEYSTATIC !== 'off') {
  const [{ default: react }, { default: markdoc }, { default: keystatic }] = await Promise.all([
    import('@astrojs/react'),
    import('@astrojs/markdoc'),
    import('@keystatic/astro'),
  ]);
  cmsIntegrations.push(react(), markdoc(), keystatic());
}

/** Build-time warnings for facts that are still TODO (brief §1). Never fails the build. */
function factWarnings() {
  return {
    name: 'oc-fact-warnings',
    hooks: {
      'astro:build:start': ({ logger }: { logger: { warn: (m: string) => void } }) => {
        const todos = [...listTodos(), ...extraTodos()];
        if (isTodo(clinic.domain) && !process.env.SITE_URL) {
          logger.warn(`Domain not set: using placeholder ${origin} for canonicals, sitemaps and JSON-LD.`);
        }
        if (todos.length) {
          logger.warn(`${todos.length} clinic facts are still TODO in src/data/clinic.ts:`);
          todos.forEach((t) => logger.warn(`  · ${t}`));
        }
      },
    },
  };
}

export default defineConfig({
  site: origin,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: { format: 'directory', inlineStylesheets: 'auto', assets: '_assets' },
  integrations: [factWarnings(), ...cmsIntegrations],
  markdown: {
    remarkPlugins: [remarkFacts, remarkCallouts],
    rehypePlugins: [rehypePolish],
    smartypants: true,
  },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          // Keep three.js in one cacheable chunk shared by every scene.
          manualChunks(id: string) {
            if (id.includes('node_modules/three/')) return 'three';
            if (id.includes('node_modules/gsap/')) return 'gsap';
          },
        },
      },
    },
  },
});
