const { test, expect } = require('@playwright/test');

test.describe('Form A: Captura Mínima', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#form-minima')).toBeVisible();
  });

  test('submit without fields shows validation errors', async ({ page }) => {
    await page.locator('#form-minima .btn-gold').click();
    const errorFields = page.locator('#form-minima-form .error');
    await expect(errorFields).toHaveCount(2);
  });

  test('valid submission shows result panel', async ({ page }) => {
    await page.locator('#fa_name').fill('Juan Pérez');
    await page.locator('#fa_wa').fill('+593991234567');
    await page.locator('#form-minima .btn-gold').click();
    await expect(page.locator('#result-minima')).toBeVisible();
  });

  test('lead data saved to localStorage after submission', async ({ page }) => {
    await page.locator('#fa_name').fill('Juan Pérez');
    await page.locator('#fa_wa').fill('+593991234567');
    await page.locator('#form-minima .btn-gold').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pl_lead_t1') || '{}'));
    expect(saved.name).toBe('Juan Pérez');
    expect(saved.whatsapp).toBe('+593991234567');
  });

  test('honeypot filled blocks submission', async ({ page }) => {
    await page.locator('#fa_name').fill('Juan Pérez');
    await page.locator('#fa_wa').fill('+593991234567');
    await page.evaluate(() => { document.getElementById('hp0').value = 'spam'; });
    await page.locator('#form-minima .btn-gold').click();
    await expect(page.locator('#result-minima')).toBeHidden();
  });
});
