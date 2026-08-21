import { test, expect } from '@playwright/test';

test('has title and some text', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Chakki/i);

  // Check if some dashboard content is visible
  // The app should have a text "TODAY CASH" or "आज का कैश"
  // Let's use a very generic text that might be visible
  await expect(page.locator('body')).toContainText(/TODAY|आज/i);
});
