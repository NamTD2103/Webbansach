/**
 * ORDER CANCELLATION API ROUTES
 * Handles order cancellation, stock recovery, and refund processing
 * 
 * File: backend/routes/order-cancellation.js
 * 
 * Endpoints:
 * - POST /api/order/:orderId/cancel (Customer cancels their own order)
 * - POST /api/admin/orders/:orderId/cancel (Admin cancels any order)
 * - GET /api/admin/refunds (View all refunds)
 * - GET /api/admin/stock-history (View stock change history)
 */

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate, getConnection } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const oracledb = require('oracledb');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Recover stock for all items in an order
 * @param {Connection} connection - Oracle connection
 * @param {number} orderId - Order ID
 * @returns {Promise} Result of stock recovery
 */
async function recoverOrderStock(connection, orderId) {
  try {
    console.log(`[STOCK RECOVERY] Starting stock recovery for order ${orderId}`);

    // Get all order items
    const itemsQuery = `
      SELECT ITEM_ID, MASP, SOLUONG, PRICE
      FROM ORDER_ITEMS
      WHERE ORDER_ID = :orderId
    `;

    const itemsResult = await connection.execute(itemsQuery, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false
    });

    if (!itemsResult.rows || itemsResult.rows.length === 0) {
      console.log(`[STOCK RECOVERY] No items found for order ${orderId}`);
      return { success: true, itemsRecovered: 0 };
    }

    // Restore stock for each item
    let itemsRecovered = 0;
    for (const item of itemsResult.rows) {
      const { MASP, SOLUONG } = item;

      console.log(`[STOCK RECOVERY] Restoring ${SOLUONG} units for product ${MASP}`);

      // Update product stock
      const updateStockQuery = `
        UPDATE SANPHAM
        SET SOLUONGTON = SOLUONGTON + :soluong
        WHERE MASP = :masp
      `;

      await connection.execute(updateStockQuery, {
        soluong: SOLUONG,
        masp: MASP
      }, { autoCommit: false });

      // Record in stock history
      const historySeqResult = await connection.execute(
        'SELECT stock_history_seq.NEXTVAL as ID FROM DUAL',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
      );

      const historyId = historySeqResult.rows[0].ID;

      const historyQuery = `
        INSERT INTO STOCK_HISTORY (STOCK_HISTORY_ID, MASP, ACTION, QUANTITY_CHANGED, NEW_QUANTITY, REFERENCE_TYPE, REFERENCE_ID, CHANGED_BY, REASON, CREATED_AT)
        SELECT :historyId, :masp, 'RESTORE', :qty, 
               (SELECT SOLUONGTON FROM SANPHAM WHERE MASP = :masp),
               'ORDER_CANCELLATION', :orderId, 'SYSTEM', 'Order cancelled - stock restored', SYSDATE
        FROM DUAL
      `;

      await connection.execute(historyQuery, {
        historyId,
        masp: MASP,
        qty: SOLUONG,
        orderId
      }, { autoCommit: false });

      itemsRecovered++;
    }

    console.log(`[STOCK RECOVERY] ✅ Successfully recovered stock for ${itemsRecovered} items`);
    return { success: true, itemsRecovered };

  } catch (error) {
    console.error('[STOCK RECOVERY ERROR]', error.message);
    throw error;
  }
}

/**
 * Process refund for a cancelled order
 * @param {Connection} connection - Oracle connection
 * @param {Object} order - Order object
 * @param {number} userId - User ID
 * @returns {Promise} Refund transaction details
 */
