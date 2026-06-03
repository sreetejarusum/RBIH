# RBI Scientific Calculator — QA Test Suite

End-to-end automated test suite for the [RBI Scientific Calculator](https://rbihubcodechallenge.github.io/calculator/index.html), built with **Playwright** and **TypeScript**.

> **Release verdict: ❌ DO NOT SHIP** — 4 critical bugs make core arithmetic incorrect or unreachable. See [BUGS.md](./BUGS.md) for full details.

---

## Architecture

```
calculator-qa/
├── helpers/
│   └── CalculatorPage.ts      # Page Object Model — all locators & interactions
├── tests/
│   ├── arithmetic.spec.ts     # Addition, subtraction, multiplication, division
│   ├── scientific.spec.ts     # sin, cos, tan, sqrt, log
│   ├── edge-cases.spec.ts     # Error handling, boundaries, malformed input
│   └── ui-layout.spec.ts      # Button inventory, grid layout, keyboard support
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions — matrix across Chromium/Firefox/WebKit
├── playwright.config.ts       # Browser projects, reporters, timeouts
├── BUGS.md                    # Full bug report with reproduction steps
└── package.json
```

### Design Decisions

| Decision | Rationale |
|---|---|
| **Page Object Model** | Centralises all locators in `CalculatorPage.ts`; tests stay readable and don't break when IDs change |
| **`exact: true` on ambiguous locators** | Playwright's `getByRole` does case-insensitive substring matching by default — `'C'` would otherwise match `'cos'` |
| **Bug regression tests inline** | Each known bug has a dedicated test named `BUG-00X —` so failures are self-describing in CI reports |
| **`expectDisplayApprox()`** | Floating-point results from trig/sqrt need tolerance; avoids brittle string comparisons |
| **`fail-fast: false` in CI** | All three browsers always report results even if one browser fails early |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

## Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd calculator-qa

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
```

---

## Running Tests

### Run all tests (all browsers)
```bash
npm test
```

### Run on a single browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run a specific test file
```bash
npx playwright test tests/arithmetic.spec.ts
npx playwright test tests/scientific.spec.ts
npx playwright test tests/edge-cases.spec.ts
npx playwright test tests/ui-layout.spec.ts
```

### Run tests matching a keyword
```bash
npx playwright test --grep "BUG-003"
npx playwright test --grep "Division"
```

### Run with browser UI visible (headed mode)
```bash
npm run test:headed
```

### View the HTML report after a run
```bash
npm run test:report
```

> **Important:** Always run commands from inside the `calculator-qa/` directory. Running from a parent directory will cause a version conflict error because Playwright won't find `playwright.config.ts`.

---

## CI

Tests run automatically on every push and pull request via GitHub Actions (`.github/workflows/ci.yml`).

- **Matrix:** Chromium, Firefox, WebKit run in parallel
- **Artefacts:** HTML report and JSON results uploaded for 14 days
- **Retries:** 1 retry per failed test in CI to reduce flake noise

---

## Test Results (Chromium baseline)

| Result | Count |
|---|---|
| ✅ Passed | 71 |
| ❌ Failed | 35 |
| **Total** | **106** |

All 35 failures are **intentional regressions** that directly map to documented bugs — not test defects.

---

## Bug Summary

| ID | Severity | Summary |
|---|---|---|
| BUG-001 | 🔴 Critical | `−` button appends `/` instead of `-` |
| BUG-002 | 🔴 Critical | Button labeled `3` appends digit `0` |
| BUG-003 | 🔴 Critical | Division operands reversed (`6÷2` = `0.333`) |
| BUG-004 | 🔴 Critical | `sin` always returns `1` (hardcoded) |
| BUG-005 | 🟠 High | Trig functions use radians with no mode indicator |
| BUG-006 | 🟠 High | `√(negative)` shows `NaN` instead of `Error` |
| BUG-007 | 🟠 High | `log(0)` shows `-Infinity` instead of `Error` |
| BUG-008 | 🟡 Medium | `n÷0` shows `Infinity` instead of `Error` |
| BUG-009 | 🟡 Medium | `log` button orphaned in its own grid row |
| BUG-010 | 🔵 Low | No keyboard input support |

Full reproduction steps, root causes, and fixes: [BUGS.md](./BUGS.md)



# Test Strategy — Scientific Calculator

**Author:** QA Lead **Status:** Release-gate review **Build under test:** `https://rbihubcodechallenge.github.io/calculator/index.html`

---

## 1. Purpose and the real risk

A calculator looks trivial, which is exactly why it is dangerous to ship on trust. The user-facing risk is **silent incorrectness**: a wrong answer looks identical to a right one, there is no error state to alert anyone, and the user has no way to know they were misled. So the quality bar is not "does it add" — it is "does it produce the *mathematically correct* result across every operation, refuse invalid input safely, and present results in a form a human can use." Coverage is therefore organised around correctness, error safety, and presentation, in that priority order.

## 2. Scope

Derived from the actual control set on the build, not a generic calculator spec.

**In scope (the only controls present):**
`0–9`, `.`, `( )`, `+ − × ÷`, `=`, `C`, and the functions `sin cos tan √ log`.

This means: basic arithmetic, operator precedence, parentheses/nesting, decimals, the five functions above, clear, evaluate, and all error/edge behaviour around them.

**Out of scope (controls the build does not expose):** inverse trig, `ln`, powers/exponent, `π`/`e` constants, factorial, percentage, reciprocal, memory (M+/M−/MR/MC), `+/−` sign toggle, backspace, and angle-mode toggle. These are flagged in §8 as **product gaps**, not test gaps — there is nothing to test, but their absence is a finding worth raising before release.

## 3. Behavioural contract — confirm before sign-off

Three behaviours are unspecified and cannot be assumed; each is a different defect depending on intent. The suite **asserts a declared spec** (`{ angleMode: 'deg', logBase: 10 }`, the conventional calculator-UX default) and any deviation surfaces as a failing test that *is* the finding. Flip the flags in `src/oracle/oracle.ts` if the product spec differs.

| # | Question | Conventional expectation | Likely implementation risk |
|---|----------|--------------------------|----------------------------|
| C1 | Do `sin/cos/tan` use **degrees or radians**? | Degrees for a consumer calculator | JS `Math.*` is radians — `sin(90)` returning `0.894` instead of `1` |
| C2 | Is `log` **base-10 or natural**? | Base-10 (a separate `ln` is conventional) | JS `Math.log` is natural — `log(100)` returning `4.6` instead of `2` |
| C3 | How do function keys build the expression — does pressing `sin` insert `sin(` or just `sin`? | `fn( ... )` canonical form | Affects whether `sin90`, `sin(90)`, or `sin 90` is even parseable |

## 4. Approach and test-design techniques

Risk-based and technique-driven rather than ad hoc, so coverage is *arguable*, not just large:

- **Equivalence Partitioning** — one representative per class (positive/negative/zero/decimal operands; perfect vs irrational roots).
- **Boundary Value Analysis** — `sin(0/90)`, `log(1)`, `√0`, `tan(90)` asymptote, large-magnitude operands, single/double-digit transitions.
- **Decision tables** — precedence and parentheses combinations (`2+3×4` vs `(2+3)×4`), functions embedded in arithmetic.
- **State-based testing** — chained operations, behaviour after `=`, `C` reset, repeated `=`.
- **Error guessing** — division by zero, √ and log of negatives, unbalanced parens, consecutive operators, double decimal, empty/leading/trailing operators.
- **Exploratory (timeboxed, 60 min)** — rapid input, long expressions, copy/paste, keyboard entry, focus loss; logged as a charter with findings.

## 5. The oracle strategy (how we know the right answer)

The hard problem in calculator testing is the **oracle**: you cannot hand-verify thousands of trig/log results. We derive expected values from a **trusted reference implementation** under the declared spec (`src/oracle/oracle.ts`; JS `Math` today, swappable for `mpmath`/`decimal` for arbitrary precision), compare with explicit **tolerance** (`1e-9`) for floating-point operations, and require **exact** matches for integer arithmetic. This is what makes the suite scale: `scripts/generate-expected.ts` sweeps an input range and emits oracle-backed cases with zero manual computation.

## 6. Coverage map

| Area | Technique focus | Data file | Priority |
|------|-----------------|-----------|----------|
| Basic arithmetic (+ − × ÷) | EP, BVA | `arithmetic.json` | P0 |
| Precedence & parentheses | Decision table | `arithmetic.json` | P0 |
| Decimals & sign | EP, BVA | `arithmetic.json` | P0/P1 |
| Trig (sin/cos/tan) | EP, BVA | `functions.json` | P0/P1 |
| Roots & logs (√, log) | EP, BVA | `functions.json` | P0/P1 |
| Functions in expressions | Decision table | `functions.json` | P1/P2 |
| Error handling | Error guessing, BVA | `edge-cases.json` | P0/P1 |
| Display & state | State, exploratory | `ui-behavior.spec.ts` | P0–P2 |
| Cross-browser/responsive | Config matrix | `playwright.config.ts` | P1 |

## 7. Environment and compatibility matrix

Automated across Chromium, Firefox, WebKit, and a mobile viewport (Pixel 7) via Playwright projects. Floating-point and rendering differ across JS engines, so cross-engine runs are part of correctness, not just layout.

## 8. Risks, assumptions, and product gaps

- **Behavioural contract (C1–C3)** unconfirmed — see §3. Highest-priority clarification.
- **Display selector** is the one DOM coupling; pinned in `CalculatorPage.display` and confirmed on first run.
- **No error surface observed in markup** — if the build uses raw `eval`, invalid input may render `NaN`/`Infinity`/a thrown string to the user (ED-01..ED-11 target this).
- **Product gaps** (no backspace, no angle-mode toggle, ambiguous `log` label): usability/correctness risks worth raising even though untestable.

## 9. Entry / exit criteria and release recommendation

**Entry:** build deployed and reachable; behavioural contract C1–C3 answered. **Exit (recommended gate):** 100% P0 pass, ≥95% P1 pass with no open P0/P1 defect, edge-case suite green (safe error handling), cross-browser green. **Default stance:** do **not** approve release until C1–C3 are confirmed and the edge-case suite passes — a calculator that silently returns radians or `NaN` to users is a P0 correctness failure regardless of how polished the UI is.

## 10. Reporting

HTML + JUnit reports per run (CI artifact), defects logged with the template in `defect-report.md` (severity/priority, exact key sequence to reproduce, expected vs actual, spec reference C1–C3 where relevant).





# Test Case Catalogue — Scientific Calculator

Every functional case is also machine-readable in `tests/data/*.json` (one row = one automated test). This catalogue is the human view for review and traceability. Priorities: **P0** release-blocking, **P1** important, **P2** nice-to-have. Technique key: EP (equivalence), BVA (boundary), DT (decision table), ST (state), EG (error guessing).

## A. Basic arithmetic — `arithmetic.json`

| ID | Title | Tech | Pri | Input (keys) | Expected |
|----|-------|------|-----|--------------|----------|
| AR-01 | Addition | EP | P0 | `7 + 8 =` | 15 |
| AR-02 | Subtraction | EP | P0 | `9 − 4 =` | 5 |
| AR-03 | Multiplication | EP | P0 | `6 × 7 =` | 42 |
| AR-04 | Division (exact) | EP | P0 | `8 ÷ 2 =` | 4 |
| AR-05 | Division (fractional) | EP | P1 | `9 ÷ 4 =` | 2.25 |
| AR-06 | Precedence × before + | DT | P0 | `2 + 3 × 4 =` | 14 |
| AR-07 | Parentheses override | DT | P0 | `( 2 + 3 ) × 4 =` | 20 |
| AR-08 | Nested parentheses | DT | P1 | `( ( 1 + 2 ) × 3 ) =` | 9 |
| AR-09 | Decimal addition | EP | P0 | `1 . 5 + 2 . 5 =` | 4 |
| AR-10 | Decimal multiplication | EP | P1 | `0 . 5 × 0 . 5 =` | 0.25 |
| AR-11 | Chained additions | ST | P1 | `1 + 2 + 3 + 4 =` | 10 |
| AR-12 | Negative result | EP | P1 | `3 − 8 =` | −5 |
| AR-13 | Leading unary minus | EG | P2 | `− 5 + 8 =` | 3 |
| AR-14 | Multiply by zero | BVA | P1 | `1 2 3 × 0 =` | 0 |
| AR-15 | Large multiplication | BVA | P2 | `999999 × 999999 =` | 999998000001 |

## B. Scientific functions — `functions.json` (spec: degrees, log base-10)

| ID | Title | Tech | Pri | Input (keys) | Expected (±1e-9) |
|----|-------|------|-----|--------------|------------------|
| FN-01 | sin(30°) | EP | P0 | `sin ( 3 0 ) =` | 0.5 |
| FN-02 | sin(90°) boundary | BVA | P0 | `sin ( 9 0 ) =` | 1 |
| FN-03 | sin(0°) | BVA | P1 | `sin ( 0 ) =` | 0 |
| FN-04 | cos(0°) | BVA | P0 | `cos ( 0 ) =` | 1 |
| FN-05 | cos(60°) | EP | P1 | `cos ( 6 0 ) =` | 0.5 |
| FN-06 | cos(90°)→0 | BVA | P1 | `cos ( 9 0 ) =` | 0 |
| FN-07 | tan(45°) | EP | P1 | `tan ( 4 5 ) =` | 1 |
| FN-08 | tan(0°) | BVA | P1 | `tan ( 0 ) =` | 0 |
| FN-09 | √9 | EP | P0 | `√ ( 9 ) =` | 3 |
| FN-10 | √16 | EP | P1 | `√ ( 1 6 ) =` | 4 |
| FN-11 | √2 irrational | EP | P1 | `√ ( 2 ) =` | 1.41421356… |
| FN-12 | √0 boundary | BVA | P1 | `√ ( 0 ) =` | 0 |
| FN-13 | log(100) | EP | P0 | `log ( 1 0 0 ) =` | 2 |
| FN-14 | log(1000) | EP | P1 | `log ( 1 0 0 0 ) =` | 3 |
| FN-15 | log(1)→0 | BVA | P1 | `log ( 1 ) =` | 0 |
| FN-16 | log(10)→1 | BVA | P1 | `log ( 1 0 ) =` | 1 |
| FN-17 | √9 + 1 | DT | P1 | `√ ( 9 ) + 1 =` | 4 |
| FN-18 | 2 × √9 | DT | P2 | `2 × √ ( 9 ) =` | 6 |

## C. Edge cases & error handling — `edge-cases.json`

Expected outcome is a **safe non-numeric/error state**, never a misleading finite number.

| ID | Title | Tech | Pri | Input (keys) | Expected behaviour |
|----|-------|------|-----|--------------|--------------------|
| ED-01 | Divide by zero | EG | P0 | `5 ÷ 0 =` | Error or Infinity |
| ED-02 | √ of negative | EG | P0 | `√ ( − 4 ) =` | Error or NaN |
| ED-03 | log(0) | BVA | P1 | `log ( 0 ) =` | Error or −Infinity |
| ED-04 | log(negative) | EG | P1 | `log ( − 5 ) =` | Error or NaN |
| ED-05 | tan(90°) asymptote | BVA | P1 | `tan ( 9 0 ) =` | Error / very large |
| ED-06 | Unbalanced paren | EG | P0 | `( 2 + 3 =` | Error, no crash |
| ED-07 | Consecutive operators | EG | P1 | `5 + + 3 =` | Error / rejected |
| ED-08 | Double decimal | EG | P1 | `1 . 2 . 3 =` | Error / 2nd `.` rejected |
| ED-09 | Equals, no input | EG | P2 | `=` | No-op or 0 |
| ED-10 | Leading operator | EG | P2 | `× 5 =` | Error / rejected |
| ED-11 | Trailing operator | EG | P1 | `5 + =` | Error / incomplete |

## D. UI, display & state — `ui-behavior.spec.ts`

| ID | Title | Tech | Pri | Notes |
|----|-------|------|-----|-------|
| UI-01 | All controls present | ST | P0 | Smoke: every documented button renders |
| UI-02 | `C` clears display | ST | P0 | Display returns to empty/0 |
| UI-03 | Clean display formatting | ST | P1 | `0.1+0.2` must not show IEEE-754 tail |
| UI-04 | Numeric correctness behind display | EP | P1 | `0.1+0.2 ≈ 0.3` within tolerance |
| UI-05 | Fresh calc after `=` | ST | P2 | New digits start a new expression |

## E. Exploratory charters (timeboxed, logged separately)

1. Rapid/again input — mash digits and operators; watch for dropped/duplicated input.
2. Very long expression — does the display overflow, truncate, or wrap?
3. Keyboard parity — do physical keys mirror on-screen buttons?
4. Accessibility pass — focus order, button names, contrast (WCAG smoke).
