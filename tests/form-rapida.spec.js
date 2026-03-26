const { test, expect } = require('@playwright/test');

test.describe('Form: Consulta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#formularios')).toBeVisible();
  });

  test('submit without fields triggers browser validation', async ({ page }) => {
    await page.locator('#form-rapida-form button[type="submit"]').click();
    // Browser native validation prevents submission when required fields are empty
    const isInvalid = await page.evaluate(() => {
      return !document.getElementById('form-rapida-form').checkValidity();
    });
    expect(isInvalid).toBe(true);
  });

  test('form has all required fields', async ({ page }) => {
    await expect(page.locator('#f1_name')).toBeVisible();
    await expect(page.locator('#f1_email')).toBeVisible();
    await expect(page.locator('#f1_wa')).toBeVisible();
    await expect(page.locator('#f1_years')).toBeVisible();
  });

  test('form action sends to FormSubmit', async ({ page }) => {
    const action = await page.locator('#form-rapida-form').getAttribute('action');
    expect(action).toContain('formsubmit.co');
    expect(action).toContain('info@pensionlabec.com');
  });

  test('valid form passes validation', async ({ page }) => {
    await page.locator('#f1_name').fill('María García');
    await page.locator('#f1_email').fill('maria@test.com');
    await page.locator('#f1_wa').fill('+593987654321');
    await page.locator('#f1_years').fill('25');
    // Intercept form submission to prevent actual navigation
    await page.route('**/formsubmit.co/**', route => route.fulfill({ status: 200, body: 'OK' }));
    await page.locator('#form-rapida-form button[type="submit"]').click();
    const errorFields = page.locator('#form-rapida-form .error');
    await expect(errorFields).toHaveCount(0);
  });
});
