const oracledb = require('oracledb');

// Environment variables
const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123456',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl21pdb1',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT || '1'),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '60'), // 60s idle timeout
  queueTimeout: parseInt(process.env.DB_QUEUE_TIMEOUT || '60000'), // 60s queue timeout
  stmtCacheSize: parseInt(process.env.DB_STMT_CACHE || '30'),
  poolPingInterval: parseInt(process.env.DB_PING_INTERVAL || '60'), // 60s ping
};

// Global config
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB]; // ✅ TỰ ĐỘNG CHUYỂN CLOB → STRING

let pool;
let isInitialized = false;

/**
 * Initialize connection pool
 */
async function initializePool() {
  try {
    if (pool && isInitialized) {
      console.log('ℹ️ Pool already initialized');
      return pool;
    }

    // Validate config
    if (!dbConfig.user || !dbConfig.password || !dbConfig.connectString) {
      throw new Error('Missing DB credentials in environment variables');
    }

    console.log('🔄 Initializing Oracle Connection Pool...');
    console.log(`📊 Config: ${dbConfig.poolMin}-${dbConfig.poolMax} connections`);

    pool = await oracledb.createPool({
      ...dbConfig,
      // Production settings
      homogeneous: true,
      queueMax: 500,
      poolTimeout: dbConfig.poolTimeout,
      queueTimeout: dbConfig.queueTimeout,
      stmtCacheSize: dbConfig.stmtCacheSize,
      poolPingInterval: dbConfig.poolPingInterval,
      // Connection validation
      pingInterval: dbConfig.poolPingInterval,
      // SSL (optional)
      ssl: process.env.DB_SSL === 'true',
    });

    isInitialized = true;
    console.log('✅ Oracle Connection Pool Ready!');
    console.log(`📈 Pool Status: ${pool.poolMin}-${pool.poolMax}`);
    
    return pool;
  } catch (err) {
    console.error('❌ Pool initialization failed:', err.message);
    console.error('💡 Check: DB credentials, Oracle service, port 1521');
    process.exit(1);
  }
}

/**
 * Get database connection
 */
async function getConnection() {
  try {
    if (!pool || !isInitialized) {
      await initializePool();
    }
    return await pool.getConnection();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

/**
 * Execute SELECT query
 */
async function executeQuery(sql, binds = {}, options = {}) {
  let conn;
  try {
    conn = await getConnection();

    // Debug logging (production: disable)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🔍 SQL:', sql);
      console.log('📦 BINDS:', binds);
    }

    const result = await conn.execute(sql, binds, {
      ...options,
      maxRows: options.maxRows || 1000,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 Rows: ${result.rows?.length || 0}`);
    }

    return result;
  } catch (err) {
    console.error('❌ QUERY ERROR:', err.message);
    console.error('💻 SQL:', sql);
    console.error('📦 BINDS:', binds);
    throw new Error(`Query failed: ${err.message}`);
  } finally {
    if (conn) {
      try {
        await conn.close();
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔓 Connection released');
        }
      } catch (closeErr) {
        console.error('❌ Connection close error:', closeErr);
      }
    }
  }
}

/**
 * Execute INSERT/UPDATE/DELETE
 */
async function executeUpdate(sql, binds = {}) {
  let conn;
  try {
    conn = await getConnection();

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n✏️ UPDATE SQL:', sql);
      console.log('📦 BINDS:', binds);
    }

    const result = await conn.execute(sql, binds, {
      autoCommit: true,
      maxRows: 10000,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Affected rows: ${result.rowsAffected || 0}`);
    }

    return result;
  } catch (err) {
    console.error('❌ UPDATE ERROR:', err.message);
    console.error('💻 SQL:', sql);
    throw new Error(`Update failed: ${err.message}`);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('❌ Connection close error:', closeErr);
      }
    }
  }
}

/**
 * Execute transaction
 */
async function executeTransaction(operations) {
  let conn;
  try {
    conn = await getConnection();
    
    for (const op of operations) {
      await conn.execute(op.sql, op.binds || {}, { autoCommit: false });
    }
    
    await conn.commit();
    return { success: true };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) await conn.close();
  }
}

/**
 * Close pool gracefully
 */
async function closePool({ force = false } = {}) {
  try {
    if (pool) {
      console.log('🔄 Closing connection pool...');
      await pool.close(force ? 1 : 10); // 10s timeout
      console.log('✅ Connection pool closed');
      pool = null;
      isInitialized = false;
    }
  } catch (err) {
    console.error('❌ Pool close error:', err);
  }
}

/**
 * Get pool status
 */
async function getPoolStatus() {
  if (!pool) return { status: 'not_initialized' };
  
  const status = await pool._enableStats;
  return {
    status: 'active',
    connections: pool.poolMin + '-' + pool.poolMax,
    busy: status.numBusyConns || 0,
    available: status.numAvailConns || 0,
    requests: status.requests || 0,
  };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received...');
  await closePool();
  process.exit(0);
});

module.exports = {
  initializePool,
  getConnection,
  executeQuery,
  executeUpdate,
  executeTransaction,
  closePool,
  getPoolStatus,
};