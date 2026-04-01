export default defineNuxtConfig({
  compatibilityDate: "2025-03-01",
  ssr: false,
  modules: [],
  css: ["~/assets/app.css"],
  nitro: {
    // lang-core uses bundler-style extensionless imports in dist/
    // so Nitro must bundle (not externalize) it for Node ESM compat
    externals: {
      inline: ["@openuidev/lang-core", "@openuidev/vue-lang"],
    },
  },
  vite: {
    optimizeDeps: {
      include: ["@openuidev/vue-lang"],
    },
  },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },
  build: {
    transpile: ["@openuidev/vue-lang", "@openuidev/lang-core"],
  },
});
