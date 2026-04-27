import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config'],
    exclude: ['bin/**', 'node_modules/**'],
    coverage: {
      exclude: [
        '**/*.iac.ts',
        '**/iac/**',
        '**/di.ts',
        '**/config.ts',
        'bin/*.ts',
        'vitest.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'src/lib'),
    },
  },
});
