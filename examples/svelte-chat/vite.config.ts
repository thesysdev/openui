import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	ssr: {
		// react-lang uses "moduleResolution": "bundler" and emits imports without
		// .js extensions — Node's native ESM resolver can't handle that, so we
		// tell Vite to bundle it instead of externalizing it during SSR.
		noExternal: ["@openuidev/react-lang"],
	},
});
