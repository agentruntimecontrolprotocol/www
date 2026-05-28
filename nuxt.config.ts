export default defineNuxtConfig({
  compatibilityDate: '2025-05-23',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  modules: ['@nuxt/ui-pro', '@nuxt/content', '@nuxt/fonts', '@nuxtjs/seo'],
  css: ['~/assets/css/main.css'],
  site: {
    url: 'https://agentruntimecontrolprotocol.io',
    name: 'ARCP',
    description: 'A transport-agnostic wire protocol for submitting, observing, and controlling long-running AI agent jobs.',
    defaultLocale: 'en',
  },
  ogImage: { enabled: false },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
          langs: ['json', 'bash', 'typescript', 'javascript', 'python', 'rust', 'go', 'yaml', 'toml', 'http'],
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
