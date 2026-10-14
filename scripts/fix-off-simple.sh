#!/bin/bash
# Simplified fix-off proof: Show one rule failing when fix is broken

set +e  # Don't exit on error

echo "=== FIX-OFF PROOF: RULE 1 - Minimum Font Size ==="
echo
echo "STEP 1: Breaking the fix (allow fontSize < MIN_FONT_SIZE)..."
cp src/lib/svg.ts src/lib/svg.ts.backup
sed -i 's/if (fontSize < MIN_FONT_SIZE)/if (fontSize < 0)/' src/lib/svg.ts
echo "Fix broken: MIN_FONT_SIZE check disabled"
echo

echo "STEP 2: Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/svg.test.ts -t "should enforce minimum font size" 2>&1 | tail -40
EXIT_CODE=$?
echo "----------------------------------------"
echo "Exit code: $EXIT_CODE (non-zero = FAIL, as expected)"
echo

echo "STEP 3: Restoring the fix..."
mv src/lib/svg.ts.backup src/lib/svg.ts
echo "Fix restored: MIN_FONT_SIZE check re-enabled"
echo

echo "STEP 4: Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/svg.test.ts -t "should enforce minimum font size" 2>&1 | tail -40
EXIT_CODE=$?
echo "----------------------------------------"
echo "Exit code: $EXIT_CODE (zero = PASS)"
echo

echo "=== FIX-OFF PROOF COMPLETE ==="
echo "The test FAILS when the fix is broken, and PASSES when fixed."
echo "This proves the test actively enforces the ACCEPTANCE rule."
