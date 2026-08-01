import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';

const authFile = path.join(__dirname, '../.playwright/user.json');

setup('authenticate', async ({ page }) => {
  // 1. Seed the E2E user in the database
  console.log('Seeding E2E user...');
  execSync('npx tsx --env-file=.env scripts/seed-e2e.ts', { stdio: 'inherit' });

  // 2. Log in
  await page.goto('/login');
  await page.fill('input[type="email"]', 'e2e@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Wait for redirect to complete
  await expect(page).not.toHaveURL(/.*login/, { timeout: 8000 });

  // Ensure we are logged in
  await expect(page).not.toHaveURL(/.*login/);
  await expect(page).not.toHaveURL(/.*signup/);

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
