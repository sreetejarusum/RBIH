# Bug Report — RBI Scientific Calculator
**Tester:** QA Lead  
**App:** https://rbihubcodechallenge.github.io/calculator/index.html  
**Date:** 2026-06-03  
**Status:** Pending Release Approval — **BLOCKED**

---

## Executive Summary

The scientific calculator has **4 critical defects** that make core functions either wrong or completely unreachable. The subtraction operator is silently broken (appends division), the digit `3` is unreachable from the keypad, division computes results in the wrong direction, and the `sin` function always returns `1`. Combined, these defects render the calculator unsuitable for release.

---

## Bug Index

| ID | Severity | Area | Summary |
|---|---|---|---|
| [BUG-001](#bug-001) | 🔴 Critical | Operator | `−` button appends `/` instead of `-` |
| [BUG-002](#bug-002) | 🔴 Critical | Input | Button labeled `3` appends digit `0` |
| [BUG-003](#bug-003) | 🔴 Critical | Evaluator | Division operands reversed (`a÷b` evaluates as `b÷a`) |
| [BUG-004](#bug-004) | 🔴 Critical | Scientific | `sin` always returns `1` |
| [BUG-005](#bug-005) | 🟠 High | Scientific | Trig functions use radians with no mode indicator |
| [BUG-006](#bug-006) | 🟠 High | Scientific | `√(negative)` shows `NaN` instead of `Error` |
| [BUG-007](#bug-007) | 🟠 High | Scientific | `log(0)` shows `-Infinity`, `log(negative)` shows `NaN` |
| [BUG-008](#bug-008) | 🟡 Medium | Evaluator | `n÷0` shows `Infinity`/`NaN` instead of `Error` |
| [BUG-009](#bug-009) | 🟡 Medium | Layout | `log` button orphaned in its own row |
| [BUG-010](#bug-010) | 🔵 Low | Accessibility | No keyboard input support |

---

## Detailed Findings

---

### BUG-001
**Severity:** 🔴 Critical  
**Area:** Operator Buttons  
**Title:** Subtract button (`−`) silently appends a division operator

**Description**  
Clicking the `−` (subtract) button appends the `/` character to the display expression instead of `-`. As a result, subtraction is entirely non-functional. There is no other way to enter a minus sign, so negative-number arithmetic and all subtraction expressions are unreachable.

**Root Cause**  
HTML source, row 3:
```html
<!-- BUG: onclick should be append('-'), not append('/') -->
<button onclick="append('/')">−</button>
```

**Steps to Reproduce**
1. Open the calculator.
2. Press `5`.
3. Press `−`.
4. Observe the display.

**Expected:** Display shows `5-`  
**Actual:** Display shows `5/` (division operator appended)

**Impact:** 100% of subtraction expressions produce incorrect results.  
**Recommended Fix:** Change `onclick="append('/')"` to `onclick="append('-')"` on the `−` button.

---

### BUG-002
**Severity:** 🔴 Critical  
**Area:** Digit Input  
**Title:** Button labeled `3` appends `0` — digit `3` is unreachable

**Description**  
The button with the label `3` calls `append('0')` instead of `append('3')`. Pressing it enters a `0` on the display. No button exists that appends the digit `3`, making it permanently unavailable for any calculation.

**Root Cause**  
HTML source, row 4:
```html
<!-- BUG: onclick should be append('3'), not append('0') -->
<button onclick="append('0')">3</button>
```

**Steps to Reproduce**
1. Open the calculator.
2. Press `C` to clear.
3. Press the `3` button.
4. Observe the display.

**Expected:** Display shows `3`  
**Actual:** Display shows `0`

**Impact:** Any calculation requiring the digit `3` (or containing `3`, `30`-`39`, `300`+, etc.) produces a wrong result silently. Users have no way to enter `3`.  
**Recommended Fix:** Change `onclick="append('0')"` to `onclick="append('3')"` on the button labeled `3`.

---

### BUG-003
**Severity:** 🔴 Critical  
**Area:** Expression Evaluator  
**Title:** Division operand order reversed in the expression parser

**Description**  
The expression evaluator's multiplication/division handler stores the left operand first, reads the right operand next, then computes `right ÷ left` instead of `left ÷ right`. Every division expression returns the reciprocal of the correct answer.

**Root Cause**  
Obfuscated JS, decoded `_0x8329bc` function (handles `*` and `/`):
```js
// Operands: _0x831edg = left, _0x692a = right
if (op === '/') _0x831edg = _0x692a / _0x831edg;
//                          ^^^^^^^^^^^^^^^^^^^^^ reversed
// Correct:     _0x831edg = _0x831edg / _0x692a;
```

**Steps to Reproduce**
1. Open the calculator.
2. Press `6`, `÷`, `2`, `=`.
3. Observe the display.

**Expected:** `3`  
**Actual:** `0.3333333333333333`

**Additional examples:**
| Input | Expected | Actual |
|---|---|---|
| 10 ÷ 2 | 5 | 0.2 |
| 1 ÷ 4 | 0.25 | 4 |
| 9 ÷ 3 | 3 | 0.333… |

**Recommended Fix:** Swap operands in the division branch: `result = left / right`.

---

### BUG-004
**Severity:** 🔴 Critical  
**Area:** Scientific Functions  
**Title:** `sin` always returns `1` regardless of input

**Description**  
The `sin` function unconditionally sets the display to `1`. It never calls `Math.sin()`. Every `sin` computation returns `1`.

**Root Cause**  
Obfuscated JS, `func()` function, `sin` branch:
```js
if (type === "sin")
  display.value = 434563 ^ 434562;  // XOR = 1, always
// Should be:
  display.value = Math.sin(parseFloat(display.value));
```

**Steps to Reproduce**
1. Open the calculator.
2. Press `0`, then `sin`.
3. Observe the display. (`sin(0)` should be `0`)

**Expected:** `0`  
**Actual:** `1`

**Additional examples:**
| Input | Expected | Actual |
|---|---|---|
| 0 | 0 | 1 |
| 1 | ~0.8415 | 1 |
| 3.14159 | ~0 | 1 |

**Recommended Fix:** Replace `434563 ^ 434562` with `Math.sin(_0xc2af5d)`.

---

### BUG-005
**Severity:** 🟠 High  
**Area:** Scientific Functions / UX  
**Title:** Trigonometric functions operate in radians with no mode indicator

**Description**  
`sin`, `cos`, and `tan` pass the raw display value directly to `Math.sin/cos/tan`, which expects radians. Most users of a scientific calculator expect to enter angles in degrees. There is no rad/deg toggle, no label, and no documentation on the screen. A user typing `sin(90)` expecting `1.0` (degrees) gets `0.894` (radians) with no indication that their input convention is wrong.

**Steps to Reproduce**
1. Press `9`, `0`, then `sin`.

**Expected (degrees UX):** `1`  
**Actual:** `0.8939966636005579`

**Recommended Fix:** Add a DEG/RAD toggle button and convert degree input to radians before passing to `Math.sin/cos/tan` when in degree mode. Default to degree mode for general-audience calculators.

---

### BUG-006
**Severity:** 🟠 High  
**Area:** Scientific Functions  
**Title:** Square root of a negative number displays `NaN` instead of `Error`

**Description**  
`Math.sqrt(-1)` returns `NaN`. The `func()` handler does not validate the input range before calling `Math.sqrt`, so the raw `NaN` is displayed to the user. This is inconsistent with how the `calculate()` function handles other exceptions (it shows `Error`).

**Steps to Reproduce**  
*(Requires BUG-001 to be fixed first to enter a negative number)*
1. Enter `-1` via any valid method.
2. Press `√`.

**Expected:** `Error`  
**Actual:** `NaN`

**Recommended Fix:** Before calling `Math.sqrt`, check `if (value < 0) { display.value = 'Error'; return; }`.

---

### BUG-007
**Severity:** 🟠 High  
**Area:** Scientific Functions  
**Title:** `log(0)` displays `-Infinity` and `log(negative)` displays `NaN`

**Description**  
`Math.log10(0)` returns `-Infinity` and `Math.log10(-n)` returns `NaN`. Neither is caught by the `func()` handler. The raw JavaScript special values leak directly into the display, diverging from the `Error` convention used elsewhere.

**Steps to Reproduce**
1. Press `0`, then `log`.

**Expected:** `Error`  
**Actual:** `-Infinity`

**Recommended Fix:** Add domain validation before calling `Math.log10`: `if (value <= 0) { display.value = 'Error'; return; }`.

---

### BUG-008
**Severity:** 🟡 Medium  
**Area:** Expression Evaluator  
**Title:** Division by zero displays `Infinity` or `NaN` instead of `Error`

**Description**  
When the evaluated expression divides by zero, JavaScript produces `Infinity` (or `NaN` for `0÷0`), which the evaluator returns and writes directly to the display. The `calculate()` function's `try/catch` only handles thrown exceptions, not special float values.

**Steps to Reproduce**
1. Press `1`, `÷`, `0`, `=`.

**Expected:** `Error`  
**Actual:** `Infinity`

**Recommended Fix:** After evaluating, check `if (!isFinite(result) || isNaN(result)) { display.value = 'Error'; }`.

---

### BUG-009
**Severity:** 🟡 Medium  
**Area:** UI / Layout  
**Title:** `log` button is visually isolated in its own grid row

**Description**  
The scientific function row contains 5 buttons (`sin`, `cos`, `tan`, `√`, `log`) but the grid has only 4 columns. The fifth button (`log`) wraps to a new row and appears alone in the bottom-left corner, visually disconnected from the other scientific functions. This harms discoverability and makes the calculator feel unfinished.

**Root Cause**  
CSS grid is `repeat(4, 70px)` but 5 buttons share the scientific section.

**Steps to Reproduce**
1. Open the calculator and observe the bottom row.

**Expected:** All 5 scientific buttons in a coherent row or two.  
**Actual:** `log` is isolated below `sin cos tan √`.

**Recommended Fix:** Either expand the grid to 5 columns for scientific rows (using `grid-column: span N`), or move one scientific function to the empty slot in the `=` row.

---

### BUG-010
**Severity:** 🔵 Low  
**Area:** Accessibility / UX  
**Title:** Calculator does not respond to keyboard input

**Description**  
Typing digits, operators, or pressing `Enter`/`Escape` on the physical keyboard has no effect. All interaction requires mouse clicks. This is a usability regression for power users and may constitute an accessibility issue under WCAG 2.1 criterion 2.1.1 (Keyboard).

**Recommended Fix:** Add a `keydown` event listener that maps keyboard keys to their corresponding button actions, and supports `Enter` for `=` and `Escape`/`Delete` for `C`.

---

## Summary & Release Recommendation

**Release decision: ❌ DO NOT SHIP**

Four critical bugs make the calculator produce wrong answers (BUG-003), silently prevent core operations (BUG-001, BUG-002), and hardcode a function to always return an incorrect value (BUG-004). A user performing any subtraction, any calculation involving digit `3`, any division, or any `sin` call will receive wrong results. There is no workaround available to end users.

**Minimum criteria for release:**
- [ ] Fix BUG-001 (subtract operator)
- [ ] Fix BUG-002 (digit 3 button)
- [ ] Fix BUG-003 (division operand order)
- [ ] Fix BUG-004 (sin always returns 1)
- [ ] Verify BUG-006, BUG-007, BUG-008 (NaN/Infinity → Error)

**Nice-to-have before release:**
- [ ] BUG-005: Add RAD/DEG mode toggle
- [ ] BUG-009: Fix scientific button grid overflow
- [ ] BUG-010: Add keyboard support
