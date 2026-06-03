/**
 * Arithmetic Operation Tests
 *
 * Covers addition, subtraction, multiplication, division, and combined
 * expressions. Tests deliberately document expected vs actual behaviour
 * for known bugs so failures are self-describing.
 */

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/CalculatorPage';

test.describe('Addition', () => {
  test('2 + 3 = 5', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2+3');
    await calc.calculate();
    await calc.expectDisplay('5');
  });

  test('0 + 0 = 0', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0+0');
    await calc.calculate();
    await calc.expectDisplay('0');
  });

  test('large numbers: 99 + 1 = 100', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('99+1');
    await calc.calculate();
    await calc.expectDisplay('100');
  });

  test('decimal addition: 1.5 + 2.5 = 4', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1.5+2.5');
    await calc.calculate();
    await calc.expectDisplay('4');
  });

  test('chained additions: 1 + 2 + 3 = 6', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1+2+');
    // digit 3 labeled button is bugged; use separate digit clicks workaround
    await calc.digit3.click(); // BUG-002: appends 0, not 3
    await calc.calculate();
    // Document actual broken result so failure message is clear
    const display = await calc.getDisplayValue();
    // Expected correct: 6 | Actual due to BUG-002: 1+2+0 = 3
    expect(display, 'BUG-002: digit "3" button appends 0 — chain 1+2+3 lands as 1+2+0=3').toBe('6');
  });
});

test.describe('Subtraction', () => {
  /**
   * BUG-001: The subtraction button (−) calls append('/') instead of append('-').
   * All subtraction tests will fail until this is fixed.
   */

  test('BUG-001 — subtract button should append minus, not division slash', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.digit5.click();
    await calc.subtractBtn.click();
    const displayAfterOperator = await calc.getDisplayValue();
    expect(
      displayAfterOperator,
      'BUG-001: − button appends "/" instead of "-"',
    ).toBe('5-');
  });

  test('5 − 3 = 2', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('5−');
    await calc.digit3.click();
    await calc.calculate();
    await calc.expectDisplay('2');
  });

  test('10 − 10 = 0 (identity)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.digit0.click(); // second 0 button (the real 0)
    await calc.subtractBtn.click();
    await calc.typeExpression('1');
    await calc.digit0.click();
    await calc.calculate();
    await calc.expectDisplay('0');
  });

  test('1 − 5 = −4 (result crosses zero)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1−5');
    await calc.calculate();
    await calc.expectDisplay('-4');
  });
});

test.describe('Multiplication', () => {
  test('3 × 4 = 12', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.digit3.click();
    await calc.multiplyBtn.click();
    await calc.digit4.click();
    await calc.calculate();
    await calc.expectDisplay('12');
  });

  test('0 × 9 = 0 (zero property)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0×9');
    await calc.calculate();
    await calc.expectDisplay('0');
  });

  test('1 × 7 = 7 (identity)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1×7');
    await calc.calculate();
    await calc.expectDisplay('7');
  });

  test('decimal multiplication: 2.5 × 4 = 10', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2.5×4');
    await calc.calculate();
    await calc.expectDisplay('10');
  });

  test('negative result: multiplication operand order preserved', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('6×7');
    await calc.calculate();
    await calc.expectDisplay('42');
  });
});

test.describe('Division', () => {
  /**
   * BUG-003: The evaluator has division operands reversed.
   * _0x692a/_0x831edg should be _0x831edg/_0x692a.
   * e.g. 6÷2 evaluates as 2÷6 = 0.333… instead of 3.
   */

  test('BUG-003 — 6 ÷ 2 should equal 3, not 0.333…', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('6÷2');
    await calc.calculate();
    await calc.expectDisplay('3');
  });

  test('10 ÷ 2 = 5', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.digit0.click();
    await calc.divideBtn.click();
    await calc.digit2.click();
    await calc.calculate();
    await calc.expectDisplay('5');
  });

  test('9 ÷ 3 = 3', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('9÷');
    await calc.digit3.click();
    await calc.calculate();
    await calc.expectDisplay('3');
  });

  test('1 ÷ 4 = 0.25 (fractional result)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1÷4');
    await calc.calculate();
    await calc.expectDisplay('0.25');
  });

  test('7 ÷ 1 = 7 (identity)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('7÷1');
    await calc.calculate();
    await calc.expectDisplay('7');
  });
});

test.describe('Operator Precedence', () => {
  test('2 + 3 × 4 = 14 (multiplication before addition)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2+');
    await calc.digit3.click();
    await calc.typeExpression('×4');
    await calc.calculate();
    await calc.expectDisplay('14');
  });

  test('(2 + 3) × 4 = 20 (parentheses override precedence)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('(2+');
    await calc.digit3.click();
    await calc.typeExpression(')×4');
    await calc.calculate();
    await calc.expectDisplay('20');
  });

  test('nested parentheses: (1 + (2 × 3)) + 4 = 11', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('(1+(2×');
    await calc.digit3.click();
    await calc.typeExpression('))+4');
    await calc.calculate();
    await calc.expectDisplay('11');
  });
});

test.describe('Clear Functionality', () => {
  test('C clears the display to empty', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1+2');
    await calc.clear();
    await calc.expectDisplay('');
  });

  test('C then new input works correctly', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('9×9');
    await calc.calculate();
    await calc.clear();
    await calc.typeExpression('4+4');
    await calc.calculate();
    await calc.expectDisplay('8');
  });
});

test.describe('Digit Button Mapping (BUG-002)', () => {
  /**
   * BUG-002: The button labeled "3" has onclick="append('0')" — it appends
   * the digit 0, making the real digit 3 unreachable via UI.
   */

  test('each digit button appends the digit shown on its label', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();

    const digitButtons = [
      { label: '0', expected: '0' },
      { label: '1', expected: '1' },
      { label: '2', expected: '2' },
      { label: '3', expected: '3' }, // BUG-002: will append 0
      { label: '4', expected: '4' },
      { label: '5', expected: '5' },
      { label: '6', expected: '6' },
      { label: '7', expected: '7' },
      { label: '8', expected: '8' },
      { label: '9', expected: '9' },
    ];

    for (const { label, expected } of digitButtons) {
      await calc.clear();
      const actual = await calc.clickDigitAndRead(label);
      expect(actual, `Button labeled "${label}" should append "${expected}" to display`).toBe(
        expected,
      );
    }
  });
});
