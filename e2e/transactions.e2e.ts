import { test, expect } from '@playwright/test';

test.describe('Transactions Pillar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the transactions page before each test
    // We assume the user is either mocked out or NextAuth is bypassed for tests,
    // or we can test the UI structure. If authentication blocks this, we need a setup step.
    await page.goto('/transactions');
  });

  test('should render the transactions page layout properly', async ({ page }) => {
    await expect(page.getByText(/Net Flow/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Transaction' })).toBeVisible();
  });

  test('should open and close the new transaction drawer', async ({ page }) => {
    await page.getByRole('button', { name: 'New Transaction' }).click();
    
    // Check if the drawer opens
    const drawerTitle = page.getByRole('heading', { name: 'Add Transaction' });
    await expect(drawerTitle).toBeVisible();

    // Close the drawer (Escape key)
    await page.keyboard.press('Escape');
    await expect(drawerTitle).not.toBeVisible();
  });

  test('should filter by transaction type', async ({ page }) => {
    // Click on a filter pill (e.g. "Income")
    const incomeFilter = page.getByRole('button', { name: 'Income', exact: true });
    await incomeFilter.click();
    
    // Verify the URL was updated
    await expect(page).toHaveURL(/.*type=income/);
    
    // Refresh and ensure state persists
    await page.reload();
    await expect(page).toHaveURL(/.*type=income/);
  });

  // Future tests for specific optimistic updates and flows
  // - Create, Edit, Split
  // - Command Palette navigation
});
