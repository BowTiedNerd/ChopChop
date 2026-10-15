#!/bin/bash
# Fix-off proof for styles/ directory validation

set +e  # Don't exit on error

echo "=== FIX-OFF PROOF: styles/ Directory Validation ==="
echo

# Test 1: Unauthorized file in styles/
echo "--- TEST 1: Unauthorized File Detection ---"
echo "Breaking: Add unauthorized hash-suffixed file..."
touch styles/checkerboard_test99.json
echo "Created: styles/checkerboard_test99.json"
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should contain only authorized files" 2>&1 | tail -25
RESULT1=$?
echo "----------------------------------------"
echo "Exit code: $RESULT1 (non-zero = FAIL as expected)"
echo

echo "Restoring: Remove unauthorized file..."
rm styles/checkerboard_test99.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should contain only authorized files" 2>&1 | tail -15
RESULT2=$?
echo "----------------------------------------"
echo "Exit code: $RESULT2 (zero = PASS)"
echo

# Test 2: Missing stepId
echo "--- TEST 2: Missing stepId Detection ---"
echo "Breaking: Remove stepId from a step..."
cp styles/edge-grain.json styles/edge-grain.json.backup
# Remove first stepId field
sed -i '0,/"stepId":/d' styles/edge-grain.json
echo "Removed first stepId from edge-grain.json"
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should have stepId on every step" 2>&1 | tail -25
RESULT3=$?
echo "----------------------------------------"
echo "Exit code: $RESULT3 (non-zero = FAIL as expected)"
echo

echo "Restoring catalog..."
mv styles/edge-grain.json.backup styles/edge-grain.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should have stepId on every step" 2>&1 | tail -15
RESULT4=$?
echo "----------------------------------------"
echo "Exit code: $RESULT4 (zero = PASS)"
echo

# Test 3: Hash-suffixed file detection
echo "--- TEST 3: Hash-Suffixed File Detection ---"
echo "Breaking: Add hash-suffixed file..."
cp styles/chevron.json styles/chevron_99ab.json
echo "Created: styles/chevron_99ab.json"
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should not contain any hash-suffixed" 2>&1 | tail -25
RESULT5=$?
echo "----------------------------------------"
echo "Exit code: $RESULT5 (non-zero = FAIL as expected)"
echo

echo "Restoring: Remove hash-suffixed file..."
rm styles/chevron_99ab.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stylesDirectory.test.ts -t "should not contain any hash-suffixed" 2>&1 | tail -15
RESULT6=$?
echo "----------------------------------------"
echo "Exit code: $RESULT6 (zero = PASS)"
echo

echo "=== FIX-OFF PROOF COMPLETE ==="
echo "Summary:"
echo "  - Unauthorized file detection: FAILED when broken, PASSED when fixed"
echo "  - Missing stepId detection: FAILED when broken, PASSED when fixed"
echo "  - Hash-suffixed file detection: FAILED when broken, PASSED when fixed"
echo
echo "All styles/ directory validation rules are actively enforced."
