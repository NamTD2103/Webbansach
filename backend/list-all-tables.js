const { initializePool, executeQuery, closePool } = require('./config/db');

(async () => {
  try {
    await initializePool();
    const result = await executeQuery(
      `SELECT table_name FROM user_tables ORDER BY table_name`,
      {}
    );
    console.log('\n=== All Tables in Oracle Database ===\n');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.TABLE_NAME}`);
      });
      console.log(`\nTotal tables found: ${result.rows.length}\n`);
    } else {
      console.log('No tables found.\n');
    }
    await closePool();
  } catch(e) { 
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
