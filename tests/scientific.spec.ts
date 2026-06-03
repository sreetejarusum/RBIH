/**
 * Scientific Function Tests
 *
 * Covers sin, cos, tan, √ (sqrt), and log.
 *
 * Known bugs documented inline:
 *   BUG-004 — sin always returns 1 (hardcoded XOR result 434563^434562 = 1)
 *   BUG-005 — trig functions use radians; no degree-mode toggle available
 *   BUG-006 — sqrt of negative number shows NaN instead of Error
 *   BUG-007 — log(0) shows -Infinity, log(-1) shows NaN instead of Error
 *
 * Reference values use JavaScript's Math library (radian inputs).
 */

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/CalculatorPage';

const CALC_URL = '/calculator/index.html';

// ---------------------------------------------------------------------------
// sin
// ---------------------------------------------------------------------------
test.describe('sin function', () => {
  test('BUG-004 — sin(0) should return 0, not 1', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0');
    await calc.sinBtn.click();
    await calc.expectDisplay('0');
  });

  test('BUG-004 — sin(1) should return ~0.8415, not 1', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.sinBtn.click();
    // Math.sin(1) ≈ 0.8414709848078965
    await calc.expectDisplayApprox(Math.sin(1), 1e-6);
  });

  test('sin of non-numeric input shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    // Enter an expression, not a plain number — func() parses only single floats
    await calc.typeExpression('1+2');
    await calc.sinBtn.click();
    await calc.expectDisplay('Error');
  });

  test('sin on empty display shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.sinBtn.click();
    await calc.expectDisplay('Error');
  });
});

// ---------------------------------------------------------------------------
// cos
// ---------------------------------------------------------------------------
test.describe('cos function', () => {
  test('cos(0) = 1', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0');
    await calc.cosBtn.click();
    await calc.expectDisplayApprox(1, 1e-9);
  });

  test('cos(1) ≈ 0.5403', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.cosBtn.click();
    await calc.expectDisplayApprox(Math.cos(1), 1e-6);
  });

  test('cos on empty display shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.cosBtn.click();
    await calc.expectDisplay('Error');
  });
});

// ---------------------------------------------------------------------------
// tan
// ---------------------------------------------------------------------------
test.describe('tan function', () => {
  test('tan(0) = 0', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0');
    await calc.tanBtn.click();
    await calc.expectDisplayApprox(0, 1e-9);
  });

  test('tan(1) ≈ 1.5574', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.tanBtn.click();
    await calc.expectDisplayApprox(Math.tan(1), 1e-6);
  });

  test('tan on empty display shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.tanBtn.click();
    await calc.expectDisplay('Error');
  });

  test('BUG-005 — trig accepts radians: tan(π/4) should equal 1', async ({ page }) => {
    // π/4 in radians ≈ 0.7854; Math.tan(Math.PI/4) ≈ 1
    // The calculator has no π button, so we approximate using decimal input.
    const calc = new CalculatorPage(page);
    await calc.goto();
    // Type 0.7854 (approximation of π/4)
    await calc.typeExpression('0.7854');
    await calc.tanBtn.click();
    const result = parseFloat(await calc.getDisplayValue());
    expect(Math.abs(result - 1)).toBeLessThan(0.001);
  });
});

// ---------------------------------------------------------------------------
// sqrt
// ---------------------------------------------------------------------------
test.describe('sqrt function', () => {
  test('√4 = 2', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('4');
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(2, 1e-9);
  });

  test('√9 = 3', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('9');
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(3, 1e-9);
  });

  test('√2 ≈ 1.4142 (irrational)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2');
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(Math.sqrt(2), 1e-6);
  });

  test('√1 = 1 (identity)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(1, 1e-9);
  });

  test('√0 = 0', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0');
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(0, 1e-9);
  });

  test('√100 = 10', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.digit1.click();
    await calc.digit0.click();
    await calc.digit0.click();
    await calc.sqrtBtn.click();
    await calc.expectDisplayApprox(10, 1e-9);
  });

  test('BUG-006 — √(−1) should display Error, not NaN', async ({ page }) => {
    // Entering a negative number directly requires the − operator first,
    // which itself has BUG-001 (appends '/'). We use a workaround: press 1,
    // then subtract 2 (using the bugged button) and calculate to reach -1,
    // but that's too indirect. Instead we document the scenario assuming
    // the bug is eventually given a fix for BUG-001.
    //
    // As-is, we verify behavior when a subtraction result is passed to sqrt:
    // if BUG-001 is also present, this test surfaces it first.
    const calc = new CalculatorPage(page);
    await calc.goto();
    // Attempt: type 1, subtract 2 to get -1, then evaluate, then sqrt
    // (Two bugs in play — this test will fail for either reason)
    await calc.digit1.click();
    await calc.subtractBtn.click(); // BUG-001: actually appends '/', not '-'
    await calc.digit2.click();
    await calc.calculate();
    const intermediate = await calc.getDisplayValue();
    // If BUG-001 is fixed the intermediate should be -1; then proceed with sqrt
    if (intermediate === '-1') {
      await calc.sqrtBtn.click();
      const result = await calc.getDisplayValue();
      expect(result, 'BUG-006: sqrt of negative should show Error, not NaN').toBe('Error');
    } else {
      // Document BUG-001 is blocking this path
      expect(intermediate, 'BUG-001 blocking BUG-006 test: subtract button broken').toBe('-1');
    }
  });

  test('sqrt on empty display shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.sqrtBtn.click();
    await calc.expectDisplay('Error');
  });
});

// ---------------------------------------------------------------------------
// log
// ---------------------------------------------------------------------------
test.describe('log (base-10) function', () => {
  test('log(1) = 0', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('1');
    await calc.logBtn.click();
    await calc.expectDisplayApprox(0, 1e-9);
  });

  test('log(10) = 1', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.digit1.click();
    await calc.digit0.click();
    await calc.logBtn.click();
    await calc.expectDisplayApprox(1, 1e-9);
  });

  test('log(100) = 2', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.digit1.click();
    await calc.digit0.click();
    await calc.digit0.click();
    await calc.logBtn.click();
    await calc.expectDisplayApprox(2, 1e-9);
  });

  test('log(2) ≈ 0.3010 (irrational)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('2');
    await calc.logBtn.click();
    await calc.expectDisplayApprox(Math.log10(2), 1e-6);
  });

  test('BUG-007 — log(0) should display Error, not -Infinity', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('0');
    await calc.logBtn.click();
    const val = await calc.getDisplayValue();
    expect(val, 'BUG-007: log(0) should show Error, not -Infinity').toBe('Error');
  });

  test('log on empty display shows Error', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.logBtn.click();
    await calc.expectDisplay('Error');
  });
});

// ---------------------------------------------------------------------------
// Radian vs Degree awareness (BUG-005 documentation)
// ---------------------------------------------------------------------------
test.describe('BUG-005 — trig functions use radians with no mode indicator', () => {
  test('sin(90) returns ~0.894 in radians (not 1.0 as in degrees)', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await calc.goto();
    await calc.typeExpression('9');
    await calc.digit0.click();
    // BUG-004 means sin will return 1 regardless; this test still documents intent
    await calc.sinBtn.click();
    const val = parseFloat(await calc.getDisplayValue());
    // In degrees sin(90)=1; in radians sin(90)≈0.894; expected is radians per implementation
    // The test will fail on BUG-004 first; if sin is fixed this documents radian behaviour
    expect(val).not.toBeNaN();
    expect(Math.abs(val - 1.0)).toBeGreaterThan(0.05); // not the degree result
  });
});
