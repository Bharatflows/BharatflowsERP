import { test, expect } from '@playwright/test';

test.describe('Sales Module - Invoices', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder(/email/i).fill('testuser@example.com');
        await page.getByPlaceholder(/password/i).fill('Test123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard|\/$/i, { timeout: 15000 });

        // Navigate to Sales
        await page.getByRole('link', { name: /sales/i }).click();
        await expect(page).toHaveURL(/\/sales/, { timeout: 10000 });
    });

    test('should allow creating a new invoice', async ({ page }) => {
        // Click New Invoice
        await page.getByRole('button', { name: /new invoice/i }).click();
        await expect(page).toHaveURL(/\/sales\/invoices\/new/);

        // Check initial state
        await expect(page.getByRole('heading', { name: /new invoice/i })).toBeVisible();
        await expect(page.getByText(/invoice items \(0\)/i)).toBeVisible();

        // Click Add Item
        await page.getByRole('button', { name: /add item/i }).first().click();

        // VERIFY: Item row should appear
        // The header count should update
        await expect(page.getByText(/invoice items \(1\)/i)).toBeVisible();

        // The row should be visible. We look for inputs or selects inside the row.
        // There is a placeholder "Select Item" in the Select Trigger
        await expect(page.getByText('Select Item')).toBeVisible();

        // Inputs should be visible
        await expect(page.getByPlaceholder('Add a description...')).toBeVisible();
    });
});
