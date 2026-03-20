const { test, expect } = require('@playwright/test');

test.describe('WhatsApp Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('floating WhatsApp button is visible', async ({ page }) => {
    await expect(page.locator('.whatsapp-btn')).toBeVisible();
  });

  test('WhatsApp button opens wa.me link', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.whatsapp-btn').click(),
    ]);
    expect(popup.url()).toMatch(/wa\.me\//);
    await popup.close();
  });

  test('WhatsApp link includes pre-filled message', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.whatsapp-btn').click(),
    ]);
    expect(popup.url()).toMatch(/text=/);
    await popup.close();
  });
});
