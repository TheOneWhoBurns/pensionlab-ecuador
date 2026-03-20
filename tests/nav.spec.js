const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sticky nav is visible on load', async ({ page }) => {
    await expect(page.locator('.nav')).toBeVisible();
  });

  test('nav gets scrolled class after scrolling 50px', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 60));
    await expect(page.locator('.nav')).toHaveClass(/scrolled/);
  });

  test('sidebar opens and closes', async ({ page }) => {
    await page.locator('.hamburger').click();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await page.locator('#sidebar-overlay').click();
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  });

  test('CTA button scrolls to form section', async ({ page }) => {
    await page.locator('.nav .btn-gold').first().click();
    await page.waitForTimeout(600);
    const formSection = page.locator('#formularios');
    await expect(formSection).toBeInViewport();
  });
});
