const { getConnection } = require('./config/db');

async function addPaymentMethodColumn() {
  let connection;
  try {
    connection = await getConnection();
    
    // Check if PAYMENT_METHOD column exists
    const checkColumn = `
      SELECT COUNT(*) as col_exists 
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'ORDERS' AND COLUMN_NAME = 'PAYMENT_METHOD'
    `;
    
    const result = await connection.execute(checkColumn);
    const columnExists = result.rows[0][0] > 0;
    
    if (columnExists) {
      console.log('✅ PAYMENT_METHOD column already exists');
    } else {
      console.log('📝 Adding PAYMENT_METHOD column to ORDERS table...');
      const addColumn = `
        ALTER TABLE ORDERS 
        ADD (PAYMENT_METHOD VARCHAR2(50))
      `;
      
      await connection.execute(addColumn, {}, { autoCommit: true });
      console.log('✅ PAYMENT_METHOD column added successfully');
    }
    
    connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addPaymentMethodColumn();
