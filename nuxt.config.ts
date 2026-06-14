import { arcpLight, arcpDark } from './shiki-arcp.mjs';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-23',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  modules: ['@nuxt/ui-pro', '@nuxtjs/mdc', '@nuxt/content', '@nuxt/fonts', '@nuxtjs/seo'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#c2431c' },
      ],
    },
  },
  site: {
    url: 'https://agentruntimecontrolprotocol.io',
    name: 'ARCP',
    description: 'A transport-agnostic wire protocol for submitting, observing, and controlling long-running AI agent jobs.',
    defaultLocale: 'en',
  },
  ogImage: { enabled: false },
  // Feed all docs collection routes into the sitemap (see server/api/__sitemap__/urls.ts).
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },
  // Runtime <MDC> highlighting (home code samples) — same Shiki theme/langs as
  // the content pipeline below, so the home sample is highlighted and the
  // /api/_mdc/highlight endpoint is registered (was 404 → unstyled + console error).
  mdc: {
    highlight: {
      // @nuxt/content defaults this to true (it highlights at build); the home's
      // runtime <MDC> needs the endpoint, so re-enable it.
      noApiRoute: false,
      // Register the ARCP "durable envelope" custom themes, then reference by name.
      themes: [arcpLight, arcpDark],
      theme: {
        default: 'arcp-light',
        light: 'arcp-light',
        dark: 'arcp-dark',
      },
      langs: ['json', 'bash', 'typescript', 'javascript', 'python', 'rust', 'go', 'yaml', 'toml', 'http', 'csharp', 'fsharp', 'java', 'kotlin', 'php', 'ruby', 'swift'],
    },
  },
  content: {
    // Synced SDK docs (2286 files) are read-only during dev; live-reload re-indexes
    // the whole collection on every fs event and OOMs the dev server. Disable it.
    watch: { enabled: false },
    build: {
      markdown: {
        highlight: {
          // ARCP "durable envelope" brand themes (objects used directly by the
          // content highlighter). `light` is set explicitly so it isn't defaulted
          // to material-theme-lighter (pastel, ~2.2:1) under prefers-color-scheme.
          theme: {
            default: arcpLight,
            light: arcpLight,
            dark: arcpDark,
          },
          langs: ['json', 'bash', 'typescript', 'javascript', 'python', 'rust', 'go', 'yaml', 'toml', 'http', 'csharp', 'fsharp', 'java', 'kotlin', 'php', 'ruby', 'swift'],
        },
      },
    },
  },
  build: {
    transpile: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/pro-light-svg-icons',
      '@fortawesome/vue-fontawesome',
    ],
  },
});
