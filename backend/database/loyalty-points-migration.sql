/**
 * Loyalty Points & Customer Tier System
 * Database Migration Script
 * 
 * Execute on Oracle Database to add loyalty system
 */

-- ============================================================================
-- 1. ADD COLUMNS TO USERS TABLE
-- ============================================================================

ALTER TABLE USERS ADD (
  LOYALTY_POINTS NUMBER DEFAULT 0,              -- Accumulated loyalty points
  CUSTOMER_TIER VARCHAR2(50) DEFAULT 'BRONZE',  -- BRONZE, SILVER, GOLD, PLATINUM
  TIER_UPDATED_AT TIMESTAMP DEFAULT SYSDATE,    -- When tier was last updated
  LIFETIME_VALUE NUMBER DEFAULT 0,              -- Total money spent
  JOIN_DATE TIMESTAMP DEFAULT SYSDATE           -- When customer joined
);

-- Add comments
COMMENT ON COLUMN USERS.LOYALTY_POINTS IS 'Total accumulated loyalty points (1 point = 1000 VND spent)';
COMMENT ON COLUMN USERS.CUSTOMER_TIER IS 'Customer tier: BRONZE (0-99pts), SILVER (100-499pts), GOLD (500-999pts), PLATINUM (1000+pts)';
COMMENT ON COLUMN USERS.TIER_UPDATED_AT IS 'Last time tier was recalculated';
COMMENT ON COLUMN USERS.LIFETIME_VALUE IS 'Total amount customer has spent (in VND)';
COMMENT ON COLUMN USERS.JOIN_DATE IS 'When customer registered';

-- ============================================================================
-- 2. CREATE LOYALTY_TRANSACTIONS TABLE (audit trail)
-- ============================================================================

CREATE TABLE LOYALTY_TRANSACTIONS (
  TRANSACTION_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  ORDER_ID NUMBER,
  POINTS_EARNED NUMBER,           -- Positive for earn, negative for redemption
  POINTS_BALANCE NUMBER,          -- Balance after transaction
  TRANSACTION_TYPE VARCHAR2(50),  -- 'PURCHASE', 'REDEMPTION', 'BONUS', 'ADJUSTMENT', 'EXPIRY'
  DESCRIPTION VARCHAR2(500),      -- Human-readable description
  REFERENCE_ID NUMBER,            -- ORDER_ID or VOUCHER_ID
  PROCESSED_BY VARCHAR2(100),     -- 'SYSTEM', 'ADMIN' or user email
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_loyalty_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
);

CREATE SEQUENCE loyalty_transactions_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- ============================================================================
-- 3. CREATE CUSTOMER_TIER_BENEFITS TABLE
-- ============================================================================

CREATE TABLE CUSTOMER_TIER_BENEFITS (
  BENEFIT_ID NUMBER PRIMARY KEY,
  TIER_NAME VARCHAR2(50) UNIQUE,              -- BRONZE, SILVER, GOLD, PLATINUM
  POINTS_MIN NUMBER,                          -- Minimum points to achieve
  POINTS_MAX NUMBER,                          -- Maximum points in this tier
  DISCOUNT_PERCENTAGE NUMBER,                 -- Base discount %
  FREE_SHIPPING_THRESHOLD NUMBER,             -- Order value for free shipping
  LOYALTY_POINTS_MULTIPLIER NUMBER(3,2),      -- 1.0 = normal, 1.5 = 1.5x points
  BIRTHDAY_BONUS_POINTS NUMBER,               -- Points given on birthday
  ANNUAL_BONUS_POINTS NUMBER,                 -- Points given on anniversary
  PRIORITY_SUPPORT NUMBER DEFAULT 0,          -- 1 = has priority support
  EXCLUSIVE_OFFERS NUMBER DEFAULT 0,          -- 1 = gets exclusive offers
  SPECIAL_PERKS VARCHAR2(500),                -- Description of perks
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE
);

