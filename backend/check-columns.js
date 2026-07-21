const oracledb = require('oracledb'); require('dotenv').config(); const dbConfig = { user: process.env.DB_USER || 'system', password: process.env.DB_PASSWORD || '123456', connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1' }; (async () => { let connection; try { connection = await oracledb.getConnection(dbConfig); const result = await connection.execute(\
SELECT
COLUMN_NAME
DATA_TYPE
DATA_LENGTH
FROM
USER_TAB_COLUMNS
WHERE
TABLE_NAME
=
USERS
ORDER
BY
COLUMN_ID\); console.log('USERS Table Columns:'); console.log('===================='); result.rows.forEach(row => { console.log('  - ' + row[0] + ': ' + row[1] + (row[2] ? '(' + row[2] + ')' : '')); }); await connection.close(); } catch(err) { console.error('Error:', err.message); } } )();
