const { test, expect } = require('@playwright/test');

test.describe('Form Version Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('form-minima is visible by default', async ({ page }) => {
    await expect(page.locator('#form-minima')).toBeVisible();
    await expect(page.locator('#form-rapida')).toBeHidden();
    await expect(page.locator('#form-detallada')).toBeHidden();
  });

  test('switching to form-rapida shows correct form', async ({ page }) => {
    await page.evaluate(() => switchVersion('form-rapida'));
    await expect(page.locator('#form-rapida')).toBeVisible();
    await expect(page.locator('#form-minima')).toBeHidden();
    await expect(page.locator('#form-detallada')).toBeHidden();
  });

  test('switching to form-detallada shows correct form', async ({ page }) => {
    await page.evaluate(() => switchVersion('form-detallada'));
    await expect(page.locator('#form-detallada')).toBeVisible();
    await expect(page.locator('#form-minima')).toBeHidden();
    await expect(page.locator('#form-rapida')).toBeHidden();
  });

  test('demo nav buttons update active state', async ({ page }) => {
    const btns = page.locator('.demo-nav-btn');
    await expect(btns.nth(0)).toHaveClass(/active/);
    await page.evaluate(() => switchVersion('form-rapida'));
    await expect(btns.nth(1)).toHaveClass(/active/);
    await expect(btns.nth(0)).not.toHaveClass(/active/);
  });

  test('sidebar switcher buttons work', async ({ page }) => {
    await page.locator('.hamburger').click();
    await page.locator('[onclick="switchVersion(\'form-detallada\')"]').first().click();
    await expect(page.locator('#form-detallada')).toBeVisible();
  });
});
