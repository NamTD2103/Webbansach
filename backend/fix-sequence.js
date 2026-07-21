const { getConnection } = require('./config/db');

async function checkOrdersAndSequence() {
  let connection;
  try {
    connection = await getConnection();
    
    // Get sequence value
    const seqResult = await connection.execute(
      `SELECT orders_seq.NEXTVAL as next_id FROM DUAL`
    );
    console.log(`📊 Next sequence value: ${seqResult.rows[0][0]}`);
    
    // Get max order ID
    const maxResult = await connection.execute(
      `SELECT MAX(ORDER_ID) as max_id FROM ORDERS`
    );
    console.log(`📊 Max ORDER_ID in table: ${maxResult.rows[0][0]}`);
    
    // List all order IDs
    const listResult = await connection.execute(
      `SELECT ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT FROM ORDERS ORDER BY ORDER_ID DESC`
    );
    
    console.log(`\n📋 Orders in database (${listResult.rows.length} total):`);
    listResult.rows.forEach(row => {
      console.log(`  ORDER_ID: ${row[0]}, USER_ID: ${row[1]}, STATUS: ${row[2]}, AMOUNT: ${row[3]}`);
    });
    
    // Fix sequence if needed
    const nextId = seqResult.rows[0][0];
    const maxId = maxResult.rows[0][0];
    
    if (maxId && nextId <= maxId) {
      console.log(`\n⚠️ Sequence issue detected! Max ID (${maxId}) >= Next ID (${nextId})`);
      console.log('🔧 Resetting sequence...');
      
      const resetSeq = await connection.execute(
        `DROP SEQUENCE orders_seq`,
        {},
        { autoCommit: true }
      );
      
      const createNewSeq = await connection.execute(
        `CREATE SEQUENCE orders_seq START WITH ${maxId + 1} INCREMENT BY 1`,
        {},
        { autoCommit: true }
      );
      
      console.log(`✅ Sequence reset to start with ${maxId + 1}`);
    }
    
    connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrdersAndSequence();