-- Insert tier definitions
INSERT INTO CUSTOMER_TIER_BENEFITS VALUES (
  1, 'BRONZE', 0, 99, 0, 500000, 1.0, 50, 100, 0, 0, 'Khách hàng mới - tiết kiệm cơ bản', SYSDATE, SYSDATE
);

INSERT INTO CUSTOMER_TIER_BENEFITS VALUES (
  2, 'SILVER', 100, 499, 5, 300000, 1.2, 100, 200, 0, 1, 'Khách hàng quen thuộc - tiết kiệm 5%', SYSDATE, SYSDATE
);

INSERT INTO CUSTOMER_TIER_BENEFITS VALUES (
  3, 'GOLD', 500, 999, 10, 150000, 1.5, 200, 400, 1, 1, 'Khách hàng VIP - tiết kiệm 10% + hỗ trợ ưu tiên', SYSDATE, SYSDATE
);

INSERT INTO CUSTOMER_TIER_BENEFITS VALUES (
  4, 'PLATINUM', 1000, 999999, 15, 0, 2.0, 500, 1000, 1, 1, 'Khách hàng siêu VIP - tiết kiệm 15% + nhiều ưu đãi', SYSDATE, SYSDATE
);

COMMIT;

-- ============================================================================
-- 4. CREATE POINTS_REDEMPTION TABLE (for converting points to vouchers)
-- ============================================================================

CREATE TABLE POINTS_REDEMPTION (
  REDEMPTION_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  POINTS_REDEEMED NUMBER,         -- Points used
  VOUCHER_VALUE NUMBER,           -- ₫ amount received
  REDEMPTION_RATE NUMBER(3,2),    -- How many points = 1000 VND
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  EXPIRES_AT TIMESTAMP,           -- When voucher expires
  STATUS VARCHAR2(50),            -- 'ACTIVE', 'USED', 'EXPIRED'
  CONSTRAINT fk_redemption_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
);

CREATE SEQUENCE points_redemption_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_loyalty_user ON LOYALTY_TRANSACTIONS(USER_ID);
CREATE INDEX idx_loyalty_type ON LOYALTY_TRANSACTIONS(TRANSACTION_TYPE);
CREATE INDEX idx_loyalty_date ON LOYALTY_TRANSACTIONS(CREATED_AT);
CREATE INDEX idx_users_tier ON USERS(CUSTOMER_TIER);
CREATE INDEX idx_users_loyalty_points ON USERS(LOYALTY_POINTS);
CREATE INDEX idx_redemption_user ON POINTS_REDEMPTION(USER_ID);
CREATE INDEX idx_redemption_status ON POINTS_REDEMPTION(STATUS);

-- ============================================================================
-- 6. CREATE STORED PROCEDURE: Calculate and Update Customer Tier
-- ============================================================================

CREATE OR REPLACE PROCEDURE UPDATE_CUSTOMER_TIER(p_user_id IN NUMBER) AS
  v_loyalty_points NUMBER;
  v_new_tier VARCHAR2(50);
  v_old_tier VARCHAR2(50);
BEGIN
  -- Get current loyalty points
  SELECT LOYALTY_POINTS, CUSTOMER_TIER INTO v_loyalty_points, v_old_tier
  FROM USERS
  WHERE USER_ID = p_user_id;

  -- Determine tier based on points
  IF v_loyalty_points >= 1000 THEN
    v_new_tier := 'PLATINUM';
  ELSIF v_loyalty_points >= 500 THEN
    v_new_tier := 'GOLD';
  ELSIF v_loyalty_points >= 100 THEN
    v_new_tier := 'SILVER';
  ELSE
    v_new_tier := 'BRONZE';
  END IF;

  -- Update tier if changed
  IF v_new_tier != v_old_tier THEN
    UPDATE USERS
    SET CUSTOMER_TIER = v_new_tier,
        TIER_UPDATED_AT = SYSDATE
    WHERE USER_ID = p_user_id;

    -- Log the tier change
    INSERT INTO LOYALTY_TRANSACTIONS (
      TRANSACTION_ID, USER_ID, POINTS_EARNED, POINTS_BALANCE,
      TRANSACTION_TYPE, DESCRIPTION, PROCESSED_BY, CREATED_AT
    ) VALUES (
      loyalty_transactions_seq.NEXTVAL,
      p_user_id,
      0,
      v_loyalty_points,
      'ADJUSTMENT',
      'Tier promoted from ' || v_old_tier || ' to ' || v_new_tier,
      'SYSTEM',
      SYSDATE
    );

    COMMIT;
  END IF;
