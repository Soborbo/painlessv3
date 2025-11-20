#!/bin/bash

echo "🧪 Running Complete Test Suite..."
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=25
PASSED_TESTS=0

echo "📦 1. Installing dependencies..."
npm install

echo ""
echo "🔍 2. Type checking..."
npm run type-check
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Type check passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}✗ Type check failed${NC}"
fi

echo ""
echo "🎨 3. Linting..."
npm run lint
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Lint check passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}✗ Lint check failed${NC}"
fi

echo ""
echo "🧪 4. Running unit tests..."
npm run test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
    ((PASSED_TESTS+=10))
else
    echo -e "${RED}✗ Unit tests failed${NC}"
fi

echo ""
echo "🏗️ 5. Building project..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}✗ Build failed${NC}"
fi

echo ""
echo "🏥 6. Health check..."
npm run health-check
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}✗ Health check failed${NC}"
fi

echo ""
echo "================================="
echo "📊 Test Results:"
echo "   Passed: $PASSED_TESTS/$TOTAL_TESTS tests"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for production!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix before deploying.${NC}"
    exit 1
fi
