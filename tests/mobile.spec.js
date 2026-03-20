const { test, expect, devices } = require('@playwright/test');

test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('nav is visible on mobile', async ({ page }) => {
    await expect(page.locator('.nav')).toBeVisible();
  });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await expect(page.locator('.hamburger')).toBeVisible();
  });

  test('sidebar opens on mobile', async ({ page }) => {
    await page.locator('.hamburger').click();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
  });

  test('form is single column on mobile', async ({ page }) => {
    await expect(page.locator('#form-minima')).toBeVisible();
    const formWidth = await page.locator('#form-minima').evaluate(el => el.offsetWidth);
    const viewportWidth = page.viewportSize().width;
    expect(formWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('WhatsApp button is visible on mobile', async ({ page }) => {
    await expect(page.locator('.whatsapp-btn')).toBeVisible();
  });
});
