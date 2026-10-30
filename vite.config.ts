import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig } from 'vitest/config';
import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Streaming SSR with no index.html and no entry files: the plugin generates
  // the entries around src/App.tsx, wrapped in src/Document.tsx. `vite build`
  // emits client assets to dist/client and the request handler to
  // dist/server; `pnpm start` serves both with server.js.
  plugins: [
    solid({
      start: {
        // Fetch-style chain fronting every request (API routes).
        middleware: './src/middleware.ts',
      },
      ssr: true,
      // Dev-only diagnostics surface at /__solid/diagnostics. No-op in build.
      diagnostics: true,
      // Compiles 'use server' functions into fetch calls on the client and
      // serves them from /_server. The configure module registers the
      // router's single-flight collector (see src/server-config.ts).
      serverFunctions: { configure: './src/server-config.ts' },
      // Also compile the `?pick=` route modules the fileRoutes plugin emits.
      extensions: ['.jsx', '.tsx'],
    }),
    fileRoutes({ httpMethods: true, types: true }),
    // Tailwind v4: no config file; tokens live in src/App.css.
    tailwindcss(),
  ],
  server: {
    port: 3000,
  },
  test: {
    globals: false,
    // Server-side suites only: every test in this repo tests an Effect
    // service. environment:'node' gets the plugin's server posture
    // (server resolve conditions, so `import 'server-only'` is allowed).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
