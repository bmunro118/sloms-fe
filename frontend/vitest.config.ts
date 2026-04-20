import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Keep node for pure logic tests; switch to jsdom/happy-dom when adding UI tests.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
