import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import theme from '@patopest/astro-theme/integration';
import { realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
// Resolve the theme's real path so the dev server can serve it through the local symlink.
const themeDir = realpathSync(dirname(require.resolve('@patopest/astro-theme/package.json')));

export default defineConfig({
  site: 'https://sacn-monitor.bambinito.net',
  integrations: [mdx(), theme({ exclude: ['/faq/'] })],
  vite: {
    ssr: { noExternal: ['@patopest/astro-theme'] },
    server: { fs: { allow: [siteRoot, themeDir] } },
  },
});
