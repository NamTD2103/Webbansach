/**
 * Book Recommendation System Schema
 * Supports intelligent book suggestions, user preferences tracking, and learning
 */

-- ======================== BOOK METADATA TABLE ========================
-- Enhanced product info for recommendation engine
CREATE TABLE BOOK_METADATA (
  METADATA_ID NUMBER PRIMARY KEY,
  MASP VARCHAR2(50) NOT NULL UNIQUE,
  
  -- Content Classification
  CATEGORY_PRIMARY VARCHAR2(100),        -- e.g., "Kinh doanh", "Self-Help", "Công nghệ"
  CATEGORY_SECONDARY VARCHAR2(100),      -- Secondary category
  READING_DIFFICULTY VARCHAR2(50),       -- 'DỄ', 'TRUNG_BÌNH', 'NÂNG_CAO'
  
  -- Metadata
  AUTHOR_NAME VARCHAR2(255),
  PUBLISHER_NAME VARCHAR2(255),
  PUBLICATION_YEAR NUMBER,
  PAGE_COUNT NUMBER,
  ESTIMATED_READ_TIME_HOURS NUMBER,     -- Rough reading time
  
  -- Content tags
  TOPICS CLOB,                           -- JSON: ["motivation", "productivity", "personal-growth"]
  KEYWORDS CLOB,                         -- JSON: comma-separated keywords
  TARGET_AUDIENCE VARCHAR2(100),        -- "Students", "Professionals", "General", "Children"
  
  -- Quality metrics
  AVERAGE_RATING NUMBER(3,2),            -- 1-5 stars (from users)
  REVIEW_COUNT NUMBER,
  BESTSELLER_RANK NUMBER,                -- 1-100 if bestseller
  
  -- Recommendation boost
  RECOMMENDATION_SCORE NUMBER(3,2),      -- 0-1, how good for recommendation
  IS_TRENDING NUMBER DEFAULT 0,
  IS_NEW_RELEASE NUMBER DEFAULT 0,
  
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_metadata_product FOREIGN KEY (MASP) 
    REFERENCES SANPHAM(MASP)
);

CREATE INDEX idx_metadata_category ON BOOK_METADATA(CATEGORY_PRIMARY);
CREATE INDEX idx_metadata_difficulty ON BOOK_METADATA(READING_DIFFICULTY);
CREATE INDEX idx_metadata_author ON BOOK_METADATA(AUTHOR_NAME);
CREATE INDEX idx_metadata_trending ON BOOK_METADATA(IS_TRENDING);

-- ======================== USER BOOK PREFERENCES TABLE ========================
-- Track what genres, authors, difficulty levels user prefers
CREATE TABLE USER_BOOK_PREFERENCES (
  PREF_ID NUMBER PRIMARY KEY,
  USER_ID VARCHAR2(50) NOT NULL UNIQUE,
  
  -- Favorite categories
  FAVORITE_CATEGORIES CLOB,              -- JSON: [{category, weight, last_mentioned}]
  DISLIKED_CATEGORIES CLOB,              -- JSON: Categories to avoid
  
  -- Authors
  FAVORITE_AUTHORS CLOB,                 -- JSON array
  DISLIKED_AUTHORS CLOB,                 -- JSON array
  
  -- Difficulty preference
  PREFERRED_DIFFICULTY VARCHAR2(50),     -- 'DỄ', 'TRUNG_BÌNH', 'NÂNG_CAO', 'MIXED'
  
  -- Reading goals
  READING_GOAL_BOOKS_PER_MONTH NUMBER DEFAULT 0,
  READING_MOTIVATION VARCHAR2(50),       -- 'LEARNING', 'ENTERTAINMENT', 'PERSONAL_GROWTH', 'MIXED'
  
  -- Price sensitivity
  PRICE_RANGE_MIN NUMBER,
  PRICE_RANGE_MAX NUMBER,
  
  -- Target audience match
  PREFERRED_TARGET_AUDIENCE VARCHAR2(100),
  
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_pref_user FOREIGN KEY (USER_ID) 
    REFERENCES CHATBOT_USER_PROFILE(USER_ID)
);

CREATE INDEX idx_pref_user ON USER_BOOK_PREFERENCES(USER_ID);
CREATE INDEX idx_pref_category ON USER_BOOK_PREFERENCES(FAVORITE_CATEGORIES);

