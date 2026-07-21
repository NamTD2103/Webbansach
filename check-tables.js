const { getConnection } = require('./config/db');

async function listTables() {
  let connection;
  try {
    connection = await getConnection();
    
    const query = SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME;
    const result = await connection.execute(query);
    
    console.log('📚 Tables in current schema:');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach(row => console.log('  - ' + row[0]));
    } else {
      console.log('No tables found');
    }
    
    connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listTables();
