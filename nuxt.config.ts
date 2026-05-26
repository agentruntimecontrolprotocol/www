export default defineNuxtConfig({
  compatibilityDate: '2025-05-23',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  modules: ['@nuxt/ui-pro', '@nuxt/content', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/pro-light-svg-icons',
      '@fortawesome/vue-fontawesome',
    ],
  },
});
