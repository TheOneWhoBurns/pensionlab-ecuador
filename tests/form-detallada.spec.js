const { test, expect } = require('@playwright/test');

test.describe('Form C: Estimación Detallada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => switchVersion('form-detallada'));
    await expect(page.locator('#form-detallada')).toBeVisible();
  });

  async function fillDetallada(page, opts = {}) {
    await page.locator('#f2_salary').fill(opts.salary || '1200');
    await page.locator('#f2_dob').fill(opts.dob || '1965-03-15');
    await page.locator('#f2_sexo').selectOption(opts.sexo || 'M');
    await page.locator('#f2_employer').fill(opts.employer || 'Empresa Test SA');
    await page.locator('#f2_ingreso').fill(opts.ingreso || '1995-01-01');
    if (!opts.stillWorking) {
      await page.locator('#f2_salida').fill(opts.salida || '2022-06-30');
      await page.locator('#f2_motivo').selectOption(opts.motivo || 'renuncia');
    } else {
      await page.locator('#f2_still').check();
    }
    await page.locator('#f2_fondo').selectOption(opts.fondo || 'depositado');
    await page.locator('#f2_modalidad').selectOption(opts.modalidad || 'pension');
  }

  test('toggling "aún trabajo ahí" disables exit date', async ({ page }) => {
    await page.locator('#f2_still').check();
    await expect(page.locator('#f2_salida')).toBeDisabled();
    await page.locator('#f2_still').uncheck();
    await expect(page.locator('#f2_salida')).toBeEnabled();
  });

  test('valid submission shows result', async ({ page }) => {
    await fillDetallada(page);
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeVisible();
  });

  test('result shows years of service', async ({ page }) => {
    await fillDetallada(page);
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeVisible();
    const yearsText = await page.locator('#r2_years').textContent();
    expect(yearsText).toMatch(/años de servicio/);
  });

  test('25+ years shows eligibility', async ({ page }) => {
    await fillDetallada(page, { ingreso: '1995-01-01', salida: '2022-06-30', motivo: 'renuncia' });
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeVisible();
    const eligText = await page.locator('#r2_elig').textContent();
    expect(eligText).toMatch(/Califica/);
  });

  test('< 20 years shows ineligible warning', async ({ page }) => {
    await fillDetallada(page, { ingreso: '2015-01-01', salida: '2022-06-30', motivo: 'renuncia' });
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeVisible();
    const eligText = await page.locator('#r2_elig').textContent();
    expect(eligText).toMatch(/no cumple/);
  });

  test('20-24 years with despido shows eligible', async ({ page }) => {
    await fillDetallada(page, { ingreso: '2000-01-01', salida: '2022-06-30', motivo: 'despido' });
    await page.locator('#form-detallada-form .btn-gold').click();
    const eligText = await page.locator('#r2_elig').textContent();
    expect(eligText).toMatch(/Califica/);
  });

  test('pension amount is positive number', async ({ page }) => {
    await fillDetallada(page);
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeVisible();
    const pensionText = await page.locator('#r2_pension').textContent();
    expect(pensionText).toMatch(/USD \$[\d.,]+\/mes/);
  });

  test('honeypot blocks submission', async ({ page }) => {
    await fillDetallada(page);
    await page.evaluate(() => { document.getElementById('hp2').value = 'bot'; });
    await page.locator('#form-detallada-form .btn-gold').click();
    await expect(page.locator('#result-detallada')).toBeHidden();
  });
});
