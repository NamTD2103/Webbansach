const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};

(async () => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    
    // Create sequences if they don't exist
    const sequences = ['USER_SEQ', 'TOKEN_SEQ', 'VERIFICATION_SEQ', 'ATTEMPT_SEQ', 'SANPHAM_SEQ', 'ORDER_ITEMS_SEQ', 'ORDERS_SEQ'];
    
    for (const seq of sequences) {
      try {
        await conn.execute(`DROP SEQUENCE ${seq}`);
        console.log('Dropped:', seq);
      } catch (e) {}
      
      try {
        await conn.execute(`CREATE SEQUENCE ${seq} START WITH 1 INCREMENT BY 1`);
        console.log('Created:', seq);
      } catch (e) {
        console.log('Error creating', seq, ':', e.message);
      }
    }
    
    console.log('✅ Sequences initialized');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
})();
