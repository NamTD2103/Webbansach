/**
 * Chatbot Database Schema
 * Tables for storing conversations, messages, learning data, and user preferences
 */

-- Create sequences for chatbot tables
CREATE SEQUENCE chatbot_conversation_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE chatbot_message_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE chatbot_learning_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- ======================== CONVERSATIONS TABLE ========================
-- Stores conversation metadata between user and chatbot
CREATE TABLE CHATBOT_CONVERSATIONS (
  CONVERSATION_ID NUMBER PRIMARY KEY,
  USER_ID VARCHAR2(50) NOT NULL,  -- Can be numeric ID (user) or string (anonymous)
  SESSION_TOKEN VARCHAR2(100),
  TOTAL_MESSAGES NUMBER DEFAULT 0,
  LAST_MESSAGE_AT TIMESTAMP,
  SATISFIED_FLAG NUMBER DEFAULT 0, -- 0: Not set, 1: Satisfied, -1: Not satisfied
  FEEDBACK_TEXT VARCHAR2(1000),
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE
  -- Removed FK constraint to allow anonymous users
);

CREATE INDEX idx_conversation_user ON CHATBOT_CONVERSATIONS(USER_ID);
CREATE INDEX idx_conversation_created ON CHATBOT_CONVERSATIONS(CREATED_AT);
CREATE INDEX idx_conversation_satisfied ON CHATBOT_CONVERSATIONS(SATISFIED_FLAG);

-- ======================== MESSAGES TABLE ========================
-- ======================== MESSAGES TABLE ========================
-- Stores individual messages in conversations
CREATE TABLE CHATBOT_MESSAGES (
  MESSAGE_ID NUMBER PRIMARY KEY,
  CONVERSATION_ID NUMBER NOT NULL,
  USER_ID VARCHAR2(50) NOT NULL,  -- Can be numeric ID or string (anonymous)
  MESSAGE_TYPE VARCHAR2(20), -- 'user' or 'bot'
  CONTENT CLOB NOT NULL,
  INTENT VARCHAR2(50), -- FAQ, PRODUCT_SUGGESTION, ORDER_SUPPORT, PAYMENT, etc.
  CONFIDENCE_SCORE NUMBER(3,2), -- 0.00 to 1.00
  RESPONSE_TIME_MS NUMBER, -- Time taken to respond (ms)
  IS_HELPFUL NUMBER DEFAULT 0, -- 0: Not rated, 1: Helpful, -1: Not helpful
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_msg_conversation FOREIGN KEY (CONVERSATION_ID) 
    REFERENCES CHATBOT_CONVERSATIONS(CONVERSATION_ID)
);

CREATE INDEX idx_message_conversation ON CHATBOT_MESSAGES(CONVERSATION_ID);
CREATE INDEX idx_message_user ON CHATBOT_MESSAGES(USER_ID);
CREATE INDEX idx_message_intent ON CHATBOT_MESSAGES(INTENT);
CREATE INDEX idx_message_type ON CHATBOT_MESSAGES(MESSAGE_TYPE);
CREATE INDEX idx_message_created ON CHATBOT_MESSAGES(CREATED_AT);

-- ======================== USER PREFERENCES TABLE ========================
-- Stores learned preferences for each user
CREATE TABLE CHATBOT_USER_PREFERENCES (
  PREFERENCE_ID NUMBER PRIMARY KEY,
  USER_ID VARCHAR2(50) NOT NULL,  -- Link to registered users only
  CATEGORY_INTEREST VARCHAR2(100), -- Favorite book categories
  PRICE_RANGE VARCHAR2(50), -- e.g., "100000-500000", "500000-1000000"
  FAVORITE_AUTHORS CLOB, -- Comma-separated
  INTERACTION_COUNT NUMBER DEFAULT 0, -- How many times user interacted
  LAST_INTEREST_UPDATE TIMESTAMP,
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
  UNIQUE (USER_ID)
);

