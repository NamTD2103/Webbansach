const { initializePool, executeQuery, closePool } = require('./config/db');

(async () => {
  try {
    await initializePool();
    const result = await executeQuery(`SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = 'USER_ID'`, {});
    console.log('USERS.USER_ID type:', result.rows[0]);
    await closePool();
  } catch(e) { 
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
