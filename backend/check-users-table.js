/**
 * Check USERS table structure
 */
const { executeQuery } = require('./config/db');
const { initializePool } = require('./config/db');

async function checkUsersSchema() {
  try {
    await initializePool();

    console.log('\n📋 Checking USERS table structure...\n');

    // Get table columns information
    const result = await executeQuery(`
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USERS'
      ORDER BY COLUMN_ID
    `, {});

    if (result.rows && result.rows.length > 0) {
      console.log('✅ USERS table columns:');
      console.table(result.rows.map(row => ({
        Column: row.COLUMN_NAME,
        Type: row.DATA_TYPE,
        Nullable: row.NULLABLE,
        Default: row.DATA_DEFAULT || 'None',
      })));
    } else {
      console.log('❌ USERS table not found');
    }

    // Also check for any row in the table
    const usersResult = await executeQuery(`
      SELECT COUNT(*) as COUNT FROM USERS
    `, {});

    if (usersResult.rows && usersResult.rows.length > 0) {
      console.log(`\n📊 Total users in database: ${usersResult.rows[0].COUNT}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersSchema();
