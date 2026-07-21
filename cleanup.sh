#!/bin/bash

# 🧹 CLEANUP SCRIPT - DELETE UNUSED FILES
# This script removes test, setup, and old documentation files
# Run: bash cleanup.sh

echo "🧹 Starting cleanup of unused files..."
echo ""

# Counter
DELETED=0

# Test files
echo "Deleting test files..."
rm -f backend/test-db.js && echo "✓ backend/test-db.js" && ((DELETED++))
rm -f backend/test-payment-api.js && echo "✓ backend/test-payment-api.js" && ((DELETED++))
rm -f backend/test-order-creation.js && echo "✓ backend/test-order-creation.js" && ((DELETED++))
rm -f backend/test-full-payment.js && echo "✓ backend/test-full-payment.js" && ((DELETED++))

# Setup scripts
echo ""
echo "Deleting setup scripts..."
rm -f backend/setup-test-order.js && echo "✓ backend/setup-test-order.js" && ((DELETED++))
rm -f backend/setup-review-system.js && echo "✓ backend/setup-review-system.js" && ((DELETED++))
rm -f backend/setup-recommendation-system.js && echo "✓ backend/setup-recommendation-system.js" && ((DELETED++))
rm -f backend/setup-profile-system.js && echo "✓ backend/setup-profile-system.js" && ((DELETED++))
rm -f backend/setup-chatbot-enhanced.js && echo "✓ backend/setup-chatbot-enhanced.js" && ((DELETED++))

# Check scripts
echo ""
echo "Deleting check/debug scripts..."
rm -f backend/check-user-id-type.js && echo "✓ backend/check-user-id-type.js" && ((DELETED++))
rm -f backend/check-schema.js && echo "✓ backend/check-schema.js" && ((DELETED++))
rm -f backend/check-orders-columns.js && echo "✓ backend/check-orders-columns.js" && ((DELETED++))
rm -f backend/check-users-columns.js && echo "✓ backend/check-users-columns.js" && ((DELETED++))
rm -f backend/check-wishlist-columns.js && echo "✓ backend/check-wishlist-columns.js" && ((DELETED++))

# DB migration scripts
echo ""
echo "Deleting DB migration scripts..."
rm -f backend/add-payment-method-column.js && echo "✓ backend/add-payment-method-column.js" && ((DELETED++))
rm -f backend/cleanup-db.js && echo "✓ backend/cleanup-db.js" && ((DELETED++))
rm -f backend/fix-sequence.js && echo "✓ backend/fix-sequence.js" && ((DELETED++))
rm -f backend/create-payment-tables.js && echo "✓ backend/create-payment-tables.js" && ((DELETED++))

# Old documentation/fix files
echo ""
echo "Deleting old documentation..."
rm -f FIXES_SECURITY_1_authUtils.js && echo "✓ FIXES_SECURITY_1_authUtils.js" && ((DELETED++))
rm -f FIXES_SECURITY_2_cookies.js && echo "✓ FIXES_SECURITY_2_cookies.js" && ((DELETED++))
rm -f FIXES_STRUCTURE_1_apiResponse.js && echo "✓ FIXES_STRUCTURE_1_apiResponse.js" && ((DELETED++))
rm -f FIXES_LOGIC_1_admin_routes.js && echo "✓ FIXES_LOGIC_1_admin_routes.js" && ((DELETED++))
rm -f check-tables.js && echo "✓ check-tables.js" && ((DELETED++))
rm -f AUDIT_REPORT_COMPREHENSIVE.md && echo "✓ AUDIT_REPORT_COMPREHENSIVE.md" && ((DELETED++))
rm -f AUDIT_REPORT_CRITICAL.md && echo "✓ AUDIT_REPORT_CRITICAL.md" && ((DELETED++))

# Unused routes
echo ""
echo "Deleting unused routes..."
rm -f backend/routes/chatbot-enhanced.js && echo "✓ backend/routes/chatbot-enhanced.js" && ((DELETED++))

echo ""
echo "✅ Cleanup complete! Deleted $DELETED files"
echo ""
echo "📋 Files kept (production code):"
echo "✓ backend/routes/chatbot.js (in use)"
echo "✓ All other backend routes"
echo "✓ All frontend components"
echo "✓ All configuration files"