END;
/

-- ============================================================================
-- 7. CREATE STORED PROCEDURE: Add Loyalty Points from Order
-- ============================================================================

CREATE OR REPLACE PROCEDURE ADD_LOYALTY_POINTS_FROM_ORDER(
  p_order_id IN NUMBER,
  p_user_id IN NUMBER,
  p_order_amount IN NUMBER
) AS
  v_loyalty_points NUMBER;
  v_multiplier NUMBER;
  v_points_earned NUMBER;
  v_new_balance NUMBER;
BEGIN
  -- Get loyalty points multiplier based on tier
  SELECT LOYALTY_POINTS_MULTIPLIER INTO v_multiplier
  FROM CUSTOMER_TIER_BENEFITS
  WHERE TIER_NAME = (
    SELECT CUSTOMER_TIER FROM USERS WHERE USER_ID = p_user_id
  );

  -- Calculate points (1000 VND = 1 point * multiplier)
  v_points_earned := FLOOR((p_order_amount / 1000) * COALESCE(v_multiplier, 1));

  -- Get current balance
  SELECT COALESCE(LOYALTY_POINTS, 0) INTO v_loyalty_points
  FROM USERS
  WHERE USER_ID = p_user_id;

  v_new_balance := v_loyalty_points + v_points_earned;

  -- Update user points
  UPDATE USERS
  SET LOYALTY_POINTS = v_new_balance,
      LIFETIME_VALUE = LIFETIME_VALUE + p_order_amount
  WHERE USER_ID = p_user_id;

  -- Log transaction
  INSERT INTO LOYALTY_TRANSACTIONS (
    TRANSACTION_ID, USER_ID, ORDER_ID, POINTS_EARNED, POINTS_BALANCE,
    TRANSACTION_TYPE, DESCRIPTION, PROCESSED_BY, CREATED_AT
  ) VALUES (
    loyalty_transactions_seq.NEXTVAL,
    p_user_id,
    p_order_id,
    v_points_earned,
    v_new_balance,
    'PURCHASE',
    'Points earned from order ' || p_order_id || ' (Amount: ' || p_order_amount || ' VND)',
    'SYSTEM',
    SYSDATE
  );

  -- Update tier if needed
  UPDATE_CUSTOMER_TIER(p_user_id);

  COMMIT;
END;
/

-- ============================================================================
-- 8. SAMPLE QUERIES FOR VERIFICATION
-- ============================================================================

-- Check if columns were added
SELECT * FROM USER_TAB_COLS WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME IN ('LOYALTY_POINTS', 'CUSTOMER_TIER', 'LIFETIME_VALUE');

-- Verify tables created
SELECT * FROM USER_TABLES WHERE TABLE_NAME IN ('LOYALTY_TRANSACTIONS', 'CUSTOMER_TIER_BENEFITS', 'POINTS_REDEMPTION');

-- View tier benefits
SELECT * FROM CUSTOMER_TIER_BENEFITS ORDER BY POINTS_MIN;

-- Check user loyalty status
SELECT USER_ID, USERNAME, LOYALTY_POINTS, CUSTOMER_TIER, LIFETIME_VALUE, TIER_UPDATED_AT
FROM USERS
ORDER BY LOYALTY_POINTS DESC;

-- ✅ MIGRATION COMPLETE
-- Execute: sqlplus system/password@localhost:1521/orcl21pdb1 < database/loyalty-points-migration.sql
