/**
 * UI & Layout Tests
 *
 * Validates structural presence, accessibility, and visual layout of the
 * calculator interface. Catches button inventory gaps and grid anomalies.
 *
 * Known layout bugs documented:
 *   BUG-009 — log button wraps to an orphan row (5 sci buttons in 4-column grid)
 *   BUG-010 — no keyboard input support
 */

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/CalculatorPage';

test.describe('Page Load', () => {
  test('page title is "Scientific Calculator"', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await expect(page).toHaveTitle('Scientific Calculator');
  });

  test('display input is present and initially empty', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await expect(calc.display).toBeVisible();
    await calc.expectDisplay('');
  });

  test('display is read-only (disabled attribute)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await expect(calc.display).toBeDisabled();
  });
});

test.describe('Button Inventory', () => {
  const expectedButtons = [
    'C', '(', ')', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '.', '=',
    'sin', 'cos', 'tan', '√', 'log',
  ];

  for (const label of expectedButtons) {
    test(`button "${label}" is present and visible`, async ({ page }) => {
      const calc = new CalculatorPage(page);
      await calc.goto();
      const btn = page.getByRole('button', { name: label, exact: true });
      await expect(btn).toBeVisible();
    });
  }
});

test.describe('Button Clickability', () => {
  test('all digit buttons are enabled', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      await expect(
        page.getByRole('button', { name: digit, exact: true }),
      ).toBeEnabled();
    }
  });

  test('all operator buttons are enabled', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    for (const op of ['÷', '×', '−', '+', '=', 'C']) {
      await expect(
        page.getByRole('button', { name: op, exact: true }),
      ).toBeEnabled();
    }
  });

  test('all scientific function buttons are enabled', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    for (const fn of ['sin', 'cos', 'tan', '√', 'log']) {
      await expect(
        page.getByRole('button', { name: fn, exact: true }),
      ).toBeEnabled();
    }
  });
});

test.describe('Grid Layout (BUG-009)', () => {
  test('numeric grid has exactly 4 columns', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    const grid = page.locator('.buttons');
    const style = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    // Expect 4 equal column tracks
    const columns = style.trim().split(/\s+/);
    expect(columns.length, 'Button grid should have 4 columns').toBe(4);
  });

  test('BUG-009 — all 5 scientific buttons share the same visual row area', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();

    const sinBox = await page.getByRole('button', { name: 'sin' }).boundingBox();
    const logBox = await page.getByRole('button', { name: 'log' }).boundingBox();

    expect(sinBox).not.toBeNull();
    expect(logBox).not.toBeNull();

    // In a 4-column grid, 5 buttons span 2 rows; sin and log should be in different rows
    // (logBox.y > sinBox.y). This is actually acceptable layout IF log is clearly associated.
    // BUG-009: log is isolated in the last row, bottom-left — visually disconnected.
    if (sinBox && logBox) {
      const sameRow = Math.abs(sinBox.y - logBox.y) < 5;
      expect(
        sameRow,
        'BUG-009: log button is orphaned in its own row due to 5 buttons in a 4-column grid',
      ).toBe(true);
    }
  });

  test('= button row has all 4 columns filled', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    // Row 5 contains: 0, ., = — only 3 buttons; 4th slot is empty
    const zeroBox = await page.getByRole('button', { name: '0' }).first().boundingBox();
    const equalsBox = await page.getByRole('button', { name: '=' }).boundingBox();
    expect(zeroBox).not.toBeNull();
    expect(equalsBox).not.toBeNull();
    // The row has a gap in column 4. Document expected vs actual button count in the row.
    const buttonsInEqualsRow = page.locator('.buttons button').filter({ hasText: /^[0\.=]$/ });
    const count = await buttonsInEqualsRow.count();
    expect(count, 'Row containing "=" should have 4 buttons to fill the grid').toBe(4);
  });
});

test.describe('Keyboard Input (BUG-010)', () => {
  test('BUG-010 — pressing digit keys should update the display', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await page.keyboard.press('5');
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-010: keyboard digit input not supported — display should show "5"').toBe('5');
  });

  test('BUG-010 — pressing Enter should trigger calculation', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2+2');
    await page.keyboard.press('Enter');
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-010: Enter key should calculate — expected "4"').toBe('4');
  });

  test('BUG-010 — pressing Escape/Delete should clear the display', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('9+9');
    await page.keyboard.press('Escape');
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-010: Escape should clear display').toBe('');
  });
});

test.describe('Visual Consistency', () => {
  test('calculator container is centered on the page', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    const container = page.locator('.calculator');
    await expect(container).toBeVisible();
    const box = await container.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      const centerX = box.x + box.width / 2;
      const pageCenter = viewport.width / 2;
      expect(Math.abs(centerX - pageCenter)).toBeLessThan(5);
    }
  });

  test('display input has right-aligned text', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    const textAlign = await calc.display.evaluate(
      (el) => getComputedStyle(el).textAlign,
    );
    expect(textAlign).toBe('right');
  });
});
