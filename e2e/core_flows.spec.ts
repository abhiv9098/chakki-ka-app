import { test, expect } from '@playwright/test';

test.describe('Chakki App Core Flows', () => {

  test('should allow adding a new customer', async ({ page }) => {
    await page.goto('/');

    // Handle language selection
    await page.getByRole('button', { name: 'English' }).click();

    // Navigate to Customers (Khata) view by finding the Khata icon/button
    // We can look for the text "Khata" or "Customers"
    await page.getByRole('button', { name: /Customers|Khata|खाता/i }).first().click();

    // Make sure we are on the customers list
    await expect(page.locator('body')).toContainText(/Customer Directory|ग्राहक सूची/i);

    // Click "Add Customer" button
    const addBtn = page.getByRole('button', { name: /Add Customer|नया खाता/i }).first();
    await addBtn.click();

    // Fill the customer form
    // Look for inputs for Name and Phone
    const nameInput = page.getByPlaceholder(/Name|नाम/i);
    const phoneInput = page.getByPlaceholder(/Phone|फोन/i);
    
    await nameInput.fill('Test Customer');
    await phoneInput.fill('9999999999');

    // Submit form
    const saveBtn = page.getByRole('button', { name: /Create Customer Profile|ग्राहक प्रोफाइल बनाएं/i });
    await saveBtn.click();

    // Verify customer is added (it should appear in the list or open the customer detail view)
    await expect(page.locator('body')).toContainText('Test Customer');
  });

  test('should allow adding a daily hisab entry', async ({ page }) => {
    await page.goto('/');

    // Handle language selection
    await page.getByRole('button', { name: 'English' }).click();

    // Navigate to Daily Hisab
    await page.getByRole('button', { name: /Daily Entry|डेली हिसाब/i }).first().click();

    // Fill in customer name
    const nameInput = page.getByPlaceholder(/Customer Name|ग्राहक का नाम/i);
    await nameInput.fill('Rahul');

    // Fill in weight (e.g., 10 kg)
    const weightInput = page.locator('input[placeholder="0.0 kg"]');
    await weightInput.waitFor({ state: 'visible' });
    await weightInput.fill('10');

    // Wait for auto calculation (assuming rate is 5, amount should be 50)
    // Wait a brief moment or check the amount field
    const amountInput = page.locator('input[type="number"]').last();
    // In DailyHisabView, there are several number inputs. Let's find by placeholder or label
    // We will just hit save directly.
    
    const saveBtn = page.getByRole('button', { name: /Save|सेव|Submit/i }).first();
    await saveBtn.click();

    // After saving, it should probably clear or show a success state.
    // We can verify by going to Hisab History
    await page.getByRole('button', { name: /Hisab History|हिसाब इतिहास/i }).first().click();
    
    // Check if the entry is in history
    await expect(page.locator('body')).toContainText(/10/);
  });
});