CREATE INDEX idx_preference_user ON CHATBOT_USER_PREFERENCES(USER_ID);

-- ======================== LEARNING DATA TABLE ========================
-- Stores FAQ, common questions, and learned patterns
CREATE TABLE CHATBOT_LEARNING (
  LEARNING_ID NUMBER PRIMARY KEY,
  QUESTION_PATTERN VARCHAR2(500), -- Pattern of the question
  CATEGORY VARCHAR2(50), -- FAQ, PRODUCT, ORDER, PAYMENT, SHIPPING
  RESPONSE_TEMPLATE CLOB, -- Template response
  FREQUENCY NUMBER DEFAULT 1, -- How many times this question appeared
  AVERAGE_RATING NUMBER(3,2), -- Average user satisfaction (0-1)
  IS_ACTIVE NUMBER DEFAULT 1, -- 0: Disabled, 1: Active
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
  LAST_USED_AT TIMESTAMP
);

CREATE INDEX idx_learning_category ON CHATBOT_LEARNING(CATEGORY);
CREATE INDEX idx_learning_frequency ON CHATBOT_LEARNING(FREQUENCY DESC);
CREATE INDEX idx_learning_active ON CHATBOT_LEARNING(IS_ACTIVE);

-- ======================== QUICK RESPONSES TABLE ========================
-- Pre-defined quick responses for common scenarios
CREATE TABLE CHATBOT_QUICK_RESPONSES (
  RESPONSE_ID NUMBER PRIMARY KEY,
  TRIGGER_KEYWORDS CLOB, -- Comma-separated keywords
  RESPONSE_TEXT CLOB,
  CATEGORY VARCHAR2(50),
  PRIORITY NUMBER DEFAULT 5, -- 1-10, higher = more priority
  USAGE_COUNT NUMBER DEFAULT 0,
  IS_ACTIVE NUMBER DEFAULT 1,
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE
);

CREATE INDEX idx_quick_response_category ON CHATBOT_QUICK_RESPONSES(CATEGORY);
CREATE INDEX idx_quick_response_active ON CHATBOT_QUICK_RESPONSES(IS_ACTIVE);

-- ======================== SEED DATA ========================
-- Common FAQ responses
INSERT INTO CHATBOT_LEARNING (LEARNING_ID, QUESTION_PATTERN, CATEGORY, RESPONSE_TEMPLATE, FREQUENCY, AVERAGE_RATING, IS_ACTIVE)
VALUES (chatbot_learning_seq.NEXTVAL, 'thanh toán|payment method', 'PAYMENT', 
  'Chúng tôi hỗ trợ 2 phương thức thanh toán:\n1. COD (Thanh toán khi nhận hàng)\n2. Chuyển khoản ngân hàng', 2, 0.95, 1);

INSERT INTO CHATBOT_LEARNING (LEARNING_ID, QUESTION_PATTERN, CATEGORY, RESPONSE_TEMPLATE, FREQUENCY, AVERAGE_RATING, IS_ACTIVE)
VALUES (chatbot_learning_seq.NEXTVAL, 'vận chuyển|shipping|delivery', 'SHIPPING',
  'Thời gian giao hàng:\n- Hà Nội/TP.HCM: 2-3 ngày\n- Tỉnh thành: 3-5 ngày\nPhí vận chuyển: Miễn phí từ 200.000đ', 3, 0.92, 1);

INSERT INTO CHATBOT_LEARNING (LEARNING_ID, QUESTION_PATTERN, CATEGORY, RESPONSE_TEMPLATE, FREQUENCY, AVERAGE_RATING, IS_ACTIVE)
VALUES (chatbot_learning_seq.NEXTVAL, 'hoàn|refund|return', 'ORDER',
  'Chính sách hoàn hàng:\n- 7 ngày từ khi nhận hàng\n- Sách chưa sử dụng, nguyên vẹn\n- Liên hệ admin để xử lý', 2, 0.88, 1);

COMMIT;
