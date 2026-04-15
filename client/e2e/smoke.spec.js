import { test, expect } from '@playwright/test';

test.describe('Smoke E2E', () => {
  test('page d’accueil affiche le hero du jeu-concours', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Grand jeu-concours Thé Tip Top')).toBeVisible();
    await expect(page.getByRole('heading', { name: /100% des tickets/i })).toBeVisible();
  });

  test('page connexion affiche le formulaire', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Bon retour parmi nous/i })).toBeVisible();
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });
});
