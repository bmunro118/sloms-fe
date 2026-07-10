import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mirror the path aliases declared in tsconfig.json so tests resolve the same
// `@…` imports the app does. Keep in sync with tsconfig "paths".
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // __DEV__ is a Metro/Expo build-time global; provide it for the test runtime
  // so modules reading it (e.g. feature-flag defaults) behave like a dev build.
  define: {
    __DEV__: 'true',
  },
  resolve: {
    alias: {
      '@src': r('./src'),
      '@theme': r('./src/theme'),
      '@context': r('./src/context'),
      '@components': r('./src/components'),
      '@utils': r('./utils'),
      '@hooks': r('./src/hooks'),
      '@features': r('./src/features'),
      '@assets': r('./assets'),
    },
  },
  test: {
    // Keep node for pure logic tests; switch to jsdom/happy-dom when adding UI tests.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // The navigation-policy tests assert the page-gated nav items (documents,
    // price-list, vat-rates) are visible. Those flags default off everywhere
    // unless their EXPO_PUBLIC_FEATURE_* env var is set, so enable them for the
    // test run to match the "all pages enabled" config the tests target.
    env: {
      EXPO_PUBLIC_FEATURE_DOCUMENTS_PAGE: 'true',
      EXPO_PUBLIC_FEATURE_PRICE_LIST_PAGE: 'true',
      EXPO_PUBLIC_FEATURE_VAT_RATES_PAGE: 'true',
      // Pinned false so the navigation-policy tests stay deterministic even when
      // the stage Docker build runs `npm test` with the stats build-arg set.
      EXPO_PUBLIC_FEATURE_STATS_PAGE: 'false',
    },
  },
});
