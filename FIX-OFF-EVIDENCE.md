# Fix-Off Evidence

This document records turn-off experiments: deliberate violations that must fail specific tests.

## Experiment Results

### E1: Banner truncated to 20 characters
**Change:** Truncate safety banners to 20 chars in pdf.ts
**Expected:** Banner test should fail
**Command:** `npm test -- "truncate"`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #4: Banner tests > should never truncate safety banners
AssertionError: expected 17621 to be greater than 18000
```
**Restore:** `git checkout -- src/lib/pdf.ts`

### E2: Only first banner printed
**Change:** Print only first safety banner in pdf.ts
**Expected:** Banner test should fail  
**Command:** `npm test -- pr1Review`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #4: Banner tests > should never truncate safety banners
AssertionError: expected 17888 to be greater than 18000
```
**Restore:** `git checkout -- src/lib/pdf.ts`

### E3: Label font size reduced to 10pt
**Change:** Set RIP FENCE label font to 10pt in stepFigures.ts
**Expected:** Minimum font size test should fail
**Command:** `npm test -- pr1Review`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #3: No [Step Diagram] placeholders in PDFs > should enforce 11pt minimum on step figure labels
Error: Font size 10 is below minimum 11
```
**Restore:** `git checkout -- src/lib/stepFigures.ts`

### E4: Label positioned on blade
**Change:** Place RIP FENCE label at x=200 (on blade) in stepFigures.ts
**Expected:** Label collision test should fail
**Command:** `npm test -- pr1Review`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #3: No [Step Diagram] placeholders in PDFs > should not place labels on blade geometry
AssertionError: expected 0 to be greater than 10
```
**Restore:** `git checkout -- src/lib/stepFigures.ts`

### E5: Dimension label scaled to 0.5
**Change:** Add scale(0.5) to dimension label in svg.ts
**Expected:** Scale test should fail
**Command:** `npm test -- browserCheck`
**Result:** ✅ FAILS - 3 tests fail:
```
FAIL src/lib/browserCheck.test.ts > Browser Check > should render text at minimum size (10.67px)
AssertionError: expected 2 to be +0 // Object.is equality
```
**Restore:** `git checkout -- src/lib/svg.ts`

### E6: Remove 11-unit font minimum
**Change:** Remove MIN_FONT check in svg.ts
**Expected:** Font minimum test fails
**Command:** `npm test -- "minimum font"`
**Result:** ✅ FAILS as expected (2 tests fail)

### E7: PDF figures scaled to 0.1
**Change:** Set figure scale=0.1 in pdf.ts addFigure
**Expected:** PDF size test should fail
**Command:** `npm test -- pr1Review`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #2: CTM and scale validation > should not scale PDF figures below readable size
AssertionError: expected 18353 to be greater than 18700
```
**Restore:** `git checkout -- src/lib/pdf.ts samples/*.pdf`

### E8: Footer reduced to 5pt
**Change:** Set footer font to 5pt in pdf.ts
**Expected:** Minimum text size test fails
**Command:** `npm test -- pr1Review`
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/pr1Review.test.ts > PR1-REVIEW #1: PDF minimum text size > should use 8pt minimum for footer text
AssertionError: expected 5 to be greater than or equal to 8
```
**Restore:** `git checkout -- src/lib/pdf.ts`

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
**Result:** ✅ FAILS - 1 test fails:
```
FAIL src/lib/externalFigures.test.ts > Fix-off: missing external figure > should throw error when required SVG is missing and ALLOW_FALLBACK is false
AssertionError: expected [Function] to throw an error
```
**Note:** Removal would allow fallback to inline figures when external missing
**Restore:** `git checkout -- src/lib/pdf.ts`

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
**Test:** Blank minimum length test
**Command:** `npm test -- cutListSafety`
**Result:** ✅ FAILS - 2 tests fail:
```
FAIL src/lib/cutListSafety.test.ts > Cut List Safety > should never generate cut list items under 305mm length
Error: Cut list safety violations (pieces under 305mm)

FAIL src/lib/cutListSafety.test.ts > Blank Length Constraints > should never generate blanks under 305mm minimum length
AssertionError: expected 20 to be +0 // Object.is equality
```
**Note:** Enforced by max(blankMinLength_mm, calculated) in lumberPlanner.ts
**Restore:** `git checkout -- styles/*.json`

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
**Change:** Disable panel width routing in lumberPlanner.ts (lines 240-252)
**Test:** Panel width routing test with wide boards (8-10 species)
**Command:** `npm test -- cutListWidth`
**Result:** ✅ FAILS - 1 test fails with 3 violations:
```
FAIL src/lib/cutListWidthSafety.test.ts > should route wide strip-set panels correctly (N7 test)
Error: Panel width routing violations:
  - checkerboard (wide): Walnut/Maple/Cherry/Oak/Ash/Mahogany/Birch/Beech/Hickory/Teak strip-set panel: g has width 454mm (> 305mm) without routing
  - chevron (wide): Walnut/Maple/Cherry/Oak/Ash/Mahogany/Birch/Beech/Hickory/Teak strip-set panel: g has width 395mm (> 305mm) without routing

All panels over 305mm must be routed to router sled or split into sub-panels ≤305mm.
```
**Note:** Test uses boards with 10 species to force panels > 305mm. Enforced by width checks in lumberPlanner.ts strip-set panel logic.
**Restore:** `git checkout -- src/lib/lumberPlanner.ts`

## Test Implementation Status

- ✅ E6: Font minimum (implemented)
- ✅ N1: Blank rule (implemented)
- ✅ N3: Unique stepId (implemented)
- ✅ N4: Width rules (implemented)
- ⚠️ E1,E2,E4,E5,E7,E8: Need PDF/SVG validation tests
- ⚠️ N2: Need working external figures test
- ⚠️ N5,N6,N7: Need blank/panel dimension tests
