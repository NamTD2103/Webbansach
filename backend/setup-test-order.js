const oracledb = require('oracledb');
const { getConnection } = require('./config/db');

async function createTestOrder() {
  let connection;
  try {
    connection = await getConnection();
    
    // First check if test order already exists
    const checkOrder = `SELECT COUNT(*) as cnt FROM ORDERS WHERE ORDER_ID = :orderId`;
    const checkResult = await connection.execute(checkOrder, { orderId: 12345 });
    
    if (checkResult.rows[0].CNT > 0) {
      console.log('✅ Test order already exists: ORDER_ID=12345');
    } else {
      // Insert test order
      const insertOrder = `
        INSERT INTO ORDERS (ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, PAYMENT_METHOD, ORDER_DATE, UPDATED_AT)
        VALUES (:orderId, :userId, :status, :amount, :paymentMethod, SYSDATE, SYSDATE)
      `;
      
      const orderId = 12345;
      const userId = 1;
      const amount = 500000;
      
      await connection.execute(insertOrder, 
        { orderId, userId, status: 'PENDING', amount, paymentMethod: 'NOT_PAID' },
        { autoCommit: true }
      );
      
      console.log('✅ Test order created: ORDER_ID=12345');
    }
    
    // Create PAYMENT_TRANSACTIONS table if not exists
    const createTable = `
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE PAYMENT_TRANSACTIONS (
            TRANSACTION_ID VARCHAR2(50) PRIMARY KEY,
            ORDER_ID NUMBER NOT NULL,
            USER_ID NUMBER NOT NULL,
            AMOUNT NUMBER(10,2) NOT NULL,
            STATUS VARCHAR2(20),
            PAYMENT_METHOD VARCHAR2(50),
            BANK_CODE VARCHAR2(20),
            TRANSACTION_DATA CLOB,
            CREATED_AT TIMESTAMP DEFAULT SYSDATE,
            UPDATED_AT TIMESTAMP DEFAULT SYSDATE
          )
        ';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
      /
    `;
    
    try {
      await connection.execute(createTable, {}, { autoCommit: true });
      console.log('✅ PAYMENT_TRANSACTIONS table created');
    } catch (e) {
      console.log('📊 PAYMENT_TRANSACTIONS table check: ' + e.message.substring(0, 50));
    }
    
    console.log('\n✅ Test setup complete!');
    console.log('Now ready to test: POST /api/payment/create-payment-url');
    console.log('With: orderId=12345, userId=1, amount=500000');
    
    connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestOrder();
