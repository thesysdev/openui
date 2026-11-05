import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  // `openui create` picks a free port and passes it as PORT.
  server: { port: Number(process.env.PORT) || 5173 },
  ssr: {
    noExternal: ["@openuidev/svelte-lang", "@openuidev/lang-core"],
  },
});
