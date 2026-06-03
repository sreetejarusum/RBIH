import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the RBI Scientific Calculator.
 * URL: https://rbihubcodechallenge.github.io/calculator/index.html
 *
 * Button inventory (from source HTML):
 *   Row 1 : C  (  )  ÷
 *   Row 2 : 7  8  9  ×
 *   Row 3 : 4  5  6  −   ← BUG-001: onclick appends '/' not '-'
 *   Row 4 : 1  2  3  +   ← BUG-002: button labeled '3' appends '0'
 *   Row 5 : 0  .  =       ← only 3 buttons; 4th column empty
 *   Sci   : sin cos tan √ log
 */
export class CalculatorPage {
  readonly page: Page;
  readonly display: Locator;

  // Control
  readonly clearBtn: Locator;
  readonly equalsBtn: Locator;

  // Parentheses
  readonly openParenBtn: Locator;
  readonly closeParenBtn: Locator;

  // Digits — located by visible text to catch label/value mismatches
  readonly digit0: Locator;
  readonly digit1: Locator;
  readonly digit2: Locator;
  readonly digit3: Locator; // BUG-002: label says 3 but appends 0
  readonly digit4: Locator;
  readonly digit5: Locator;
  readonly digit6: Locator;
  readonly digit7: Locator;
  readonly digit8: Locator;
  readonly digit9: Locator;
  readonly decimalBtn: Locator;

  // Operators
  readonly divideBtn: Locator;
  readonly multiplyBtn: Locator;
  readonly subtractBtn: Locator; // BUG-001: appends '/' not '-'
  readonly addBtn: Locator;

  // Scientific functions
  readonly sinBtn: Locator;
  readonly cosBtn: Locator;
  readonly tanBtn: Locator;
  readonly sqrtBtn: Locator;
  readonly logBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.display = page.locator('#display');

    this.clearBtn = page.getByRole('button', { name: 'C', exact: true });
    this.equalsBtn = page.getByRole('button', { name: '=' });
    this.openParenBtn = page.getByRole('button', { name: '(' });
    this.closeParenBtn = page.getByRole('button', { name: ')' });

    // Use nth() for digits that might share text with operators in other elements
    this.digit0 = page.getByRole('button', { name: '0' }).first();
    this.digit1 = page.getByRole('button', { name: '1' });
    this.digit2 = page.getByRole('button', { name: '2' });
    this.digit3 = page.getByRole('button', { name: '3' });
    this.digit4 = page.getByRole('button', { name: '4' });
    this.digit5 = page.getByRole('button', { name: '5' });
    this.digit6 = page.getByRole('button', { name: '6' });
    this.digit7 = page.getByRole('button', { name: '7' });
    this.digit8 = page.getByRole('button', { name: '8' });
    this.digit9 = page.getByRole('button', { name: '9' });
    this.decimalBtn = page.getByRole('button', { name: '.' });

    this.divideBtn = page.getByRole('button', { name: '÷' });
    this.multiplyBtn = page.getByRole('button', { name: '×' });
    this.subtractBtn = page.getByRole('button', { name: '−' });
    this.addBtn = page.getByRole('button', { name: '+' });

    this.sinBtn = page.getByRole('button', { name: 'sin' });
    this.cosBtn = page.getByRole('button', { name: 'cos' });
    this.tanBtn = page.getByRole('button', { name: 'tan' });
    this.sqrtBtn = page.getByRole('button', { name: '√' });
    this.logBtn = page.getByRole('button', { name: 'log' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/calculator/index.html');
  }

  async getDisplayValue(): Promise<string> {
    return this.display.inputValue();
  }

  async clear(): Promise<void> {
    await this.clearBtn.click();
  }

  async calculate(): Promise<void> {
    await this.equalsBtn.click();
  }

  /**
   * Type a sequence of digit/operator clicks to build an expression.
   * Accepts the visual labels seen on buttons (e.g. '÷', '×', '−', '+').
   */
  async typeExpression(expression: string): Promise<void> {
    for (const char of expression) {
      await this.clickChar(char);
    }
  }

  private async clickChar(char: string): Promise<void> {
    const map: Record<string, Locator> = {
      '0': this.digit0,
      '1': this.digit1,
      '2': this.digit2,
      '3': this.digit3,
      '4': this.digit4,
      '5': this.digit5,
      '6': this.digit6,
      '7': this.digit7,
      '8': this.digit8,
      '9': this.digit9,
      '.': this.decimalBtn,
      '÷': this.divideBtn,
      '×': this.multiplyBtn,
      '−': this.subtractBtn,
      '+': this.addBtn,
      '(': this.openParenBtn,
      ')': this.closeParenBtn,
    };
    if (map[char]) {
      await map[char].click();
    } else {
      throw new Error(`No button mapped for character: '${char}'`);
    }
  }

  /** Click a digit button by its visible label and return whatever the display shows. */
  async clickDigitAndRead(label: string): Promise<string> {
    await this.page.getByRole('button', { name: label, exact: true }).click();
    return this.getDisplayValue();
  }

  /**
   * Enter a number via individual digit clicks (using CORRECT button labels)
   * then apply a scientific function and return the result.
   */
  async applyScientificFunction(
    numberStr: string,
    fn: 'sin' | 'cos' | 'tan' | 'sqrt' | 'log',
  ): Promise<string> {
    await this.clear();
    await this.typeExpression(numberStr);
    const fnBtn = {
      sin: this.sinBtn,
      cos: this.cosBtn,
      tan: this.tanBtn,
      sqrt: this.sqrtBtn,
      log: this.logBtn,
    }[fn];
    await fnBtn.click();
    return this.getDisplayValue();
  }

  async expectDisplay(value: string): Promise<void> {
    await expect(this.display).toHaveValue(value);
  }

  async expectDisplayContains(partial: string): Promise<void> {
    const val = await this.getDisplayValue();
    expect(val).toContain(partial);
  }

  async expectDisplayApprox(expected: number, tolerance = 1e-9): Promise<void> {
    const raw = await this.getDisplayValue();
    const actual = parseFloat(raw);
    expect(actual).not.toBeNaN();
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
  }
}