async function processRefund(connection, order, userId) {
  try {
    console.log(`[REFUND] Processing refund for order ${order.ORDER_ID}`);

    // Create refund transaction record
    const refundSeqResult = await connection.execute(
      'SELECT refund_transactions_seq.NEXTVAL as ID FROM DUAL',
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
    );

    const refundId = refundSeqResult.rows[0].ID;
    const refundAmount = order.TOTAL_AMOUNT;
    const refundMethod = order.PAYMENT_METHOD === 'VNPAY' ? 'ORIGINAL_PAYMENT' : 'WALLET';

    const refundQuery = `
      INSERT INTO REFUND_TRANSACTIONS (REFUND_ID, ORDER_ID, USER_ID, ORIGINAL_PAYMENT_METHOD, REFUND_AMOUNT, REFUND_METHOD, STATUS, REASON, PROCESSED_BY, CREATED_AT)
      VALUES (:refundId, :orderId, :userId, :paymentMethod, :amount, :refundMethod, 'PENDING', 'Order cancelled by customer/admin', 'SYSTEM', SYSDATE)
    `;

    await connection.execute(refundQuery, {
      refundId,
      orderId: order.ORDER_ID,
      userId,
      paymentMethod: order.PAYMENT_METHOD,
      amount: refundAmount,
      refundMethod
    }, { autoCommit: false });

    console.log(`[REFUND] ✅ Refund transaction created: ID=${refundId}, Amount=${refundAmount}`);

    return {
      refundId,
      refundAmount,
      refundMethod,
      status: 'PENDING'
    };

  } catch (error) {
    console.error('[REFUND ERROR]', error.message);
    throw error;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/order/:orderId/cancel
 * Customer cancels their own order
 * ✅ PROTECTED: Requires authentication
 */
router.post('/:orderId/cancel', verifyToken, async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log(`[CANCEL ORDER] User ${userId} requesting cancellation for order ${orderId}`);

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    connection = await getConnection();

    // Get order details
    const orderQuery = `
      SELECT ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, PAYMENT_METHOD, PAYMENT_STATUS
      FROM ORDERS
      WHERE ORDER_ID = :orderId
    `;

    const orderResult = await connection.execute(orderQuery, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false
    });

    if (!orderResult.rows || orderResult.rows.length === 0) {
      connection.close();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // ✅ SECURITY: Verify user owns the order
    if (parseInt(order.USER_ID) !== parseInt(userId)) {
      connection.close();
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders'
      });
    }

    // ✅ BUSINESS RULE: Only PENDING and PROCESSING orders can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.STATUS)) {
      connection.close();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.STATUS}. Only PENDING or PROCESSING orders can be cancelled.`
      });
    }

    console.log(`[CANCEL ORDER] ✅ Order validation passed. Proceeding with cancellation...`);

    // Step 1: Recover stock
    const stockRecovery = await recoverOrderStock(connection, orderId);

    // Step 2: Process refund
    const refund = await processRefund(connection, order, userId);

    // Step 3: Update order status
    const updateOrderQuery = `
      UPDATE ORDERS
      SET 
        STATUS = 'CANCELLED',
        CANCELLED_BY = 'CUSTOMER',
        CANCELLED_AT = SYSDATE,
        CANCELLATION_REASON = :reason,
        REFUND_STATUS = :refundStatus,
        REFUND_AMOUNT = :refundAmount,
        REFUND_METHOD = :refundMethod
      WHERE ORDER_ID = :orderId
    `;

    await connection.execute(updateOrderQuery, {
      orderId,
      reason: reason.trim(),
      refundStatus: 'PENDING',
      refundAmount: refund.refundAmount,
      refundMethod: refund.refundMethod
    }, { autoCommit: false });

    // Commit transaction
    await connection.commit();
    console.log(`[CANCEL ORDER] ✅ Transaction committed successfully`);

    res.json({
      success: true,
      message: 'Order cancelled successfully. Refund is being processed.',
      data: {
        orderId,
        status: 'CANCELLED',
        itemsRecovered: stockRecovery.itemsRecovered,
        refund: {
          refundId: refund.refundId,
          amount: refund.refundAmount,
          method: refund.refundMethod,
          status: refund.status,
          message: `Your refund of ${refund.refundAmount.toLocaleString('vi-VN')} ₫ will be processed within 3-5 business days`
        }
      }
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.log('[CANCEL ORDER] Transaction rolled back due to error');
      } catch (rollbackErr) {
        console.error('[CANCEL ORDER] Rollback failed:', rollbackErr.message);
      }
    }

    console.error('[CANCEL ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[CANCEL ORDER] Error closing connection:', err.message);
      }
    }
  }
});

/**
 * POST /api/admin/orders/:orderId/cancel
 * Admin cancels any order (force cancel)
 * ✅ PROTECTED: Requires ADMIN role
 */
router.post('/admin/:orderId/cancel', verifyToken, requireRole('ADMIN'), async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const { reason, sendNotification } = req.body;
    const adminId = req.user.userId;

    console.log(`[ADMIN CANCEL] Admin ${adminId} cancelling order ${orderId}`);

    connection = await getConnection();

    // Get order details
    const orderQuery = `
      SELECT ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, PAYMENT_METHOD
      FROM ORDERS
      WHERE ORDER_ID = :orderId
    `;

    const orderResult = await connection.execute(orderQuery, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false
    });

    if (!orderResult.rows || orderResult.rows.length === 0) {
      connection.close();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Step 1: Recover stock
    const stockRecovery = await recoverOrderStock(connection, orderId);

    // Step 2: Process refund
    const refund = await processRefund(connection, order, order.USER_ID);

    // Step 3: Update order status
    const updateOrderQuery = `
      UPDATE ORDERS
      SET 
        STATUS = 'CANCELLED',
        CANCELLED_BY = 'ADMIN',
        CANCELLED_AT = SYSDATE,
        CANCELLATION_REASON = :reason,
        REFUND_STATUS = :refundStatus,
        REFUND_AMOUNT = :refundAmount,
        REFUND_METHOD = :refundMethod
      WHERE ORDER_ID = :orderId
    `;

    await connection.execute(updateOrderQuery, {
      orderId,
      reason: reason ? reason.trim() : 'Cancelled by administrator',
      refundStatus: 'PENDING',
      refundAmount: refund.refundAmount,
      refundMethod: refund.refundMethod
    }, { autoCommit: false });

    await connection.commit();

    res.json({
      success: true,
      message: 'Order cancelled by admin successfully',
      data: {
        orderId,
        status: 'CANCELLED',
        cancelledBy: 'ADMIN',
        cancelledAt: new Date().toISOString(),
        itemsRecovered: stockRecovery.itemsRecovered,
        refund: refund
      }
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (err) {
        console.error('[ADMIN CANCEL] Rollback failed:', err.message);
      }
    }

    console.error('[ADMIN CANCEL ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[ADMIN CANCEL] Error closing connection:', err.message);
      }
    }
  }
});

/**
 * GET /api/admin/refunds?status=PENDING&page=1&limit=20
 * Get all refunds (admin only)
 * ✅ PROTECTED: Requires ADMIN role
 */
router.get('/admin/refunds', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status;
    const offset = (page - 1) * limit;

    console.log(`[GET REFUNDS] Page ${page}, Status: ${status || 'ALL'}`);

    let whereClause = '1=1';
    let params = { offset, limit };

    if (status) {
      whereClause += ' AND STATUS = :status';
      params.status = status;
    }

    const query = `
      SELECT 
        REFUND_ID, ORDER_ID, USER_ID, ORIGINAL_PAYMENT_METHOD,
        REFUND_AMOUNT, REFUND_METHOD, STATUS, REASON,
        CREATED_AT, PROCESSED_AT
      FROM REFUND_TRANSACTIONS
      WHERE ${whereClause}
      ORDER BY CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as TOTAL FROM REFUND_TRANSACTIONS WHERE ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult.rows[0]?.TOTAL || 0;

    res.json({
      success: true,
      data: result.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[GET REFUNDS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refunds',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/admin/stock-history?masp=SP001&action=RESTORE
 * Get stock change history (admin only)
 * ✅ PROTECTED: Requires ADMIN role
 */
router.get('/admin/stock-history', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const masp = req.query.masp;
    const action = req.query.action;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let params = { offset, limit };

    if (masp) {
      whereClause += ' AND MASP = :masp';
      params.masp = masp;
    }

    if (action) {
      whereClause += ' AND ACTION = :action';
      params.action = action;
    }

    const query = `
      SELECT 
        STOCK_HISTORY_ID, MASP, ACTION, QUANTITY_CHANGED,
        NEW_QUANTITY, REFERENCE_TYPE, REFERENCE_ID, CHANGED_BY,
        REASON, CREATED_AT
      FROM STOCK_HISTORY
      WHERE ${whereClause}
      ORDER BY CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as TOTAL FROM STOCK_HISTORY WHERE ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult.rows[0]?.TOTAL || 0;

    res.json({
      success: true,
      data: result.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[GET STOCK HISTORY ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
