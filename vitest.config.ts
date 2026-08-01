import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const isIntegration = process.env.npm_lifecycle_event === 'test:integration';
const isStress = process.env.npm_lifecycle_event === 'test:stress';

const excludes = [
  '**/node_modules/**', '**/dist/**', '**/cypress/**', 
  '**/.{idea,git,cache,output,temp}/**', 
  '**/{karma,rollup,webpack,vite,vitest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', 
  '**/*.e2e.ts'
];

if (!isIntegration) excludes.push('**/*.integration.test.ts');
if (!isStress) excludes.push('**/*.stress.ts');

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    exclude: excludes,
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});