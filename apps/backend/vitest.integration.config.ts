import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
    include: ['src/tests/integration/**/*.test.ts'],
    globalSetup: ['./src/tests/globalSetup.ts'],
    setupFiles: ['./src/tests/integration/setup.ts'],
  },
});
