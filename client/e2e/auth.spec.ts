import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');

        // Check for login form elements
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder(/email/i).fill('invalid@test.com');
        await page.getByPlaceholder(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        // Should show error message
        await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 });
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder(/email/i).fill('testuser@example.com');
        await page.getByPlaceholder(/password/i).fill('Test123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        // Should redirect to dashboard
        await expect(page).toHaveURL(/dashboard|\/$/i, { timeout: 15000 });
    });

    test('should navigate to register page', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('link', { name: /sign up|register|create account/i }).click();

        await expect(page).toHaveURL(/register|signup/i);
    });
});

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.getByPlaceholder(/email/i).fill('testuser@example.com');
        await page.getByPlaceholder(/password/i).fill('Test123!');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page).toHaveURL(/dashboard|\/$/i, { timeout: 15000 });
    });

    test('should display dashboard stats', async ({ page }) => {
        // Dashboard should have stat cards
        await expect(page.locator('[data-testid="stat-card"]').or(page.locator('.stat-card'))).toBeVisible({ timeout: 10000 });
    });

    test('should have working navigation', async ({ page }) => {
        // Check sidebar navigation
        await expect(page.getByRole('link', { name: /sales|invoices/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /purchase|purchases/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /inventory|products/i })).toBeVisible();
    });
});
