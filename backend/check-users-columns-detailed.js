const { initializePool, executeQuery, closePool } = require('./config/db');

(async () => {
  try {
    await initializePool();
    const result = await executeQuery(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE 
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'USERS' 
       ORDER BY COLUMN_ID`,
      {}
    );
    console.log('\n=== USERS Table Schema ===\n');
    result.rows?.forEach(row => {
      let type = row.DATA_TYPE;
      if (row.DATA_PRECISION) {
        type += `(${row.DATA_PRECISION}${row.DATA_SCALE ? ',' + row.DATA_SCALE : ''})`;
      } else if (row.DATA_LENGTH) {
        type += `(${row.DATA_LENGTH})`;
      }
      const nullable = row.NULLABLE === 'Y' ? 'NULL' : 'NOT NULL';
      console.log(`${row.COLUMN_NAME}: ${type} ${nullable}`);
    });
    console.log('\n');
    await closePool();
  } catch(e) { 
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
