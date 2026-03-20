const { test, expect } = require('@playwright/test');

test.describe('Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('banner appears after 1 second on first visit', async ({ page }) => {
    const banner = page.locator('#cookie-banner');
    await expect(banner).not.toHaveClass(/visible/);
    await page.waitForTimeout(1200);
    await expect(banner).toHaveClass(/visible/);
  });

  test('accepting hides the banner', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.locator('.cookie-accept').click();
    await expect(page.locator('#cookie-banner')).not.toHaveClass(/visible/);
  });

  test('accepting stores consent in localStorage', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.locator('.cookie-accept').click();
    const consent = await page.evaluate(() => localStorage.getItem('pl_cookie_consent'));
    expect(consent).toBe('accepted');
  });

  test('rejecting hides the banner and stores rejection', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.locator('.cookie-reject').click();
    await expect(page.locator('#cookie-banner')).not.toHaveClass(/visible/);
    const consent = await page.evaluate(() => localStorage.getItem('pl_cookie_consent'));
    expect(consent).toBe('rejected');
  });

  test('banner does not show on return visit after accepting', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('pl_cookie_consent', 'accepted'));
    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.locator('#cookie-banner')).not.toHaveClass(/visible/);
  });

  test('banner does not show on return visit after rejecting', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('pl_cookie_consent', 'rejected'));
    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.locator('#cookie-banner')).not.toHaveClass(/visible/);
  });
});
