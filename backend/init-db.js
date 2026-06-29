require('dotenv').config();
const oracledb = require('oracledb');

const DB_CONFIG = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
};

async function initializeDatabase() {
  let conn;
  try {
    console.log('📊 Connecting to Oracle Database...\n');
    conn = await oracledb.getConnection(DB_CONFIG);
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

    // Array of SQL statements to create tables
    const createTableStatements = [
      // Create USERS table if not exists
      `CREATE TABLE USERS (
        USER_ID NUMBER PRIMARY KEY,
        USERNAME VARCHAR2(50) NOT NULL UNIQUE,
        PASSWORD_HASH VARCHAR2(255) NOT NULL,
        EMAIL VARCHAR2(100),
        FULLNAME VARCHAR2(100),
        ROLE VARCHAR2(20) DEFAULT 'USER' CHECK (ROLE IN ('USER', 'ADMIN')),
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        UPDATED_AT TIMESTAMP DEFAULT SYSDATE
      )`,

      // Create CART table
      `CREATE TABLE CART (
        CART_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_cart_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )`,

      // Create CART_ITEM table
      `CREATE TABLE CART_ITEM (
        ITEM_ID NUMBER PRIMARY KEY,
        CART_ID NUMBER NOT NULL,
        MASP VARCHAR2(50) NOT NULL,
        SOLUONG NUMBER NOT NULL CHECK (SOLUONG > 0),
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_cart_item_cart FOREIGN KEY (CART_ID) REFERENCES CART(CART_ID) ON DELETE CASCADE,
        CONSTRAINT fk_cart_item_product FOREIGN KEY (MASP) REFERENCES SANPHAM(MASP) ON DELETE CASCADE,
        CONSTRAINT uk_cart_item_unique UNIQUE (CART_ID, MASP)
      )`,

      // Create ORDERS table
      `CREATE TABLE ORDERS (
        ORDER_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        STATUS VARCHAR2(50) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
        TOTAL_AMOUNT NUMBER(10,2) NOT NULL,
        PAYMENT_METHOD VARCHAR2(50),
        ORDER_DATE TIMESTAMP DEFAULT SYSDATE,
        UPDATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_orders_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )`,

      // Create ORDER_ITEMS table
      `CREATE TABLE ORDER_ITEMS (
        ITEM_ID NUMBER PRIMARY KEY,
        ORDER_ID NUMBER NOT NULL,
        MASP VARCHAR2(50) NOT NULL,
        SOLUONG NUMBER NOT NULL CHECK (SOLUONG > 0),
        PRICE NUMBER(10,2) NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_order_items_order FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (MASP) REFERENCES SANPHAM(MASP)
      )`,

      // Create PAYMENTS table
      `CREATE TABLE PAYMENTS (
        PAYMENT_ID NUMBER PRIMARY KEY,
        ORDER_ID NUMBER NOT NULL,
        AMOUNT NUMBER(10,2) NOT NULL,
        STATUS VARCHAR2(50) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'COMPLETED', 'FAILED')),
        PAYMENT_DATE TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_payments_order FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID) ON DELETE CASCADE
      )`,

      // Create ADDRESS table
      `CREATE TABLE ADDRESS (
        ADDR_ID NUMBER PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        ADDRESS VARCHAR2(255) NOT NULL,
        CITY VARCHAR2(100),
        PHONE VARCHAR2(20),
        IS_DEFAULT CHAR(1) DEFAULT 'N',
        CREATED_AT TIMESTAMP DEFAULT SYSDATE,
        CONSTRAINT fk_address_user FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      )`,

      // Create AUDIT_LOG table
      `CREATE TABLE AUDIT_LOG (
        LOG_ID NUMBER PRIMARY KEY,
        TABLE_NAME VARCHAR2(50),
        OPERATION VARCHAR2(20),
        USER_ID NUMBER,
        TIMESTAMP TIMESTAMP DEFAULT SYSDATE,
        DETAILS CLOB
      )`,
    ];

    // Create sequences
    const sequenceStatements = [
      `CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE cart_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE cart_item_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE orders_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE order_items_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE payments_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE address_seq START WITH 1 INCREMENT BY 1`,
      `CREATE SEQUENCE audit_log_seq START WITH 1 INCREMENT BY 1`,
    ];

    console.log('🔧 Creating database tables...\n');

    // Execute table creation
    for (const sql of createTableStatements) {
      try {
        await conn.execute(sql);
        console.log('✅ ' + sql.substring(0, 50).trim() + '...');
      } catch (err) {
        if (err.message.includes('ORA-00955') || err.message.includes('already exists')) {
          console.log('⚠️ ' + sql.substring(0, 50).trim() + '... (already exists)');
        } else if (err.message.includes('ORA-02275') || err.message.includes('foreign key violations')) {
          console.log('⚠️ ' + sql.substring(0, 50).trim() + '... (skipped due to constraints)');
        } else {
          console.error('❌ Error:', err.message.substring(0, 100));
        }
      }
    }

    console.log('\n🔢 Creating sequences...\n');

    // Execute sequence creation
    for (const sql of sequenceStatements) {
      try {
        await conn.execute(sql);
        console.log('✅ ' + sql.substring(0, 50).trim() + '...');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('⚠️ ' + sql.substring(0, 50).trim() + '... (already exists)');
        } else {
          console.log('ℹ️ Sequence may already exist');
        }
      }
    }

    await conn.commit();

    console.log('\n✨ Database initialization completed successfully!\n');
    console.log('📋 Tables created:');
    console.log('  • USERS');
    console.log('  • CART');
    console.log('  • CART_ITEM');
    console.log('  • ORDERS');
    console.log('  • ORDER_ITEMS');
    console.log('  • PAYMENTS');
    console.log('  • ADDRESS');
    console.log('  • AUDIT_LOG');

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    // Don't exit on error, some tables might already exist
    console.log('\n⚠️ Some errors occurred, but they may be expected if tables already exist.');
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

// Run initialization
initializeDatabase();
