import tailwindcss from "@tailwindcss/vite";

const openuiDeps = [
  "@openuidev/lang-core",
  "@openuidev/vue-lang",
  "zod",
];

export default defineNuxtConfig({
  compatibilityDate: "2025-03-01",
  ssr: false,
  modules: [],
  css: ["~/assets/app.css"],
  nitro: {
    // Bundle these so Node doesn't load workspace lang-core as a raw ESM
    // file (that path cannot resolve the example's `zod`).
    externals: {
      inline: openuiDeps,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: openuiDeps,
    },
    optimizeDeps: {
      include: ["@openuidev/vue-lang"],
    },
  },
});
