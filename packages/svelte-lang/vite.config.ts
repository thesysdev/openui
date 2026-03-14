import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.svelte-kit/**']
  },
  resolve: {
    conditions: ['browser']
  }
});
