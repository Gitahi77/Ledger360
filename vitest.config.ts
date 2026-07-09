import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const browserEnabled = process.env.VITEST_BROWSER === 'true';

const projects = [
  {
    extends: true,
    test: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
];

if (browserEnabled) {
  projects.push({
    extends: true,
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })
    ],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{
          browser: 'chromium'
        }]
      }
    }
  } as any);
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects
  }
});