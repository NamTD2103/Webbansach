const { executeQuery, initializePool } = require('./config/db');

(async () => {
  try {
    await initializePool();
    const users = await executeQuery("SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USERS' ORDER BY COLUMN_ID", {});
    const orders = await executeQuery("SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'ORDERS' ORDER BY COLUMN_ID", {});
    console.log('USERS columns:', JSON.stringify(users.rows));
    console.log('ORDERS columns:', JSON.stringify(orders.rows));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
