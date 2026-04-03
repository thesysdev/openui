import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [vue()],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			fileName: "index",
		},
		rollupOptions: {
			external: ["vue", "zod", "@openuidev/lang-core"],
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "jsdom",
	},
});