-- ======================== BOOK READING HISTORY TABLE ========================
-- Track user interactions with books
CREATE TABLE BOOK_READING_HISTORY (
  HISTORY_ID NUMBER PRIMARY KEY,
  USER_ID VARCHAR2(50) NOT NULL,
  MASP VARCHAR2(50) NOT NULL,
  
  -- Interaction type
  INTERACTION_TYPE VARCHAR2(50),         -- 'VIEWED', 'SEARCHED', 'ADDED_CART', 'PURCHASED', 'REVIEWED'
  
  -- Status
  STATUS VARCHAR2(50),                   -- 'READING', 'COMPLETED', 'WISHLIST', 'BROWSED'
  PERSONAL_RATING NUMBER(3,2),           -- User's personal rating (1-5)
  USER_REVIEW CLOB,                      -- User's review text
  
  -- Reading progress (if applicable)
  PAGES_READ NUMBER,
  START_DATE TIMESTAMP,
  COMPLETION_DATE TIMESTAMP,
  
  -- Interaction metadata
  VIEW_DURATION_SECONDS NUMBER,          -- How long they looked at product
  IN_SEARCH_CONTEXT VARCHAR2(200),      -- What query led to this book?
  CLICKED_FROM_RECOMMENDATION VARCHAR2(50), -- If from recommendation, which one?
  
  INTERACTION_DATE TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_history_user FOREIGN KEY (USER_ID) 
    REFERENCES CHATBOT_USER_PROFILE(USER_ID),
  CONSTRAINT fk_history_product FOREIGN KEY (MASP) 
    REFERENCES SANPHAM(MASP)
);

CREATE INDEX idx_history_user ON BOOK_READING_HISTORY(USER_ID);
CREATE INDEX idx_history_masp ON BOOK_READING_HISTORY(MASP);
CREATE INDEX idx_history_type ON BOOK_READING_HISTORY(INTERACTION_TYPE);
CREATE INDEX idx_history_status ON BOOK_READING_HISTORY(STATUS);
CREATE INDEX idx_history_date ON BOOK_READING_HISTORY(INTERACTION_DATE);

-- ======================== BOOK RECOMMENDATIONS TABLE ========================
-- Stores recommendations generated for each user
CREATE TABLE BOOK_RECOMMENDATIONS (
  REC_ID NUMBER PRIMARY KEY,
  USER_ID VARCHAR2(50) NOT NULL,
  MASP VARCHAR2(50) NOT NULL,
  
  -- Recommendation details
  RECOMMENDATION_TYPE VARCHAR2(50),      -- 'PERSONALIZED', 'TRENDING', 'SIMILAR', 'NEW_RELEASE', 'BESTSELLER'
  REASON CLOB,                           -- Why we recommend this (for UI display)
  
  -- Matching score
  MATCH_SCORE NUMBER(5,4),               -- 0-1, how well book matches user preferences
  CONFIDENCE_LEVEL NUMBER(3,2),          -- 0-1, confidence in recommendation
  
  -- Ranking
  RANK_POSITION NUMBER,                  -- Position in recommendation list (1, 2, 3...)
  
  -- Status tracking
  IS_SHOWN NUMBER DEFAULT 1,             -- Was recommendation shown to user?
  SHOWN_AT TIMESTAMP,
  CLICKED NUMBER DEFAULT 0,              -- Did user click on recommendation?
  CLICKED_AT TIMESTAMP,
  PURCHASED NUMBER DEFAULT 0,            -- Did user purchase?
  PURCHASED_AT TIMESTAMP,
  
  -- Feedback
  USER_FEEDBACK VARCHAR2(50),            -- 'HELPFUL', 'NOT_HELPFUL', 'ALREADY_PURCHASED', NULL
  FEEDBACK_AT TIMESTAMP,
  
  GENERATED_AT TIMESTAMP DEFAULT SYSDATE,
  EXPIRES_AT TIMESTAMP,                  -- When recommendation becomes irrelevant
  
  CONSTRAINT fk_rec_user FOREIGN KEY (USER_ID) 
    REFERENCES CHATBOT_USER_PROFILE(USER_ID),
  CONSTRAINT fk_rec_product FOREIGN KEY (MASP) 
    REFERENCES SANPHAM(MASP)
);

CREATE INDEX idx_rec_user ON BOOK_RECOMMENDATIONS(USER_ID);
CREATE INDEX idx_rec_masp ON BOOK_RECOMMENDATIONS(MASP);
CREATE INDEX idx_rec_type ON BOOK_RECOMMENDATIONS(RECOMMENDATION_TYPE);
CREATE INDEX idx_rec_shown ON BOOK_RECOMMENDATIONS(IS_SHOWN);
CREATE INDEX idx_rec_clicked ON BOOK_RECOMMENDATIONS(CLICKED);
CREATE INDEX idx_rec_purchased ON BOOK_RECOMMENDATIONS(PURCHASED);
CREATE INDEX idx_rec_expires ON BOOK_RECOMMENDATIONS(EXPIRES_AT);

