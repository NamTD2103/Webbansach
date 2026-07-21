/**
 * Migrate existing PASSWORD column to PASSWORD_HASH with bcrypt hashing
 */
const oracledb = require('oracledb');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
};

async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function migratePasswords() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // ✅ Set output format to return objects with column names
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    console.log('✅ Connected to Oracle Database\n');

    // Get all users with PASSWORD but no PASSWORD_HASH
    const result = await connection.execute(
      `SELECT USER_ID, USERNAME, PASSWORD 
       FROM USERS 
       WHERE PASSWORD IS NOT NULL 
       AND (PASSWORD_HASH IS NULL OR PASSWORD_HASH = '')`
    );

    const usersToMigrate = result.rows || [];
    console.log(`📊 Found ${usersToMigrate.length} users to migrate\n`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users to migrate!');
      return;
    }

    for (const user of usersToMigrate) {
      try {
        const plainPassword = user.PASSWORD;
        const userId = user.USER_ID;
        const username = user.USERNAME;
        
        if (!plainPassword) {
          console.log(`⏭️  Skipping user: ${username} (no password value)`);
          continue;
        }

        const hashedPassword = await hashPassword(plainPassword);
        
        await connection.execute(
          `UPDATE USERS SET PASSWORD_HASH = :passwordHash WHERE USER_ID = :userId`,
          {
            passwordHash: hashedPassword,
            userId: userId
          },
          { autoCommit: false }
        );

        console.log(`✅ Migrated user: ${username} (ID: ${userId})`);
      } catch (error) {
        console.error(`❌ Error migrating user:`, error.message);
      }
    }

    await connection.commit();
    console.log('\n✅ All passwords migrated successfully!');

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

migratePasswords();
