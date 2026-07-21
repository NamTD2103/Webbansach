/**
 * DATABASE OPTIMIZATION SCRIPT
 * File: backend/database/create-indexes.sql
 * 
 * ✅ Add these indexes to improve query performance
 * Reduces N+1 queries and full table scans
 */

-- ============================================================================
-- USER-RELATED INDEXES
-- ============================================================================

CREATE INDEX IDX_USERS_EMAIL ON USERS(LOWER(EMAIL));
CREATE INDEX IDX_USERS_USERNAME ON USERS(LOWER(USERNAME));
CREATE INDEX IDX_USERS_STATUS ON USERS(STATUS);

-- ============================================================================
-- ORDER-RELATED INDEXES
-- ============================================================================

-- Frequently used queries
CREATE INDEX IDX_ORDERS_USER_ID ON ORDERS(USER_ID);
CREATE INDEX IDX_ORDERS_STATUS ON ORDERS(STATUS);
CREATE INDEX IDX_ORDERS_DATE ON ORDERS(ORDER_DATE DESC);
CREATE INDEX IDX_ORDERS_PAYMENT ON ORDERS(PAYMENT_METHOD);

-- Composite indexes for common queries
CREATE INDEX IDX_ORDERS_USER_STATUS ON ORDERS(USER_ID, STATUS);
CREATE INDEX IDX_ORDERS_USER_DATE ON ORDERS(USER_ID, ORDER_DATE DESC);

-- ============================================================================
-- ORDER ITEMS INDEXES
-- ============================================================================

CREATE INDEX IDX_ORDER_ITEMS_ORDER_ID ON ORDER_ITEMS(ORDER_ID);
CREATE INDEX IDX_ORDER_ITEMS_MASP ON ORDER_ITEMS(MASP);
CREATE INDEX IDX_ORDER_ITEMS_ORDER_MASP ON ORDER_ITEMS(ORDER_ID, MASP);

-- ============================================================================
-- CART INDEXES
-- ============================================================================

CREATE INDEX IDX_CART_USER_ID ON CART(USER_ID);

CREATE INDEX IDX_CART_ITEM_CART_ID ON CART_ITEM(CART_ID);
CREATE INDEX IDX_CART_ITEM_MASP ON CART_ITEM(MASP);
CREATE INDEX IDX_CART_ITEM_CART_MASP ON CART_ITEM(CART_ID, MASP);

-- ============================================================================
-- PRODUCT INDEXES
-- ============================================================================

CREATE INDEX IDX_SANPHAM_TENSP ON SANPHAM(UPPER(TENSP));
CREATE INDEX IDX_SANPHAM_SOLUONGTON ON SANPHAM(SOLUONGTON);
CREATE INDEX IDX_SANPHAM_GIABAN ON SANPHAM(GIABAN);
CREATE INDEX IDX_SANPHAM_MOTA ON SANPHAM(UPPER(MOTA));

-- ============================================================================
-- AUTHENTICATION INDEXES
-- ============================================================================

CREATE INDEX IDX_EMAIL_VERIFICATIONS_USER_ID ON EMAIL_VERIFICATIONS(USER_ID);
CREATE INDEX IDX_EMAIL_VERIFICATIONS_EXPIRES ON EMAIL_VERIFICATIONS(EXPIRES_AT);

CREATE INDEX IDX_PASSWORD_RESETS_USER_ID ON PASSWORD_RESETS(USER_ID);
CREATE INDEX IDX_PASSWORD_RESETS_EXPIRES ON PASSWORD_RESETS(EXPIRES_AT);

CREATE INDEX IDX_REFRESH_TOKENS_USER_ID ON REFRESH_TOKENS(USER_ID);
CREATE INDEX IDX_REFRESH_TOKENS_REVOKED ON REFRESH_TOKENS(REVOKED);

-- ============================================================================
-- PAYMENT INDEXES
-- ============================================================================

CREATE INDEX IDX_PAYMENT_TRANSACTIONS_ORDER_ID ON PAYMENT_TRANSACTIONS(ORDER_ID);
CREATE INDEX IDX_PAYMENT_TRANSACTIONS_USER_ID ON PAYMENT_TRANSACTIONS(USER_ID);
CREATE INDEX IDX_PAYMENT_TRANSACTIONS_STATUS ON PAYMENT_TRANSACTIONS(STATUS);
CREATE INDEX IDX_PAYMENT_TRANSACTIONS_DATE ON PAYMENT_TRANSACTIONS(CREATED_AT DESC);

-- ============================================================================
-- RECOMMENDATION & REVIEW INDEXES
-- ============================================================================

CREATE INDEX IDX_RECOMMENDATIONS_USER_ID ON RECOMMENDATIONS(USER_ID);
CREATE INDEX IDX_RECOMMENDATIONS_PRODUCT_ID ON RECOMMENDATIONS(PRODUCT_ID);

CREATE INDEX IDX_REVIEWS_USER_ID ON REVIEWS(USER_ID);
CREATE INDEX IDX_REVIEWS_PRODUCT_ID ON REVIEWS(PRODUCT_ID);
CREATE INDEX IDX_REVIEWS_RATING ON REVIEWS(RATING);

-- ============================================================================
-- UNIQUE INDEXES (Constraints)
-- ============================================================================

CREATE UNIQUE INDEX UK_USERS_EMAIL ON USERS(LOWER(EMAIL));
CREATE UNIQUE INDEX UK_USERS_USERNAME ON USERS(LOWER(USERNAME));

-- Ensure one cart per user
CREATE UNIQUE INDEX UK_CART_USER_ID ON CART(USER_ID);

-- ============================================================================
-- STATISTICS & HINTS
-- ============================================================================

-- Gather statistics for Oracle optimizer
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS('system', 'USERS');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'ORDERS');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'ORDER_ITEMS');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'CART');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'CART_ITEM');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'SANPHAM');
  DBMS_STATS.GATHER_TABLE_STATS('system', 'PAYMENT_TRANSACTIONS');
END;
/

-- ============================================================================
-- VERIFY INDEXES CREATED
-- ============================================================================

-- Run this query to verify indexes:
/*
SELECT 
  INDEX_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_POSITION,
  UNIQUENESS
FROM USER_IND_COLUMNS
WHERE TABLE_NAME IN ('USERS', 'ORDERS', 'ORDER_ITEMS', 'CART', 'CART_ITEM', 'SANPHAM')
ORDER BY TABLE_NAME, INDEX_NAME;
*/
