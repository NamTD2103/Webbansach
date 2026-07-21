# 📋 CLEANUP CHECKLIST - FILES TO DELETE

## Priority 1: DELETE IMMEDIATELY (Security/Duplication)

### Script Files (Not needed after setup):
```bash
# These scripts are only run once during initial setup
# Delete them after database is initialized
rm backend/check-user-id-type.js
rm backend/check-orders-columns.js  
rm backend/check-users-columns.js
rm backend/check-wishlist-columns.js
rm backend/check-tables.js
rm backend/cleanup-db.js
rm backend/fix-sequence.js
rm backend/add-payment-method-column.js
rm backend/create-payment-tables.js
```

### Test/Demo Files:
```bash
# These are temporary testing files - use proper integration tests instead
rm backend/test-db.js
rm backend/test-full-payment.js
rm backend/test-order-creation.js
rm backend/test-payment-api.js
rm backend/test-vnpay.sh
```

### Example/Documentation Files (Redundant):
```bash
# Keep only one reference implementation
rm backend/VNPAY-API-DOCS.js
rm backend/VNPAY-EXAMPLES.js
rm VNPAY-POSTMAN.json  # Use Postman Collection, don't version control
```

---

## Priority 2: CONSOLIDATE DOCUMENTATION (Keep Only 1 Main + 1 Setup Guide)

### Excessive Guides to Delete:
```bash
# Chatbot - too many duplicate guides
rm CHATBOT_ENHANCED_GUIDE.md
rm CHATBOT_SETUP_GUIDE.md
rm CHATBOT_SYSTEM_COMPLETE.md
rm CHATBOT_SYSTEM_OVERVIEW.md
rm CHATBOT_IMPLEMENTATION_COMPLETE.md
rm CHATBOT_INTEGRATION_EXAMPLES.md
# ✅ KEEP: CHATBOT_QUICK_REFERENCE.md (as reference only)

# Book Recommendations - keep only summary
rm BOOK_RECOMMENDATION_CHECKLIST.md
rm BOOK_RECOMMENDATION_QUICK_START.md
rm BOOK_RECOMMENDATION_SYSTEM.md
# ✅ KEEP: IMPLEMENTATION_SUMMARY_RECOMMENDATIONS.md

# User Profile - consolidate
rm USER_PROFILE_QUICK_START.md
rm USER_PROFILE_SYSTEM.md

# Order/Voucher/etc - too specific
rm ORDER_CREATION_FIXES.md
rm PLACEHOLDER_AND_CART_FIXES.md
rm VOUCHER_QUICK_START.ts
rm VOUCHER_SYSTEM_GUIDE.md

# Auth guides - consolidate
rm AUTH_QUICK_START.md
rm AUTH_SYSTEM_GUIDE.md

# VNPay - keep only main architecture doc
rm VNPAY-DELIVERY.md
rm VNPAY-INDEX.md
rm VNPAY-QUICK-REFERENCE.md
rm VNPAY-SUMMARY.md
# ✅ KEEP: VNPAY-ARCHITECTURE.md (main reference)

# Implementation summaries - pick one
rm IMPLEMENTATION_SUMMARY.md
# ✅ KEEP: IMPLEMENTATION_SUMMARY_RECOMMENDATIONS.md (more detailed)

# Fixes documentation - should be in code comments, not separate files
rm FIXES_AND_ENHANCEMENTS.md
rm VNPAY_FIXES_COMPLETED.md
```

### Final Documentation Structure:
```
✅ README.md                           # Main project overview
✅ SETUP_GUIDE.md                      # How to run project locally
✅ VNPAY-ARCHITECTURE.md               # Payment system documentation
✅ QUICK_START_ADMIN.md                # Admin panel quick start
✅ AUDIT_REPORT_CRITICAL.md            # This audit report (kept for reference)
✅ CLAUDE.md                           # Keep as notes if useful
```

---

## Priority 3: CODE CLEANUP

### Unused Component Files:
```typescript
// Check if these are actually used in pages
// If not imported anywhere → delete
components/ChatBotStatsAdmin.tsx  // Likely unused
components/EnhancedChatBot.tsx    // Check if ChatBot.tsx is used instead
```

### Dead Routes/Endpoints:
```javascript
// Check backend/routes/ for routes not mounted in server.js
// Look for review.js, recommendations.js if not used
```

---

## Security: Add to .gitignore

```bash
# Make sure these are in .gitignore (not version controlled):

# Environment files
.env
.env.local
.env.*.local
.env.production.local

# Database files
*.db
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# Dependencies
node_modules/
/.next/
/out/
/build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# Temporary
tmp/
temp/
*.bak
*.tmp

# Credentials
*.key
*.pem
*.pfx
*.p12
```

---

## After Cleanup, Verify:

```bash
# 1. Check project size before/after
du -sh .

# 2. Verify tests still pass
npm test

# 3. Verify build works
npm run build

# 4. Run lint
npm run lint

# 5. Check for unused imports
# Install: npm install --save-dev unimported
# Run: unimported
```

---

## Commands to Run (Copy & Paste):

```bash
# Delete all Priority 1 files
rm backend/check-*.js backend/cleanup-db.js backend/fix-sequence.js \
   backend/add-payment-method-column.js backend/create-payment-tables.js \
   backend/test-*.js backend/test-vnpay.sh backend/VNPAY-*.js

# Delete excessive documentation
rm CHATBOT_*.md BOOK_RECOMMENDATION_*.md USER_PROFILE_*.md \
   ORDER_CREATION_FIXES.md PLACEHOLDER_AND_CART_FIXES.md \
   VOUCHER_*.md VNPAY-DELIVERY.md VNPAY-INDEX.md \
   VNPAY-QUICK-REFERENCE.md VNPAY-SUMMARY.md \
   IMPLEMENTATION_SUMMARY.md FIXES_AND_ENHANCEMENTS.md \
   VNPAY_FIXES_COMPLETED.md

# Verify remaining files
ls -la | grep -E "\.md$|\.tsx$|\.js$"

# Update .gitignore
git rm --cached .env backend/.env 2>/dev/null || true
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
git add .gitignore

# Commit cleanup
git add -A
git commit -m "chore: cleanup dead code and consolidate documentation"
```

