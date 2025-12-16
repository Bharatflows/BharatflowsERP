import { test, expect } from '@playwright/test';

test.describe('Inventory Module - Products', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder(/email/i).fill('testuser@example.com');
        await page.getByPlaceholder(/password/i).fill('Test123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard|\/$/i, { timeout: 15000 });

        // Navigate to Inventory -> Products
        await page.getByRole('link', { name: /inventory/i }).click();
        await page.getByRole('link', { name: /product/i }).click();
    });

    test('should allow creating a new product', async ({ page }) => {
        // Click Add Product
        await page.getByRole('button', { name: /add product/i }).click();

        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /add new product/i })).toBeVisible();

        // Fill form
        const productName = `Test Product ${Date.now()}`;
        await page.getByLabel(/product name/i).fill(productName);
        await page.getByLabel(/sku|code/i).fill(`SKU-${Date.now()}`);

        // Fill Price (assuming there are inputs for price)
        // We use getByRole or locator if labels are ambiguous
        await page.locator('input[type="number"]').first().fill('100'); // Selling Price

        // Save
        await page.getByRole('button', { name: /save|create/i }).click();

        // Verify success
        // Dialog should close
        await expect(page.getByRole('dialog')).toBeHidden();

        // Product should be in list
        await expect(page.getByText(productName)).toBeVisible();
    });
});
