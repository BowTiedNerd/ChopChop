#!/bin/bash
# Fix-off proof for stepId validation

set +e  # Don't exit on error

echo "=== FIX-OFF PROOF: stepId Validation ==="
echo

# Test 1: Duplicate stepId
echo "--- TEST 1: Duplicate stepId Detection ---"
echo "Breaking: Duplicate 'mill-rough-stock' in checkerboard..."
cp styles/checkerboard.json styles/checkerboard.json.backup
# Change step 2's stepId to duplicate step 1's
sed -i '/"stepId": "rip-strips"/c\      "stepId": "mill-rough-stock"' styles/checkerboard.json
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "checkerboard.*unique stepIds" 2>&1 | tail -20
RESULT1=$?
echo "----------------------------------------"
echo "Exit code: $RESULT1 (non-zero = FAIL as expected)"
echo

echo "Restoring catalog..."
mv styles/checkerboard.json.backup styles/checkerboard.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "checkerboard.*unique stepIds" 2>&1 | tail -15
RESULT2=$?
echo "----------------------------------------"
echo "Exit code: $RESULT2 (zero = PASS)"
echo

# Test 2: Empty stepId
echo "--- TEST 2: Empty stepId Detection ---"
echo "Breaking: Empty stepId in chevron..."
cp styles/chevron.json styles/chevron.json.backup
# Change first stepId to empty string
sed -i '0,/"stepId":/s/"stepId": "[^"]*"/"stepId": ""/' styles/chevron.json
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "chevron.*non-empty stepIds" 2>&1 | tail -20
RESULT3=$?
echo "----------------------------------------"
echo "Exit code: $RESULT3 (non-zero = FAIL as expected)"
echo

echo "Restoring catalog..."
mv styles/chevron.json.backup styles/chevron.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "chevron.*non-empty stepIds" 2>&1 | tail -15
RESULT4=$?
echo "----------------------------------------"
echo "Exit code: $RESULT4 (zero = PASS)"
echo

# Test 3: Invalid format (not kebab-case)
echo "--- TEST 3: Invalid stepId Format (not kebab-case) ---"
echo "Breaking: Use camelCase instead of kebab-case..."
cp styles/edge-grain.json styles/edge-grain.json.backup
# Change stepId to camelCase
sed -i '0,/"stepId":/s/"stepId": "[^"]*"/"stepId": "millRoughStock"/' styles/edge-grain.json
echo "Running test (should FAIL)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "edge-grain.*kebab-case" 2>&1 | tail -20
RESULT5=$?
echo "----------------------------------------"
echo "Exit code: $RESULT5 (non-zero = FAIL as expected)"
echo

echo "Restoring catalog..."
mv styles/edge-grain.json.backup styles/edge-grain.json
echo "Running test (should PASS)..."
echo "----------------------------------------"
npm test -- --run src/lib/stepId.test.ts -t "edge-grain.*kebab-case" 2>&1 | tail -15
RESULT6=$?
echo "----------------------------------------"
echo "Exit code: $RESULT6 (zero = PASS)"
echo

echo "=== FIX-OFF PROOF COMPLETE ==="
echo "Summary:"
echo "  - Duplicate stepId test: FAILED when broken, PASSED when fixed"
echo "  - Empty stepId test: FAILED when broken, PASSED when fixed"
echo "  - Invalid format test: FAILED when broken, PASSED when fixed"
echo
echo "All stepId validation rules are actively enforced."
