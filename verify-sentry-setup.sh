#!/bin/bash
# Sentry Integration Verification Script
# Run this to verify Sentry is properly configured

echo "🔍 Sentry Integration Verification"
echo "=================================="
echo ""

# Check frontend environment
echo "1️⃣  Frontend Configuration:"
if grep -q "VITE_SENTRY_DSN" .env.local 2>/dev/null; then
    echo "   ✅ VITE_SENTRY_DSN found in .env.local"
else
    echo "   ❌ VITE_SENTRY_DSN not found in .env.local"
fi

if grep -q "VITE_SENTRY_DSN" .env.example 2>/dev/null; then
    echo "   ✅ VITE_SENTRY_DSN template in .env.example"
else
    echo "   ❌ VITE_SENTRY_DSN template not in .env.example"
fi

# Check frontend implementation
echo ""
echo "2️⃣  Frontend Files:"
if [ -f "src/utils/sentry.ts" ]; then
    echo "   ✅ src/utils/sentry.ts exists"
else
    echo "   ❌ src/utils/sentry.ts missing"
fi

if [ -f "src/components/common/ErrorBoundary.tsx" ]; then
    echo "   ✅ src/components/common/ErrorBoundary.tsx exists"
else
    echo "   ❌ src/components/common/ErrorBoundary.tsx missing"
fi

if grep -q "initializeSentry" src/main.tsx; then
    echo "   ✅ Sentry initialized in main.tsx"
else
    echo "   ❌ Sentry not initialized in main.tsx"
fi

if grep -q "ErrorBoundary" src/main.tsx; then
    echo "   ✅ ErrorBoundary used in main.tsx"
else
    echo "   ❌ ErrorBoundary not used in main.tsx"
fi

# Check backend environment
echo ""
echo "3️⃣  Backend Configuration:"
if grep -q "SENTRY_DSN" africajustice-backend/.env.local 2>/dev/null; then
    echo "   ✅ SENTRY_DSN found in africajustice-backend/.env.local"
else
    echo "   ❌ SENTRY_DSN not found in africajustice-backend/.env.local"
fi

if grep -q "SENTRY_DSN" africajustice-backend/.env.example 2>/dev/null; then
    echo "   ✅ SENTRY_DSN template in africajustice-backend/.env.example"
else
    echo "   ❌ SENTRY_DSN template not in africajustice-backend/.env.example"
fi

# Check backend implementation
echo ""
echo "4️⃣  Backend Files:"
if [ -f "africajustice-backend/src/config/sentry.ts" ]; then
    echo "   ✅ africajustice-backend/src/config/sentry.ts exists"
else
    echo "   ❌ africajustice-backend/src/config/sentry.ts missing"
fi

if grep -q "initializeSentry" africajustice-backend/src/app.ts; then
    echo "   ✅ Sentry initialized in app.ts"
else
    echo "   ❌ Sentry not initialized in app.ts"
fi

if grep -q "setupSentryMiddleware" africajustice-backend/src/app.ts; then
    echo "   ✅ Sentry middleware setup in app.ts"
else
    echo "   ❌ Sentry middleware not setup in app.ts"
fi

if grep -q "setupSentryErrorHandler" africajustice-backend/src/app.ts; then
    echo "   ✅ Sentry error handler setup in app.ts"
else
    echo "   ❌ Sentry error handler not setup in app.ts"
fi

# Check dependencies
echo ""
echo "5️⃣  Dependencies:"
if grep -q "@sentry/react" package.json; then
    echo "   ✅ @sentry/react in package.json"
else
    echo "   ❌ @sentry/react not in package.json"
fi

if grep -q "@sentry/node" africajustice-backend/package.json; then
    echo "   ✅ @sentry/node in africajustice-backend/package.json"
else
    echo "   ❌ @sentry/node not in africajustice-backend/package.json"
fi

# Check documentation
echo ""
echo "6️⃣  Documentation:"
if [ -f "PHASE4.7_SENTRY_MONITORING.md" ]; then
    echo "   ✅ PHASE4.7_SENTRY_MONITORING.md exists"
else
    echo "   ❌ PHASE4.7_SENTRY_MONITORING.md missing"
fi

if [ -f "SENTRY_QUICK_SETUP.md" ]; then
    echo "   ✅ SENTRY_QUICK_SETUP.md exists"
else
    echo "   ❌ SENTRY_QUICK_SETUP.md missing"
fi

# Summary
echo ""
echo "=================================="
echo "✨ Verification Complete!"
echo ""
echo "📚 See SENTRY_QUICK_SETUP.md for setup instructions"
echo "📖 See PHASE4.7_SENTRY_MONITORING.md for detailed docs"
