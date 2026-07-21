const { getConnection } = require('./config/db');

async function checkSchema() {
  let connection;
  try {
    connection = await getConnection();
    
    // Get ORDERS table structure
    const query = `
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'ORDERS'
      ORDER BY COLUMN_ID
    `;
    
    const result = await connection.execute(query);
    
    console.log('📋 ORDERS Table Schema:');
    console.log('--------- ------------- ----------');
    result.rows.forEach(row => {
      console.log(`${row[0].padEnd(15)} ${row[1].padEnd(13)} ${row[2]}`);
    });
    
    connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
