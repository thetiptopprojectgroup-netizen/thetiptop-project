import { test, expect } from '@playwright/test';

test.describe('E2E — parcours publics (7)', () => {
  test('1 · Accueil — hero et badge jeu-concours', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Grand jeu-concours Thé Tip Top')).toBeVisible();
  });

  test('2 · Connexion — champs email / mot de passe', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('3 · Inscription — titre création compte', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /créez votre compte/i })).toBeVisible();
  });

  test('4 · Règlement — titre officiel', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.getByRole('heading', { name: /règlement du jeu-concours/i })).toBeVisible();
  });

  test('5 · FAQ — titre', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /^FAQ$/i })).toBeVisible();
  });

  test('6 · Lots — titre principal', async ({ page }) => {
    await page.goto('/prizes');
    await expect(page.getByRole('heading', { name: /les lots à gagner/i })).toBeVisible();
  });

  test('7 · Comment participer', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.getByRole('heading', { name: /comment participer/i })).toBeVisible();
  });
});