-- ======================== RECOMMENDATION FEEDBACK TABLE ========================
-- Detailed feedback on recommendations
CREATE TABLE RECOMMENDATION_FEEDBACK (
  FEEDBACK_ID NUMBER PRIMARY KEY,
  REC_ID NUMBER NOT NULL,
  USER_ID VARCHAR2(50) NOT NULL,
  
  -- Feedback type
  FEEDBACK_TYPE VARCHAR2(50),            -- 'HELPFUL', 'NOT_HELPFUL', 'ALREADY_OWN', 'NOT_INTERESTED', 'WILL_CONSIDER'
  DETAILED_REASON CLOB,                  -- Why user gave this feedback
  
  -- Context
  FEEDBACK_SENTIMENT VARCHAR2(50),       -- 'POSITIVE', 'NEUTRAL', 'NEGATIVE'
  
  FEEDBACK_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_feedback_rec FOREIGN KEY (REC_ID) 
    REFERENCES BOOK_RECOMMENDATIONS(REC_ID),
  CONSTRAINT fk_feedback_user FOREIGN KEY (USER_ID) 
    REFERENCES CHATBOT_USER_PROFILE(USER_ID)
);

CREATE INDEX idx_feedback_rec ON RECOMMENDATION_FEEDBACK(REC_ID);
CREATE INDEX idx_feedback_user ON RECOMMENDATION_FEEDBACK(USER_ID);
CREATE INDEX idx_feedback_type ON RECOMMENDATION_FEEDBACK(FEEDBACK_TYPE);

-- ======================== SIMILAR BOOKS TABLE ========================
-- Pre-computed book similarities for faster recommendations
CREATE TABLE SIMILAR_BOOKS (
  SIMILARITY_ID NUMBER PRIMARY KEY,
  BOOK_ID_1 VARCHAR2(50) NOT NULL,
  BOOK_ID_2 VARCHAR2(50) NOT NULL,
  
  -- Similarity metrics
  SIMILARITY_SCORE NUMBER(5,4),          -- 0-1
  REASON CLOB,                           -- Why similar (shared category, author style, etc.)
  
  COMPUTED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT fk_sim_book1 FOREIGN KEY (BOOK_ID_1) 
    REFERENCES SANPHAM(MASP),
  CONSTRAINT fk_sim_book2 FOREIGN KEY (BOOK_ID_2) 
    REFERENCES SANPHAM(MASP)
);

CREATE INDEX idx_sim_book1 ON SIMILAR_BOOKS(BOOK_ID_1);
CREATE INDEX idx_sim_book2 ON SIMILAR_BOOKS(BOOK_ID_2);
CREATE INDEX idx_sim_score ON SIMILAR_BOOKS(SIMILARITY_SCORE DESC);

-- ======================== RECOMMENDATION ANALYTICS TABLE ========================
-- Track recommendation system performance
CREATE TABLE RECOMMENDATION_ANALYTICS (
  ANALYTIC_ID NUMBER PRIMARY KEY,
  DATE_TRACKED DATE NOT NULL,
  RECOMMENDATION_TYPE VARCHAR2(50),
  
  -- Volume metrics
  TOTAL_RECOMMENDATIONS NUMBER DEFAULT 0,
  UNIQUE_USERS_RECOMMENDED NUMBER DEFAULT 0,
  
  -- Engagement metrics
  SHOWN_COUNT NUMBER DEFAULT 0,
  CLICKED_COUNT NUMBER DEFAULT 0,
  CLICK_THROUGH_RATE NUMBER(5,4),
  
  -- Conversion metrics
  PURCHASED_COUNT NUMBER DEFAULT 0,
  CONVERSION_RATE NUMBER(5,4),
  TOTAL_REVENUE NUMBER,
  AVERAGE_ORDER_VALUE NUMBER,
  
  -- Feedback metrics
  HELPFUL_FEEDBACK_COUNT NUMBER DEFAULT 0,
  NOT_HELPFUL_FEEDBACK_COUNT NUMBER DEFAULT 0,
  SATISFACTION_SCORE NUMBER(3,2),
  
  -- Performance
  AVERAGE_TIME_TO_PURCHASE_HOURS NUMBER,
  
  CREATED_AT TIMESTAMP DEFAULT SYSDATE,
  CONSTRAINT uq_analytic_date_type UNIQUE (DATE_TRACKED, RECOMMENDATION_TYPE)
);

CREATE INDEX idx_analytic_date ON RECOMMENDATION_ANALYTICS(DATE_TRACKED);
CREATE INDEX idx_analytic_type ON RECOMMENDATION_ANALYTICS(RECOMMENDATION_TYPE);

-- ======================== SEQUENCES ========================
CREATE SEQUENCE book_metadata_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE user_pref_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE reading_history_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE recommendation_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE recommendation_feedback_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE similar_books_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE recommendation_analytic_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
