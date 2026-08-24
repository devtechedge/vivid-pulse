import { expect, test } from '@playwright/test';

test.describe('VividPulse smokes', () => {
  test('login page renders branded demo ports', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'VividPulse' })).toBeVisible();
    await expect(page.getByTestId('quick-login-alex')).toBeVisible();
  });

  test('quick login lands on a seeded feed', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('quick-login-alex').click();
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByTestId('feed-page')).toBeVisible();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('sidebar opens neighbors and discover', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('quick-login-alex').click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 20_000 });

    await page.getByTestId('nav-neighbors').click();
    await expect(page).toHaveURL(/\/neighbors/);
    await expect(page.getByTestId('neighbors-page')).toBeVisible();
    await expect(page.getByText('Cozy Neighborhood Hub')).toBeVisible();

    await page.getByTestId('nav-discover').click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByTestId('discover-page')).toBeVisible();
    await expect(page.getByText('Find Beautiful Photos')).toBeVisible();
  });

  test('unauthenticated visitors are sent to login', async ({ page }) => {
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('quick-login-alex').click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
