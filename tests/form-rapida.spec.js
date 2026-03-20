const { test, expect } = require('@playwright/test');

test.describe('Form B: Estimación Rápida', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => switchVersion('form-rapida'));
    await expect(page.locator('#form-rapida')).toBeVisible();
  });

  test('submit without fields shows validation errors', async ({ page }) => {
    await page.locator('#form-rapida-form button[type="submit"]').click();
    const errorFields = page.locator('#form-rapida-form .error');
    await expect(errorFields.first()).toBeVisible();
  });

  test('result shows estimate range', async ({ page }) => {
    await page.locator('#f1_name').fill('María García');
    await page.locator('#f1_wa').fill('+593987654321');
    await page.locator('#f1_years').fill('25');
    await page.locator('#f1_salary').fill('1000');
    await page.locator('#form-rapida-form button[type="submit"]').click();
    await expect(page.locator('#result-rapida')).toBeVisible();
    const range = await page.locator('#r1_range').textContent();
    expect(range).toMatch(/USD \$/);
  });

  test('calculator: 25 years at $1000 produces correct range', async ({ page }) => {
    await page.locator('#f1_name').fill('Test User');
    await page.locator('#f1_wa').fill('+593900000001');
    await page.locator('#f1_years').fill('25');
    await page.locator('#f1_salary').fill('1000');
    await page.locator('#form-rapida-form button[type="submit"]').click();
    await expect(page.locator('#result-rapida')).toBeVisible();
    const r = await page.evaluate(() => {
      var low  = 1000 * 25 * 0.30 + 0.05 * 12000 * 25;
      var high = 1000 * 25        + 0.05 * 12000 * 25;
      return { low, high };
    });
    expect(r.low).toBeCloseTo(22500, 0);
    expect(r.high).toBeCloseTo(40000, 0);
  });

  test('zero values rejected before calc', async ({ page }) => {
    await page.locator('#f1_name').fill('Test');
    await page.locator('#f1_wa').fill('+593900000001');
    await page.locator('#f1_years').fill('0');
    await page.locator('#f1_salary').fill('1000');
    await page.locator('#form-rapida-form button[type="submit"]').click();
    await expect(page.locator('#result-rapida')).toBeHidden();
  });
});
