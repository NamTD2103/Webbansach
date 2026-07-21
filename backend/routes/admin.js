const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');

/**
 * GET /api/admin/users
 * Get all users (for admin dashboard)
 */
router.get('/users', async (req, res) => {
  try {
    console.log('[ADMIN] Fetching all users');

    const query = `
      SELECT 
        USER_ID, 
        USERNAME, 
        EMAIL, 
        FULLNAME, 
        ROLE
      FROM USERS
      ORDER BY USER_ID DESC
    `;

    const result = await executeQuery(query, {});

    if (!result.rows) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    console.log(`[ADMIN] Found ${result.rows.length} users`);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details with orders
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[ADMIN] Fetching user ${userId} details`);

    // Get user info
    const userQuery = `
      SELECT 
        USER_ID, 
        USERNAME, 
        EMAIL, 
        FULLNAME, 
        ROLE
      FROM USERS
      WHERE USER_ID = :userId
    `;

    const userResult = await executeQuery(userQuery, { userId });

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Get user orders
    const ordersQuery = `
      SELECT 
        ORDER_ID, 
        ORDER_DATE, 
        STATUS, 
        TOTAL_AMOUNT
      FROM ORDERS
      WHERE USER_ID = :userId
      ORDER BY ORDER_ID DESC
    `;

    const ordersResult = await executeQuery(ordersQuery, { userId });

    res.json({
      success: true,
      user,
      orders: ordersResult.rows || [],
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user information
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullname, role } = req.body;

    console.log(`[ADMIN] Updating user ${userId}`);

    // Validate input
    if (role && !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be USER or ADMIN',
      });
    }

    const updateQuery = `
      UPDATE USERS 
      SET EMAIL = :email, FULLNAME = :fullname, ROLE = :role
      WHERE USER_ID = :userId
    `;

    await executeUpdate(updateQuery, {
      userId,
      email: email || null,
      fullname: fullname || null,
      role: role || 'USER',
    });

    console.log(`[ADMIN] User ${userId} updated successfully`);

    res.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders
 */
router.get('/orders', async (req, res) => {
  try {
    console.log('[ADMIN] Fetching all orders');

    const query = `
      SELECT 
        o.ORDER_ID, 
        o.USER_ID, 
        u.USERNAME,
        u.FULLNAME,
        o.STATUS, 
        o.TOTAL_AMOUNT,
        o.ORDER_DATE,
        0 as ITEM_COUNT
      FROM ORDERS o
      LEFT JOIN USERS u ON o.USER_ID = u.USER_ID
      ORDER BY o.ORDER_ID DESC
    `;

    const result = await executeQuery(query, {});

    if (!result.rows) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    console.log(`[ADMIN] Found ${result.rows.length} orders`);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/orders/:orderId
 * Get order details with items
 */
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`[ADMIN] Fetching order ${orderId} details`);

    // Get order header with user info
    const orderQuery = `
      SELECT 
        o.ORDER_ID, 
        o.USER_ID, 
        u.USERNAME,
        u.FULLNAME,
        u.EMAIL,
        o.STATUS, 
        o.TOTAL_AMOUNT,
        o.ORDER_DATE,
        o.PAYMENT_METHOD
      FROM ORDERS o
      LEFT JOIN USERS u ON o.USER_ID = u.USER_ID
      WHERE o.ORDER_ID = :orderId
    `;

    const orderResult = await executeQuery(orderQuery, { orderId });

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        oi.ITEM_ID,
        oi.MASP, 
        sp.TENSP,
        oi.SOLUONG,
        oi.PRICE,
        (oi.SOLUONG * oi.PRICE) as TOTAL
      FROM ORDER_ITEMS oi
      LEFT JOIN SANPHAM sp ON oi.MASP = sp.MASP
      WHERE oi.ORDER_ID = :orderId
      ORDER BY oi.ITEM_ID
    `;

    const itemsResult = await executeQuery(itemsQuery, { orderId });

    res.json({
      success: true,
      order,
      items: itemsResult.rows || [],
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId
 * Update order status
 */
router.put('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    console.log(`[ADMIN] Updating order ${orderId} status to ${status}`);

    const updateQuery = `
      UPDATE ORDERS 
      SET STATUS = :status, UPDATED_AT = SYSDATE
      WHERE ORDER_ID = :orderId
    `;

    await executeUpdate(updateQuery, { orderId, status });

    console.log(`[ADMIN] Order ${orderId} status updated successfully`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[ADMIN] Deleting user ${userId}`);

    // Delete user (cascade delete should handle related records)
    const deleteQuery = `DELETE FROM USERS WHERE USER_ID = :userId`;

    await executeUpdate(deleteQuery, { userId });

    console.log(`[ADMIN] User ${userId} deleted successfully`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

module.exports = router;
