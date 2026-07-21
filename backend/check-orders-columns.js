const { initializePool, executeQuery, closePool } = require('./config/db');

(async () => {
  try {
    await initializePool();
    const result = await executeQuery(`SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'ORDERS'`, {});
    console.log('ORDERS table columns:');
    result.rows?.forEach(row => {
      console.log(`  - ${row.COLUMN_NAME}`);
    });
    await closePool();
  } catch(e) { 
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
