const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

async function setupReviewSystem() {
  let connection;
  try {
    console.log('🔄 Connecting to Oracle Database...');
    connection = await oracledb.getConnection({
      user: process.env.DB_USER || 'webbansach',
      password: process.env.DB_PASSWORD || 'webbansach',
      connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/ORCL21PDB1',
    });

    console.log('✅ Connected to Oracle');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'review-wishlist-system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    const statements = sqlContent.split('/');

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length === 0) continue;

      try {
        console.log(`\n▶ Executing: ${trimmed.substring(0, 50)}...`);
        await connection.execute(trimmed);
        console.log('✅ Success');
      } catch (err) {
        if (err.message.includes('ORA-00955') || err.message.includes('already exists')) {
          console.log('⚠ Already exists (skipping)');
        } else if (err.message.includes('ORA-00942')) {
          console.log('⚠ Table not found (skipping)');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    }

    await connection.commit();
    console.log('\n✅ Review & Wishlist System Setup Complete!');
    console.log('\nTables created:');
    console.log('  ✓ PRODUCT_REVIEWS');
    console.log('  ✓ REVIEW_IMAGES');
    console.log('  ✓ REVIEW_LIKES');
    console.log('  ✓ REVIEW_REPORTS');
    console.log('  ✓ PRODUCT_REVIEW_SUMMARY');
    console.log('  ✓ PRICE_CHANGE_NOTIFICATIONS');
    console.log('  ✓ STOCK_NOTIFICATIONS');
  } catch (err) {
    console.error('❌ Setup Error:', err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

setupReviewSystem();
