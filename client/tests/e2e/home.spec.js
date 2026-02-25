import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('displays main content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/th[eé] tip top/i);
    await expect(page.getByText('Grand Jeu-Concours', { exact: true })).toBeVisible();
  });
});

