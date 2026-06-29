  require('dotenv').config();
  const oracledb = require('oracledb');

  async function test() {
    try {
      console.log('🔍 Checking SANPHAM product data with HINHANH and MOTA...\n');

      const conn = await oracledb.getConnection({
        user: process.env.DB_USER || 'system',
        password: process.env.DB_PASSWORD || '123456',
        connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
      });

      // Get products with image and description
      const result = await conn.execute(`
        SELECT MASP, TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC
        FROM SANPHAM
        ORDER BY TENSP ASC
      `);

      console.log(`Total products: ${result.rows.length}\n`);
      result.rows.forEach((row, idx) => {
        const mota = row[5] ? String(row[5]).substring(0, 50) : '(NULL)';
        console.log(`${idx + 1}. ${row[0]} | ${row[1]}`);
        console.log(`   Price: ${row[2]} | Stock: ${row[3]}`);
        console.log(`   Image: ${row[4] || '(NULL)'}`);
        console.log(`   Description: ${mota}`);
        console.log(`   Supplier: ${row[6]}\n`);
      });

      await conn.close();
    } catch (err) {
      console.error('❌ Error:', err.message);
      console.error(err);
    }
  }

  test();
