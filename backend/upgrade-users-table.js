/**
 * Alter USERS table to add missing columns for auth system
 */
const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
};

async function upgradeUsersTable() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Connected to Oracle Database\n');

    // List of columns to add if they don't exist
    const columnsToAdd = [
      { name: 'PASSWORD_HASH', type: 'VARCHAR2(500)', test: 'SELECT PASSWORD_HASH FROM USERS WHERE 1=0' },
      { name: 'PHONE', type: 'VARCHAR2(20)', test: 'SELECT PHONE FROM USERS WHERE 1=0' },
      { name: 'FULL_NAME', type: 'VARCHAR2(200)', test: 'SELECT FULL_NAME FROM USERS WHERE 1=0' },
      { name: 'STATUS', type: 'VARCHAR2(50) DEFAULT \'ACTIVE\'', test: 'SELECT STATUS FROM USERS WHERE 1=0' },
      { name: 'EMAIL_VERIFIED', type: 'NUMBER(1) DEFAULT 0', test: 'SELECT EMAIL_VERIFIED FROM USERS WHERE 1=0' },
      { name: 'PHONE_VERIFIED', type: 'NUMBER(1) DEFAULT 0', test: 'SELECT PHONE_VERIFIED FROM USERS WHERE 1=0' },
      { name: 'ACCOUNT_LOCKED', type: 'NUMBER(1) DEFAULT 0', test: 'SELECT ACCOUNT_LOCKED FROM USERS WHERE 1=0' },
      { name: 'LOCKED_UNTIL', type: 'TIMESTAMP', test: 'SELECT LOCKED_UNTIL FROM USERS WHERE 1=0' },
      { name: 'FAILED_LOGIN_ATTEMPTS', type: 'NUMBER DEFAULT 0', test: 'SELECT FAILED_LOGIN_ATTEMPTS FROM USERS WHERE 1=0' },
      { name: 'LAST_LOGIN', type: 'TIMESTAMP', test: 'SELECT LAST_LOGIN FROM USERS WHERE 1=0' },
      { name: 'LAST_PASSWORD_CHANGE', type: 'TIMESTAMP', test: 'SELECT LAST_PASSWORD_CHANGE FROM USERS WHERE 1=0' },
      { name: 'CREATED_AT', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', test: 'SELECT CREATED_AT FROM USERS WHERE 1=0' },
      { name: 'UPDATED_AT', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', test: 'SELECT UPDATED_AT FROM USERS WHERE 1=0' },
    ];

    console.log('🔄 Checking and adding missing columns...\n');

    for (const col of columnsToAdd) {
      try {
        // Test if column exists
        await connection.execute(col.test);
        console.log(`✅ Column exists: ${col.name}`);
      } catch (error) {
        if (error.message.includes('column not found')) {
          // Column doesn't exist, add it
          try {
            await connection.execute(`ALTER TABLE USERS ADD ${col.name} ${col.type}`);
            console.log(`✨ Added column: ${col.name}`);
          } catch (addError) {
            console.log(`⚠️  Could not add ${col.name}: ${addError.message}`);
          }
        }
      }
    }

    // Handle PASSWORD → PASSWORD_HASH migration
    try {
      const result = await connection.execute(
        'SELECT COUNT(*) as cnt FROM USER_TAB_COLUMNS WHERE TABLE_NAME = \'USERS\' AND COLUMN_NAME = \'PASSWORD\''
      );
      const hasOldPassword = result.rows[0].cnt > 0;
      
      if (hasOldPassword) {
        // Check if we need to copy data
        const checkResult = await connection.execute(
          'SELECT COUNT(*) as cnt FROM USERS WHERE PASSWORD_HASH IS NULL AND PASSWORD IS NOT NULL'
        );
        
        if (checkResult.rows[0].cnt > 0) {
          console.log('\n🔄 Migrating PASSWORD to PASSWORD_HASH...');
          // Copy PASSWORD to PASSWORD_HASH for existing users
          await connection.execute(
            'UPDATE USERS SET PASSWORD_HASH = PASSWORD WHERE PASSWORD_HASH IS NULL'
          );
          console.log('✅ PASSWORD data migrated to PASSWORD_HASH');
        }
      }
    } catch (err) {
      console.log('⚠️  Migration check skipped:', err.message);
    }

    await connection.commit();
    console.log('\n✅ All updates committed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Connection close error:', closeError.message);
      }
    }
  }
}

upgradeUsersTable();
