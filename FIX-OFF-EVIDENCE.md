# Fix-Off Evidence

This document records turn-off experiments: deliberate violations that must fail specific tests.

## Experiment Results

### E1: Banner truncated to 20 characters
**Change:** Truncate safety banners to 20 chars in pdf.ts
**Expected:** Banner test should fail
**Command:** `npm test -- banner`
**Status:** PENDING - Need banner truncation test

### E2: Only first banner printed
**Change:** Print only first safety banner in pdf.ts
**Expected:** Banner test should fail  
**Command:** `npm test -- banner`
**Status:** PENDING - Need multiple banners test

### E3: Label font size reduced to 10pt
**Change:** Set RIP FENCE label font to 10pt in stepFigures.ts
**Expected:** Minimum font size test should fail
**Command:** `npm test -- "minimum font"`
**Result:** ✅ FAILS as expected (svg.test "should enforce minimum font size")

### E4: Label positioned on blade
**Change:** Place RIP FENCE label at x=200 (on blade) in stepFigures.ts
**Expected:** Label collision test should fail
**Command:** `npm test -- collision`
**Status:** PENDING - Need blade collision test

### E5: Dimension label scaled to 0.5
**Change:** Add scale(0.5) to dimension label in svg.ts
**Expected:** Scale test should fail
**Command:** `npm test -- scale`
**Status:** PENDING - Need CTM scale test

### E6: Remove 11-unit font minimum
**Change:** Remove MIN_FONT check in svg.ts
**Expected:** Font minimum test fails
**Command:** `npm test -- "minimum font"`
**Result:** ✅ FAILS as expected (2 tests fail)

### E7: PDF figures scaled to 0.1
**Change:** Set figure scale=0.1 in pdf.ts addFigure
**Expected:** PDF size test should fail
**Command:** `npm test -- "pdf.*size|pdf.*scale"`
**Status:** PENDING - Need PDF min size test

### E8: Footer reduced to 5pt
**Change:** Set footer font to 5pt in pdf.ts
**Expected:** Minimum text size test fails
**Command:** `npm test -- "minimum.*text|footer"`
**Status:** PENDING - Need footer size test

### N1: Blank rule disabled
**Change:** Set blankRule.millWholeBlanksFirst = false in catalog
**Expected:** Cut list safety tests fail
**Command:** `npm test -- cutListSafety`
**Result:** ✅ FAILS - 2 tests fail:
```
FAIL src/lib/cutListSafety.test.ts > Cut List Safety > should never generate cut list items under 305mm length
AssertionError: expected 204 to be +0
```
**Restore:** `git checkout -- styles/*.json`

### N2: Missing SVG check removed
**Change:** Remove REQUIRE_EXTERNAL_FIGURES enforcement in pdf.ts
**Test:** External figures test
**Result:** Test exists, enforcement verified in externalFigures.test.ts
**Note:** Removal would allow fallback to inline figures when external missing

### N3: Duplicate stepId in catalog
**Change:** Duplicate a stepId in checkerboard.json
**Expected:** Unique stepId tests fail
**Command:** `npm test -- stepId`
**Result:** ✅ FAILS - 2 tests fail:
```
FAIL src/lib/stepId.test.ts > StepId validation > unique stepIds within the style
AssertionError: expected 1 to be +0
```
**Restore:** `git checkout -- styles/checkerboard.json`

### N4: Width rules disabled
**Change:** Remove planerMaxWidth and jointerMaxWidth from catalog
**Expected:** Width safety test fails
**Command:** `npm test -- cutListWidth`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/cutListWidthSafety.test.ts > should never generate over 152mm wide for jointer
AssertionError: expected 2 to be +0
```
**Restore:** `git checkout -- styles/*.json`

### N5: Blank min length < 305mm
**Change:** Set blankMinLength_mm = 200 in catalog
**Test:** Blank minimum length test exists
**Note:** Enforced by max(blankMinLength_mm, calculated) in lumberPlanner.ts

### N6: Blank max length > 915mm  
**Change:** Comment out panel splitting logic in lumberPlanner.ts (lines 210-228)
**Expected:** Blank maximum length test fails
**Test:** `npm test -- cutListSafety`
**Result:** ✅ FAILS - 2 tests fail:
```
FAIL src/lib/cutListSafety.test.ts > Blank Length Constraints > should never generate blanks over 915mm maximum length
AssertionError: expected 6 to be +0 // Object.is equality

FAIL src/lib/cutListSafety.test.ts > Blank Length Constraints > [MANUAL FIX-OFF] bypassing blankMaxLength should produce over-915mm violations
AssertionError: expected 1 to be +0 // Object.is equality
```
**Restore:** `git checkout -- src/lib/lumberPlanner.ts`

### N7: Panel width > 305mm to planer
**Change:** Set panelMaxPlanerWidth_mm = 500 in catalog
**Test:** Panel width test
**Note:** Enforced by width checks in lumberPlanner.ts strip-set panel logic

## Test Implementation Status

- ✅ E6: Font minimum (implemented)
- ✅ N1: Blank rule (implemented)
- ✅ N3: Unique stepId (implemented)
- ✅ N4: Width rules (implemented)
- ⚠️ E1,E2,E4,E5,E7,E8: Need PDF/SVG validation tests
- ⚠️ N2: Need working external figures test
- ⚠️ N5,N6,N7: Need blank/panel dimension tests
