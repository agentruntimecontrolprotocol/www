import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const inkwellRoot = dirname(require.resolve('@nficano/inkwell/nuxt.config'));
const inkwellComponents = resolve(inkwellRoot, 'src/components');

export default defineNuxtConfig({
  compatibilityDate: '2025-05-23',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  extends: ['@nficano/inkwell'],
  modules: ['@nuxt/ui-pro'],
  // The 0.1.1 inkwell layer ships components under src/components but doesn't
  // register them in its own nuxt.config, so we hook them up here so
  // <InkButton>, <InkPageHero>, etc. resolve via Nuxt's auto-import.
  components: [
    { path: inkwellComponents, prefix: '', pathPrefix: false, global: true },
    { path: '~/components', pathPrefix: false },
  ],
  build: {
    transpile: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/pro-light-svg-icons',
      '@fortawesome/vue-fontawesome',
    ],
  },
});
