const { getConnection } = require('./config/db');

async function createPaymentTable() {
  let connection;
  try {
    connection = await getConnection();
    
    // Create PAYMENT_TRANSACTIONS table with correct syntax
    const createTable = `
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
    `;
    
    try {
      await connection.execute(createTable, {}, { autoCommit: true });
      console.log('✅ PAYMENT_TRANSACTIONS table created successfully');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('✅ PAYMENT_TRANSACTIONS table already exists');
      } else {
        throw e;
      }
    }
    
    // Create REFUND_REQUESTS table
    const createRefundTable = `
      CREATE TABLE REFUND_REQUESTS (
        REFUND_ID VARCHAR2(50) PRIMARY KEY,
        TRANSACTION_ID VARCHAR2(50) NOT NULL,
        ORDER_ID NUMBER NOT NULL,
        AMOUNT NUMBER(10,2) NOT NULL,
        REASON VARCHAR2(500),
        STATUS VARCHAR2(20),
        RESPONSE_DATA CLOB,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_refund_transaction FOREIGN KEY (TRANSACTION_ID) 
          REFERENCES PAYMENT_TRANSACTIONS(TRANSACTION_ID) ON DELETE CASCADE
      )
    `;
    
    try {
      await connection.execute(createRefundTable, {}, { autoCommit: true });
      console.log('✅ REFUND_REQUESTS table created successfully');
    } catch (e) {
      if (e.message.includes('ORA-00955')) {
        console.log('✅ REFUND_REQUESTS table already exists');
      } else {
        throw e;
      }
    }
    
    console.log('\n✅ Payment tables ready!');
    
    connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPaymentTable();
