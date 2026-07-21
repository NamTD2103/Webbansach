/**
 * Setup Profile System
 * Creates all necessary database tables for user profile dashboard
 */

const { initializePool, closePool, executeUpdate } = require('./config/db');

const setupDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await initializePool();
    console.log('✅ Connected to database\n');

    // Table creation statements
    const tables = [
      // USER_READING_ANALYTICS
      `CREATE TABLE USER_READING_ANALYTICS (
        ANALYTIC_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL UNIQUE,
        TOTAL_BOOKS_VIEWED NUMBER DEFAULT 0,
        TOTAL_BOOKS_PURCHASED NUMBER DEFAULT 0,
        TOTAL_BOOKS_REVIEWED NUMBER DEFAULT 0,
        TOTAL_SPENT NUMBER DEFAULT 0,
        FAVORITE_CATEGORY_1 VARCHAR2(100),
        FAVORITE_CATEGORY_1_COUNT NUMBER DEFAULT 0,
        FAVORITE_CATEGORY_2 VARCHAR2(100),
        FAVORITE_CATEGORY_2_COUNT NUMBER DEFAULT 0,
        FAVORITE_CATEGORY_3 VARCHAR2(100),
        FAVORITE_CATEGORY_3_COUNT NUMBER DEFAULT 0,
        AVERAGE_RATING_GIVEN NUMBER(3,2),
        REVIEW_COUNT NUMBER DEFAULT 0,
        WISHLIST_COUNT NUMBER DEFAULT 0,
        LAST_PURCHASE_DATE TIMESTAMP,
        DAYS_SINCE_PURCHASE NUMBER,
        PEAK_ACTIVITY_DAY VARCHAR2(20),
        PEAK_ACTIVITY_HOUR NUMBER(2),
        AVERAGE_SESSION_DURATION_MINUTES NUMBER,
        PREFERRED_DIFFICULTY VARCHAR2(50),
        READING_SPEED VARCHAR2(50),
        PREFERS_EBOOKS NUMBER DEFAULT 0,
        PREFERS_PHYSICAL NUMBER DEFAULT 0,
        IS_ACTIVE NUMBER DEFAULT 1,
        CHURN_RISK NUMBER(3,2) DEFAULT 0,
        LIFETIME_VALUE NUMBER,
        ENGAGEMENT_SCORE NUMBER(3,2),
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_analytics_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_LOGIN_HISTORY
      `CREATE TABLE USER_LOGIN_HISTORY (
        LOGIN_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        LOGIN_TIME TIMESTAMP DEFAULT SYSDATE,
        IP_ADDRESS VARCHAR2(45),
        DEVICE_TYPE VARCHAR2(50),
        BROWSER_NAME VARCHAR2(100),
        BROWSER_VERSION VARCHAR2(50),
        LOGIN_STATUS VARCHAR2(50),
        FAILURE_REASON VARCHAR2(200),
        SESSION_DURATION_MINUTES NUMBER,
        LAST_ACTIVITY TIMESTAMP,
        CONSTRAINT fk_login_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_SECURITY_SETTINGS
      `CREATE TABLE USER_SECURITY_SETTINGS (
        SECURITY_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL UNIQUE,
        TWO_FA_ENABLED NUMBER DEFAULT 0,
        TWO_FA_METHOD VARCHAR2(50),
        TWO_FA_SECRET VARCHAR2(200),
        TWO_FA_LAST_VERIFIED TIMESTAMP,
        PASSWORD_LAST_CHANGED TIMESTAMP,
        PASSWORD_CHANGE_REQUIRED NUMBER DEFAULT 0,
        PROFILE_VISIBILITY VARCHAR2(50),
        SHOW_PURCHASE_HISTORY NUMBER DEFAULT 1,
        SHOW_READING_PREFERENCES NUMBER DEFAULT 1,
        NOTIFICATION_EMAIL NUMBER DEFAULT 1,
        NOTIFICATION_PUSH NUMBER DEFAULT 0,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_security_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_WISHLIST
      `CREATE TABLE USER_WISHLIST (
        WISHLIST_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        MASP VARCHAR2(50) NOT NULL,
        PRIORITY VARCHAR2(20),
        REASON VARCHAR2(500),
        PRICE_ALERT_ENABLED NUMBER DEFAULT 0,
        ALERT_PRICE NUMBER,
        IS_ACTIVE NUMBER DEFAULT 1,
        ADDED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_wishlist_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_BOOK_REVIEWS
      `CREATE TABLE USER_BOOK_REVIEWS (
        REVIEW_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        MASP VARCHAR2(50) NOT NULL,
        RATING NUMBER(2,1),
        REVIEW_TEXT VARCHAR2(1000),
        HELPFUL_COUNT NUMBER DEFAULT 0,
        UNHELPFUL_COUNT NUMBER DEFAULT 0,
        VERIFIED_PURCHASE NUMBER DEFAULT 0,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_review_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_PROFILE_COMPLETENESS
      `CREATE TABLE USER_PROFILE_COMPLETENESS (
        COMPLETE_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL UNIQUE,
        HAS_AVATAR NUMBER DEFAULT 0,
        HAS_BIO NUMBER DEFAULT 0,
        HAS_PREFERENCES NUMBER DEFAULT 0,
        HAS_REVIEWS NUMBER DEFAULT 0,
        HAS_ADDRESS NUMBER DEFAULT 0,
        COMPLETION_PERCENTAGE NUMBER,
        LAST_UPDATED TIMESTAMP,
        CONSTRAINT fk_complete_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_NOTIFICATIONS
      `CREATE TABLE USER_NOTIFICATIONS (
        NOTIF_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        NOTIF_TYPE VARCHAR2(50),
        TITLE VARCHAR2(200),
        CONTENT VARCHAR2(500),
        IS_READ NUMBER DEFAULT 0,
        ACTION_URL VARCHAR2(200),
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_notif_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`,

      // USER_AI_INSIGHTS
      `CREATE TABLE USER_AI_INSIGHTS (
        INSIGHT_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL UNIQUE,
        READING_STYLE VARCHAR2(500),
        FAVORITE_GENRE_INSIGHT VARCHAR2(500),
        READING_PACE_INSIGHT VARCHAR2(500),
        ACTIVITY_PATTERN VARCHAR2(500),
        PEAK_TIME_INSIGHT VARCHAR2(500),
        SPENDING_PATTERN VARCHAR2(500),
        ALL_INSIGHTS VARCHAR2(2000),
        INSIGHT_CONFIDENCE NUMBER(3,2),
        GENERATED_AT TIMESTAMP,
        CONSTRAINT fk_insights_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID)
      )`
    ];

    console.log(`📊 Creating ${tables.length} tables...\n`);

    for (let i = 0; i < tables.length; i++) {
      try {
        console.log(`[${i + 1}/${tables.length}] Creating table...`);
        await executeUpdate(tables[i], {});
        console.log(`  ✅ Success\n`);
      } catch (error) {
        if (error.message.includes('ORA-00955')) {
          console.log(`  ℹ️  Table already exists\n`);
        } else {
          console.log(`  ⚠️  ${error.message}\n`);
        }
      }
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX idx_analytics_user ON USER_READING_ANALYTICS(USER_ID)`,
      `CREATE INDEX idx_analytics_category ON USER_READING_ANALYTICS(FAVORITE_CATEGORY_1)`,
      `CREATE INDEX idx_login_user ON USER_LOGIN_HISTORY(USER_ID)`,
      `CREATE INDEX idx_login_date ON USER_LOGIN_HISTORY(LOGIN_TIME DESC)`,
      `CREATE INDEX idx_login_status ON USER_LOGIN_HISTORY(LOGIN_STATUS)`,
      `CREATE INDEX idx_security_user ON USER_SECURITY_SETTINGS(USER_ID)`,
      `CREATE INDEX idx_wishlist_user ON USER_WISHLIST(USER_ID)`,
      `CREATE INDEX idx_wishlist_active ON USER_WISHLIST(IS_ACTIVE)`,
      `CREATE INDEX idx_review_user ON USER_BOOK_REVIEWS(USER_ID)`,
      `CREATE INDEX idx_review_masp ON USER_BOOK_REVIEWS(MASP)`,
      `CREATE INDEX idx_notif_user ON USER_NOTIFICATIONS(USER_ID)`,
      `CREATE INDEX idx_notif_read ON USER_NOTIFICATIONS(IS_READ)`,
      `CREATE INDEX idx_insights_user ON USER_AI_INSIGHTS(USER_ID)`
    ];

    console.log(`📊 Creating ${indexes.length} indexes...\n`);

    for (let i = 0; i < indexes.length; i++) {
      try {
        console.log(`[${i + 1}/${indexes.length}] Creating index...`);
        await executeUpdate(indexes[i], {});
        console.log(`  ✅ Success\n`);
      } catch (error) {
        if (error.message.includes('ORA-01408')) {
          console.log(`  ℹ️  Index already exists\n`);
        } else {
          console.log(`  ⚠️  ${error.message}\n`);
        }
      }
    }

    console.log('✅ Profile system setup complete!');
    console.log('\n📌 Database tables created:');
    console.log('  ✓ USER_READING_ANALYTICS');
    console.log('  ✓ USER_LOGIN_HISTORY');
    console.log('  ✓ USER_SECURITY_SETTINGS');
    console.log('  ✓ USER_WISHLIST');
    console.log('  ✓ USER_BOOK_REVIEWS');
    console.log('  ✓ USER_PROFILE_COMPLETENESS');
    console.log('  ✓ USER_NOTIFICATIONS');
    console.log('  ✓ USER_AI_INSIGHTS');
    console.log('\n🎉 You can now use the profile dashboard!');

    await closePool();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
