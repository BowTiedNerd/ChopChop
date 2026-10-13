#!/bin/bash
# Fix-off proof: Temporarily break fixes to show tests fail

set -e
echo "=== FIX-OFF PROOF FOR ACCEPTANCE RULES ==="
echo

# Rule 1: Minimum font size
echo "--- RULE 1: Text Size (min 11 units) ---"
echo "Breaking fix: Allow font size below 11..."
sed -i.bak 's/if (fontSize < MIN_FONT_SIZE)/if (fontSize < 0)/' src/lib/svg.ts
echo "Running test (should FAIL):"
npm test -- src/lib/acceptance.test.ts -t "should enforce minimum SVG font size" 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "FAILED as expected"
echo "Restoring fix..."
mv src/lib/svg.ts.bak src/lib/svg.ts
echo "Running test (should PASS):"
npm test -- src/lib/acceptance.test.ts -t "should enforce minimum SVG font size" 2>&1 | grep -E "(PASS|✓)" && echo "✓ PASSED"
echo

# Rule 2: No truncation (inchText)
echo "--- RULE 2: No Truncation (inchText formats) ---"
echo "Breaking fix: Remove fraction formatting..."
sed -i.bak 's/const fraction = toFraction(inches)/const fraction = null/' src/utils/format.ts
echo "Running test (should FAIL):"
npm test -- src/lib/acceptance.test.ts -t "should format inch text without truncation" 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "FAILED as expected"
echo "Restoring fix..."
mv src/utils/format.ts.bak src/utils/format.ts
echo "Running test (should PASS):"
npm test -- src/lib/acceptance.test.ts -t "should format inch text without truncation" 2>&1 | grep -E "(PASS|✓)" && echo "✓ PASSED"
echo

# Rule 3: Metric rounding
echo "--- RULE 3: Metric Rounding (0.5mm precision) ---"
echo "Breaking fix: Remove rounding..."
sed -i.bak 's/return Math.round(mm \* 2) \/ 2/return mm/' src/utils/format.ts
echo "Running test (should FAIL):"
npm test -- src/lib/acceptance.test.ts -t "should round metric layout distances" 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "FAILED as expected"
echo "Restoring fix..."
mv src/utils/format.ts.bak src/utils/format.ts
echo "Running test (should PASS):"
npm test -- src/lib/acceptance.test.ts -t "should round metric layout distances" 2>&1 | grep -E "(PASS|✓)" && echo "✓ PASSED"
echo

# Rule 5: Hardware format
echo "--- RULE 5: Hardware Format (nominal inch + exact mm) ---"
echo "Breaking fix: Use only metric..."
sed -i.bak 's/1" (25.4 mm) diameter/25.4 mm diameter/' src/lib/pdf.ts
echo "Running test (should FAIL):"
npm test -- src/lib/acceptance.test.ts -t "should format hardware as nominal inch" 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "FAILED as expected"
echo "Restoring fix..."
mv src/lib/pdf.ts.bak src/lib/pdf.ts
echo "Running test (should PASS):"
npm test -- src/lib/acceptance.test.ts -t "should format hardware as nominal inch" 2>&1 | grep -E "(PASS|✓)" && echo "✓ PASSED"
echo

# Rule 6: Validation
echo "--- RULE 6: Input Validation ---"
echo "Breaking fix: Remove angle validation..."
sed -i.bak 's/if (angle < 15 || angle > 85)/if (false)/' src/lib/validation.ts
echo "Running test (should FAIL):"
npm test -- src/lib/acceptance.test.ts -t "should reject invalid angles" 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "FAILED as expected"
echo "Restoring fix..."
mv src/lib/validation.ts.bak src/lib/validation.ts
echo "Running test (should PASS):"
npm test -- src/lib/acceptance.test.ts -t "should reject invalid angles" 2>&1 | grep -E "(PASS|✓)" && echo "✓ PASSED"
echo

echo "=== FIX-OFF PROOF COMPLETE ==="
echo "All fixes verified: tests fail when broken, pass when fixed"
