import { test, expect } from '@playwright/test';

test.describe('Parties Module - Customers', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder(/email/i).fill('testuser@example.com');
        await page.getByPlaceholder(/password/i).fill('Test123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard|\/$/i, { timeout: 15000 });

        // Navigate to Parties -> Customers
        await page.getByRole('link', { name: /parties|customers/i }).click();
        // Assuming parties page defaults to customers or has a tab. 
        // Based on analysis, likely URL is /parties or /parties?type=CUSTOMER
    });

    test('should allow creating a new customer', async ({ page }) => {
        // Click Add Customer
        await page.getByRole('button', { name: /add customer|new party/i }).click();

        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /add new customer|add party/i })).toBeVisible();

        // Fill form
        const customerName = `Test Customer ${Date.now()}`;
        await page.getByLabel(/customer name|party name/i).fill(customerName);
        await page.locator('input[type="email"]').fill(`test${Date.now()}@example.com`);
        await page.locator('input[type="tel"]').fill('9876543210');

        // Save
        await page.getByRole('button', { name: /save|create/i }).click();

        // Verify success
        await expect(page.getByRole('dialog')).toBeHidden();

        // Customer should be in list
        // We might need to reload or wait for refresh
        await expect(page.getByText(customerName)).toBeVisible();
    });
});
