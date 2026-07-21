/**
 * Database Migration - Order Cancellation System
 * Adds necessary columns and tables for order cancellation, refund, and stock recovery
 * 
 * Execute this script on Oracle Database
 */

-- ============================================================================
-- 1. ADD COLUMNS TO ORDERS TABLE (for cancellation tracking)
-- ============================================================================

ALTER TABLE ORDERS ADD (
  CANCELLED_BY VARCHAR2(50),           -- 'ADMIN' or 'CUSTOMER'
  CANCELLED_AT TIMESTAMP,              -- When order was cancelled
  CANCELLATION_REASON VARCHAR2(500),   -- Reason for cancellation
  REFUND_STATUS VARCHAR2(50),          -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  REFUND_AMOUNT NUMBER,                -- Amount to refund
  REFUND_METHOD VARCHAR2(50),          -- 'ORIGINAL_PAYMENT', 'WALLET', 'BANK_TRANSFER'
  REFUND_PROCESSED_AT TIMESTAMP        -- When refund was processed
);

-- Add comments
COMMENT ON COLUMN ORDERS.CANCELLED_BY IS 'Who cancelled: ADMIN or CUSTOMER';
COMMENT ON COLUMN ORDERS.CANCELLED_AT IS 'Timestamp of cancellation';
COMMENT ON COLUMN ORDERS.CANCELLATION_REASON IS 'Reason why order was cancelled';
COMMENT ON COLUMN ORDERS.REFUND_STATUS IS 'Status of refund: PENDING, PROCESSING, COMPLETED, FAILED';
COMMENT ON COLUMN ORDERS.REFUND_AMOUNT IS 'Amount to be refunded to customer';
COMMENT ON COLUMN ORDERS.REFUND_METHOD IS 'How to refund: back to original payment method or wallet';
COMMENT ON COLUMN ORDERS.REFUND_PROCESSED_AT IS 'When refund was actually processed';

-- ============================================================================
-- 2. CREATE REFUND_TRANSACTIONS TABLE (for tracking all refunds)
-- ============================================================================

CREATE TABLE REFUND_TRANSACTIONS (
  REFUND_ID NUMBER PRIMARY KEY,
  ORDER_ID NUMBER NOT NULL,
  USER_ID NUMBER NOT NULL,
  ORIGINAL_PAYMENT_METHOD VARCHAR2(50),
  REFUND_AMOUNT NUMBER NOT NULL,
  REFUND_METHOD VARCHAR2(50) NOT NULL,      -- How to refund
  STATUS VARCHAR2(50) NOT NULL,              -- PENDING, PROCESSING, COMPLETED, FAILED
  REASON VARCHAR2(500),
  PROCESSED_BY VARCHAR2(100),                -- Admin user who processed
  TRANSACTION_HASH VARCHAR2(500),            -- Hash from payment gateway
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  PROCESSED_AT TIMESTAMP,
  ERROR_MESSAGE VARCHAR2(500),               -- If failed, why
  CONSTRAINT fk_refund_order FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID),
  CONSTRAINT fk_refund_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
);

-- Create sequence for refund IDs
CREATE SEQUENCE refund_transactions_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- ============================================================================
-- 3. CREATE STOCK_HISTORY TABLE (for auditing stock changes)
-- ============================================================================

CREATE TABLE STOCK_HISTORY (
  STOCK_HISTORY_ID NUMBER PRIMARY KEY,
  MASP VARCHAR2(50) NOT NULL,
  ACTION VARCHAR2(50),                -- 'REDUCE' (order), 'RESTORE' (cancel), 'ADJUST' (admin)
  QUANTITY_CHANGED NUMBER,            -- Positive or negative
  NEW_QUANTITY NUMBER,                -- Quantity after change
  REFERENCE_TYPE VARCHAR2(50),        -- 'ORDER_ID', 'ADMIN_ADJUSTMENT'
  REFERENCE_ID NUMBER,
  CHANGED_BY VARCHAR2(100),
  REASON VARCHAR2(500),
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_stock_product FOREIGN KEY (MASP) REFERENCES SANPHAM(MASP)
);

CREATE SEQUENCE stock_history_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- ============================================================================
-- 4. UPDATE ORDER STATUS VALUES (add CANCELLED option)
-- ============================================================================

-- Note: Status values are: PENDING, PAID, PROCESSING, COMPLETED, CANCELLED
-- Your application should support these values

-- ============================================================================
-- 5. CREATE AUDIT INDEX FOR BETTER QUERY PERFORMANCE
-- ============================================================================

CREATE INDEX idx_orders_cancelled ON ORDERS(CANCELLED_AT);
CREATE INDEX idx_orders_refund_status ON ORDERS(REFUND_STATUS);
CREATE INDEX idx_refund_transactions_status ON REFUND_TRANSACTIONS(STATUS);
CREATE INDEX idx_stock_history_masp ON STOCK_HISTORY(MASP);
CREATE INDEX idx_stock_history_date ON STOCK_HISTORY(CREATED_AT);

-- ============================================================================
-- 6. SAMPLE VALIDATION (Check if data exists)
-- ============================================================================

-- Check if columns were added successfully
SELECT * FROM USER_TAB_COLS WHERE TABLE_NAME = 'ORDERS' AND COLUMN_NAME IN ('CANCELLED_BY', 'REFUND_STATUS');

-- Verify tables were created
SELECT * FROM USER_TABLES WHERE TABLE_NAME IN ('REFUND_TRANSACTIONS', 'STOCK_HISTORY');

-- ✅ MIGRATION COMPLETE
-- Run this from d:\webbansach\backend directory:
-- sqlplus system/password@localhost:1521/orcl21pdb1 < database/order-cancellation-migration.sql
