/**
 * Initialize Authentication System with Oracle Database
 * Creates all necessary tables for production-grade auth system
 */
const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
};

async function initializeAuthSystem() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Connected to Oracle Database');

    // Disable autocommit so we can rollback on error
    connection.autoCommit = false;

    // Drop existing tables (optional - for development)
    const tablesToDrop = [
      'LOGIN_ATTEMPTS',
      'PASSWORD_RESETS',
      'EMAIL_VERIFICATIONS',
      'REFRESH_TOKENS',
      'USERS'
    ];

    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE ${table} PURGE`);
        console.log(`🗑️  Dropped table: ${table}`);
      } catch (err) {
        // Table doesn't exist, continue
      }
    }

    // 1. Create USERS table
    console.log('\n📋 Creating USERS table...');
    await connection.execute(`
      CREATE TABLE USERS (
        USER_ID NUMBER PRIMARY KEY,
        EMAIL VARCHAR2(255) NOT NULL UNIQUE,
        USERNAME VARCHAR2(100) NOT NULL UNIQUE,
        PASSWORD_HASH VARCHAR2(500) NOT NULL,
        PHONE VARCHAR2(20),
        FULL_NAME VARCHAR2(200),
        STATUS VARCHAR2(50) DEFAULT 'PENDING' NOT NULL,
        EMAIL_VERIFIED NUMBER(1) DEFAULT 0,
        PHONE_VERIFIED NUMBER(1) DEFAULT 0,
        ACCOUNT_LOCKED NUMBER(1) DEFAULT 0,
        LOCKED_UNTIL TIMESTAMP,
        FAILED_LOGIN_ATTEMPTS NUMBER DEFAULT 0,
        LAST_LOGIN TIMESTAMP,
        LAST_PASSWORD_CHANGE TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ROLE VARCHAR2(50) DEFAULT 'USER'
      )
    `);
    console.log('✅ USERS table created');

    // Create sequence for USER_ID
    try {
      await connection.execute('DROP SEQUENCE USER_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE USER_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ USER_SEQ sequence created');

    // 2. Create REFRESH_TOKENS table
    console.log('\n📋 Creating REFRESH_TOKENS table...');
    await connection.execute(`
      CREATE TABLE REFRESH_TOKENS (
        TOKEN_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        REFRESH_TOKEN VARCHAR2(1000) NOT NULL UNIQUE,
        ACCESS_TOKEN_HASH VARCHAR2(500),
        EXPIRES_AT TIMESTAMP NOT NULL,
        IS_REVOKED NUMBER(1) DEFAULT 0,
        DEVICE_INFO VARCHAR2(500),
        IP_ADDRESS VARCHAR2(45),
        USER_AGENT VARCHAR2(500),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        LAST_USED_AT TIMESTAMP,
        CONSTRAINT FK_RT_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )
    `);
    console.log('✅ REFRESH_TOKENS table created');

    // Create sequence for TOKEN_ID
    try {
      await connection.execute('DROP SEQUENCE TOKEN_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE TOKEN_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ TOKEN_SEQ sequence created');

    // Create index for better query performance
    await connection.execute('CREATE INDEX IDX_RT_USER ON REFRESH_TOKENS(USER_ID)');
    await connection.execute('CREATE INDEX IDX_RT_TOKEN ON REFRESH_TOKENS(REFRESH_TOKEN)');

    // 3. Create EMAIL_VERIFICATIONS table
    console.log('\n📋 Creating EMAIL_VERIFICATIONS table...');
    await connection.execute(`
      CREATE TABLE EMAIL_VERIFICATIONS (
        VERIFICATION_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        VERIFICATION_CODE VARCHAR2(100) NOT NULL,
        EMAIL VARCHAR2(255) NOT NULL,
        EXPIRES_AT TIMESTAMP NOT NULL,
        IS_VERIFIED NUMBER(1) DEFAULT 0,
        VERIFIED_AT TIMESTAMP,
        ATTEMPTS NUMBER DEFAULT 0,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_EV_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )
    `);
    console.log('✅ EMAIL_VERIFICATIONS table created');

    // Create sequence
    try {
      await connection.execute('DROP SEQUENCE VERIFICATION_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE VERIFICATION_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ VERIFICATION_SEQ sequence created');

    // Create index
    await connection.execute('CREATE INDEX IDX_EV_USER ON EMAIL_VERIFICATIONS(USER_ID)');
    await connection.execute('CREATE INDEX IDX_EV_CODE ON EMAIL_VERIFICATIONS(VERIFICATION_CODE)');

    // 4. Create PASSWORD_RESETS table
    console.log('\n📋 Creating PASSWORD_RESETS table...');
    await connection.execute(`
      CREATE TABLE PASSWORD_RESETS (
        RESET_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        RESET_TOKEN VARCHAR2(500) NOT NULL UNIQUE,
        EMAIL VARCHAR2(255) NOT NULL,
        EXPIRES_AT TIMESTAMP NOT NULL,
        IS_USED NUMBER(1) DEFAULT 0,
        USED_AT TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_PR_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )
    `);
    console.log('✅ PASSWORD_RESETS table created');

    // Create sequence
    try {
      await connection.execute('DROP SEQUENCE RESET_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE RESET_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ RESET_SEQ sequence created');

    // Create index
    await connection.execute('CREATE INDEX IDX_PR_USER ON PASSWORD_RESETS(USER_ID)');
    await connection.execute('CREATE INDEX IDX_PR_TOKEN ON PASSWORD_RESETS(RESET_TOKEN)');

    // 5. Create LOGIN_ATTEMPTS table (for rate limiting)
    console.log('\n📋 Creating LOGIN_ATTEMPTS table...');
    await connection.execute(`
      CREATE TABLE LOGIN_ATTEMPTS (
        ATTEMPT_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER,
        EMAIL VARCHAR2(255),
        IP_ADDRESS VARCHAR2(45),
        IS_SUCCESSFUL NUMBER(1) DEFAULT 0,
        FAILURE_REASON VARCHAR2(255),
        ATTEMPTED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_LA_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )
    `);
    console.log('✅ LOGIN_ATTEMPTS table created');

    // Create sequence
    try {
      await connection.execute('DROP SEQUENCE ATTEMPT_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE ATTEMPT_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ ATTEMPT_SEQ sequence created');

    // Create indexes for query performance
    await connection.execute('CREATE INDEX IDX_LA_USER ON LOGIN_ATTEMPTS(USER_ID)');
    await connection.execute('CREATE INDEX IDX_LA_EMAIL ON LOGIN_ATTEMPTS(EMAIL)');
    await connection.execute('CREATE INDEX IDX_LA_IP ON LOGIN_ATTEMPTS(IP_ADDRESS)');
    await connection.execute('CREATE INDEX IDX_LA_TIME ON LOGIN_ATTEMPTS(ATTEMPTED_AT)');

    // 6. Create PHONE_VERIFICATIONS table (for OTP)
    console.log('\n📋 Creating PHONE_VERIFICATIONS table...');
    await connection.execute(`
      CREATE TABLE PHONE_VERIFICATIONS (
        VERIFICATION_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        PHONE VARCHAR2(20) NOT NULL,
        OTP_CODE VARCHAR2(10) NOT NULL,
        EXPIRES_AT TIMESTAMP NOT NULL,
        IS_VERIFIED NUMBER(1) DEFAULT 0,
        VERIFIED_AT TIMESTAMP,
        ATTEMPTS NUMBER DEFAULT 0,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_PV_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )
    `);
    console.log('✅ PHONE_VERIFICATIONS table created');

    // Create sequence
    try {
      await connection.execute('DROP SEQUENCE PHONE_VERIFICATION_SEQ');
    } catch (err) {}
    await connection.execute('CREATE SEQUENCE PHONE_VERIFICATION_SEQ START WITH 1 INCREMENT BY 1');
    console.log('✅ PHONE_VERIFICATION_SEQ sequence created');

    // Create indexes
    await connection.execute('CREATE INDEX IDX_PV_USER ON PHONE_VERIFICATIONS(USER_ID)');
    await connection.execute('CREATE INDEX IDX_PV_PHONE ON PHONE_VERIFICATIONS(PHONE)');

    // Commit all changes
    await connection.commit();
    console.log('\n✅ All tables created successfully!');

    // Insert sample data for testing
    console.log('\n📌 Inserting sample data...');
    const sampleQuery = `
      INSERT INTO USERS (USER_ID, EMAIL, USERNAME, PASSWORD_HASH, PHONE, FULL_NAME, STATUS, EMAIL_VERIFIED, ROLE)
      VALUES (USER_SEQ.NEXTVAL, 'admin@example.com', 'admin', :passwordHash, '0123456789', 'Administrator', 'ACTIVE', 1, 'ADMIN')
    `;
    
    // Note: You should hash this password in real scenario
    await connection.execute(sampleQuery, { passwordHash: 'sample_hash_here' });
    await connection.commit();
    console.log('✅ Sample data inserted');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AUTHENTICATION SYSTEM INITIALIZED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('📊 Tables created:');
    console.log('  ✓ USERS');
    console.log('  ✓ REFRESH_TOKENS');
    console.log('  ✓ EMAIL_VERIFICATIONS');
    console.log('  ✓ PHONE_VERIFICATIONS');
    console.log('  ✓ PASSWORD_RESETS');
    console.log('  ✓ LOGIN_ATTEMPTS');
    console.log('\n💡 Next steps:');
    console.log('  1. Update .env with your database credentials');
    console.log('  2. Run: npm install (to install new dependencies)');
    console.log('  3. Create auth utilities and middleware');
    console.log('  4. Update auth routes');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Error initializing auth system:', err.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr.message);
      }
    }
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Close error:', closeErr.message);
      }
    }
    oracledb.shutdown();
    process.exit(0);
  }
}

// Run initialization
console.log('🚀 Starting Authentication System Initialization...\n');
initializeAuthSystem();
