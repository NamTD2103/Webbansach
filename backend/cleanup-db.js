const oracledb = require('oracledb');
require('dotenv').config();

const DB_CONFIG = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
};

async function cleanupAndReset() {
  let connection;
  try {
    connection = await oracledb.getConnection(DB_CONFIG);
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    console.log('🔍 Checking current orders...');
    const listResult = await connection.execute(
      `SELECT COUNT(*) as cnt FROM ORDERS`
    );
    
    const count = listResult.rows[0].CNT;
    console.log(`📊 Current orders in database: ${count}`);
    
    if (count > 0) {
      console.log('🗑️ Deleting old test orders...');
      await connection.execute(
        `DELETE FROM ORDERS WHERE USER_ID = 6 OR USER_ID = 1`,
        {},
        { autoCommit: true }
      );
      console.log('✅ Test orders cleaned');
    }
    
    // Drop and recreate sequence
    console.log('🔧 Resetting sequence...');
    try {
      await connection.execute(`DROP SEQUENCE orders_seq`);
      console.log('✅ Old sequence dropped');
    } catch (e) {
      console.log('ℹ️ Sequence may not exist');
    }
    
    await connection.execute(
      `CREATE SEQUENCE orders_seq START WITH 1000 INCREMENT BY 1`,
      {},
      { autoCommit: true }
    );
    console.log('✅ Sequence created starting at 1000');
    
    // Verify
    const testSeq = await connection.execute(
      `SELECT orders_seq.NEXTVAL as id FROM DUAL`
    );
    console.log(`✅ Next order ID will be: ${testSeq.rows[0].ID}`);
    
    connection.close();
    console.log('\n✨ Database cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupAndReset();
