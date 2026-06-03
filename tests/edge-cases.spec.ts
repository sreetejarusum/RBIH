/**
 * Edge Case & Boundary Tests
 *
 * Probes error handling, boundary arithmetic, and resilience
 * against malformed inputs. Documents expected "Error" display
 * for undefined/invalid mathematical operations.
 *
 * Known bugs covered:
 *   BUG-008 — Division by zero shows Infinity instead of Error
 */

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/CalculatorPage';

test.describe('Division by Zero (BUG-008)', () => {
  test('BUG-008 — 1 ÷ 0 should display Error, not Infinity', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1÷0');
    await calc.calculate();
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-008: 1÷0 should show Error, not Infinity').toBe('Error');
  });

  test('BUG-008 — 0 ÷ 0 should display Error, not NaN', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0÷0');
    await calc.calculate();
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-008: 0÷0 should show Error, not NaN').toBe('Error');
  });
});

test.describe('Malformed Expression Handling', () => {
  test('incomplete expression: "5 +" shows Error, not crash', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5+');
    await calc.calculate();
    await calc.expectDisplay('Error');
  });

  test('leading operator: "×5" shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.multiplyBtn.click();
    await calc.typeExpression('5');
    await calc.calculate();
    await calc.expectDisplay('Error');
  });

  test('consecutive operators: "5 + + 3" shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5++');
    await calc.digit3.click();
    await calc.calculate();
    await calc.expectDisplay('Error');
  });

  test('unmatched open parenthesis: "(5" shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('(5');
    await calc.calculate();
    await calc.expectDisplay('Error');
  });

  test('unmatched close parenthesis: "5)" shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5)');
    await calc.calculate();
    await calc.expectDisplay('Error');
  });

  test('empty expression: pressing = on blank display shows Error or empty', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.calculate();
    const val = await calc.getDisplayValue();
    // Either empty or Error is acceptable — but must not crash
    expect(['', 'Error', '0']).toContain(val);
  });

  test('only parentheses: "()" shows Error or 0', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('()');
    await calc.calculate();
    const val = await calc.getDisplayValue();
    expect(['Error', 'NaN', '0']).toContain(val);
  });
});

test.describe('Decimal Point Edge Cases', () => {
  test('multiple decimals in one number: "1.2.3" shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1.2.');
    await calc.digit3.click();
    await calc.calculate();
    // Parser treats "1.2.3" as invalid float — should show Error or NaN
    const val = await calc.getDisplayValue();
    expect(['Error', 'NaN']).toContain(val);
  });

  test('leading decimal: .5 + .5 = 1', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('.5+.5');
    await calc.calculate();
    await calc.expectDisplay('1');
  });

  test('trailing decimal: "5." = 5', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5.');
    await calc.calculate();
    await calc.expectDisplay('5');
  });
});

test.describe('Large Number Boundary', () => {
  test('large integer arithmetic: 999999 + 1 = 1000000', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('999999+1');
    await calc.calculate();
    await calc.expectDisplay('1000000');
  });

  test('large multiplication does not overflow to Infinity', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('99999×99999');
    await calc.calculate();
    const val = await calc.getDisplayValue();
    expect(val).not.toBe('Infinity');
    expect(val).toBe('9999800001');
  });
});

test.describe('State Isolation After Error', () => {
  test('after Error, C clears and calculator accepts new input', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5+');
    await calc.calculate();
    await calc.expectDisplay('Error');
    await calc.clear();
    await calc.expectDisplay('');
    await calc.typeExpression('2+2');
    await calc.calculate();
    await calc.expectDisplay('4');
  });
});

test.describe('Repeated Equals (Result Chaining)', () => {
  test('pressing = twice on a result does not corrupt display', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2+2');
    await calc.calculate();
    await calc.calculate(); // second = press
    const val = await calc.getDisplayValue();
    // Second = on a plain number result should either stay 4 or show Error — not corrupt
    expect(['4', 'Error']).toContain(val);
  });
});

test.describe('Appending After Result', () => {
  test('appending a digit after = continues building expression', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2+2');
    await calc.calculate();
    await calc.digit1.click(); // appends '1' to '4' → '41'
    const display = await calc.getDisplayValue();
    // Expected: '41' (calculator appends); acceptable UX variant: clears and starts with '1'
    expect(['41', '1']).toContain(display);
  });
});
