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
