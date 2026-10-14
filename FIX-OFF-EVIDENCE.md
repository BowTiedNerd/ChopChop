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
**Result:** ✅ FAILS as expected (2 tests: under 305mm length, over 152mm jointer width)

### N2: Missing SVG check removed
**Change:** Remove REQUIRE_EXTERNAL_FIGURES check in pdf.ts
**Expected:** External figures test fails
**Command:** `npm test -- externalFigures`
**Status:** PENDING - Need working external figures test

### N3: Duplicate stepId in catalog
**Change:** Duplicate a stepId in checkerboard.json
**Expected:** Unique stepId tests fail
**Command:** `npm test -- stepId`
**Result:** ✅ FAILS as expected (2 tests fail)

### N4: Width rules disabled
**Change:** Remove planerMaxWidth and jointerMaxWidth from catalog
**Expected:** Width safety test fails
**Command:** `npm test -- cutListWidth`
**Result:** ✅ FAILS as expected (1 test: jointer width check)

### N5: Blank min length < 305mm
**Change:** Set blankMinLength_mm = 200 in catalog
**Expected:** Blank minimum length test fails
**Command:** `npm test -- "blank.*minimum|blank.*305"`
**Status:** PENDING - Need blank min length test

### N6: Blank max length > 915mm  
**Change:** Set blankMaxLength_mm = 1200 in catalog
**Expected:** Blank maximum length test fails
**Command:** `npm test -- "blank.*maximum|blank.*915"`
**Status:** PENDING - Need blank max length test

### N7: Panel width > 305mm to planer
**Change:** Set panelMaxPlanerWidth_mm = 500 in catalog
**Expected:** Panel width test fails
**Command:** `npm test -- "panel.*width|planer.*width"`
**Status:** PENDING - Need panel width test

## Test Implementation Status

- ✅ E6: Font minimum (implemented)
- ✅ N1: Blank rule (implemented)
- ✅ N3: Unique stepId (implemented)
- ✅ N4: Width rules (implemented)
- ⚠️ E1,E2,E4,E5,E7,E8: Need PDF/SVG validation tests
- ⚠️ N2: Need working external figures test
- ⚠️ N5,N6,N7: Need blank/panel dimension tests
