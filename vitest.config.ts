import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      react: fileURLToPath(new URL('./node_modules/react/index.js', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom/index.js', import.meta.url)),
      'react-dom/client': fileURLToPath(new URL('./node_modules/react-dom/client.js', import.meta.url)),
      'react/jsx-runtime': fileURLToPath(new URL('./node_modules/react/jsx-runtime.js', import.meta.url)),
      'framer-motion': fileURLToPath(new URL('./apps/web/node_modules/framer-motion/dist/framer-motion.js', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/setup.tsx'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'apps/web/src/**/*.tsx'],
      exclude: ['src/server.ts'],
    },
  },
});
