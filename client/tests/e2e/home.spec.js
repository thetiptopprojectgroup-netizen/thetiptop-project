import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('displays main content', async ({ page }) => {
    await page.goto('/');

    // Ajuster ces sélecteurs/textes en fonction du contenu réel de HomePage
    await expect(page).toHaveTitle(/th[eé] tip top/i);
    await expect(page.getByText(/jeu-concours/i)).toBeVisible();
  });
});

