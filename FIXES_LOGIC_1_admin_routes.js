/**
 * LOGIC FIX #1: Admin Route Authorization
 * File: backend/routes/admin.js
 * 
 * ❌ BEFORE: No authorization check
 * ✅ AFTER: All routes require ADMIN role
 */

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const APIResponse = require('../utils/apiResponse');

/**
 * ✅ MIDDLEWARE: Verify admin authentication on all routes
 */
router.use(verifyToken);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/users
 * Get all users (ADMIN only)
 */
router.get('/users', async (req, res, next) => {
  try {
    console.log(`[ADMIN] Fetching all users (admin: ${req.user.email})`);

    const query = `
      SELECT 
        USER_ID, 
        USERNAME, 
        EMAIL, 
        FULL_NAME, 
        ROLE,
        STATUS,
        CREATED_AT,
        UPDATED_AT
      FROM USERS
      ORDER BY USER_ID DESC
    `;

    const result = await executeQuery(query, {});

    if (!result.rows) {
      return res.json(APIResponse.success([], 'No users found').body);
    }

    const response = APIResponse.success(
      result.rows,
      `Retrieved ${result.rows.length} users`,
      200
    );

    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user with orders (ADMIN only)
 */
router.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`[ADMIN] Fetching user ${userId} details (admin: ${req.user.email})`);

    // Validate userId is number
    if (!Number.isInteger(parseInt(userId))) {
      return res.status(400).json(
        APIResponse.error('Invalid user ID format', 'USER_ID_INVALID', 400).body
      );
    }

    const userQuery = `
      SELECT 
        USER_ID, 
        USERNAME, 
        EMAIL, 
        FULL_NAME, 
        ROLE,
        STATUS,
        CREATED_AT,
        UPDATED_AT
      FROM USERS
      WHERE USER_ID = :userId
    `;

    const userResult = await executeQuery(userQuery, { userId });

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json(
        APIResponse.error('User not found', 'USER_NOT_FOUND', 404).body
      );
    }

    const user = userResult.rows[0];

    // Get user orders
    const ordersQuery = `
      SELECT 
        ORDER_ID, 
        ORDER_DATE, 
        STATUS, 
        TOTAL_AMOUNT,
        PAYMENT_METHOD,
        CREATED_AT
      FROM ORDERS
      WHERE USER_ID = :userId
      ORDER BY ORDER_DATE DESC
    `;

    const ordersResult = await executeQuery(ordersQuery, { userId });

    const response = APIResponse.success({
      user,
      orders: ordersResult.rows || [],
      totalOrders: ordersResult.rows?.length || 0,
    });

    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * ✅ NEW: GET /api/admin/dashboard
 * Get dashboard statistics (ADMIN only)
 */
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    console.log(`[ADMIN] Fetching dashboard stats (admin: ${req.user.email})`);

    const [userStats, orderStats, productStats, revenueStats] = await Promise.all([
      executeQuery(`SELECT COUNT(*) AS TOTAL_USERS FROM USERS`),
      executeQuery(`SELECT COUNT(*) AS TOTAL_ORDERS FROM ORDERS`),
      executeQuery(`SELECT COUNT(*) AS TOTAL_PRODUCTS FROM SANPHAM`),
      executeQuery(`
        SELECT 
          SUM(TOTAL_AMOUNT) AS TOTAL_REVENUE,
          AVG(TOTAL_AMOUNT) AS AVG_ORDER_VALUE
        FROM ORDERS
        WHERE STATUS IN ('COMPLETED', 'PAID')
      `),
    ]);

    const stats = {
      totalUsers: userStats.rows[0]?.TOTAL_USERS || 0,
      totalOrders: orderStats.rows[0]?.TOTAL_ORDERS || 0,
      totalProducts: productStats.rows[0]?.TOTAL_PRODUCTS || 0,
      totalRevenue: revenueStats.rows[0]?.TOTAL_REVENUE || 0,
      avgOrderValue: revenueStats.rows[0]?.AVG_ORDER_VALUE || 0,
    };

    const response = APIResponse.success(stats);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * ✅ NEW: PUT /api/admin/users/:userId/role
 * Update user role (ADMIN only)
 */
router.put('/users/:userId/role', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate input
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json(
        APIResponse.error('Invalid role. Must be USER or ADMIN', 'INVALID_ROLE', 400).body
      );
    }

    // Prevent self-demotion
    if (parseInt(userId) === req.user.userId && role === 'USER') {
      return res.status(400).json(
        APIResponse.error('Cannot demote yourself from ADMIN role', 'CANNOT_SELF_DEMOTE', 400).body
      );
    }

    const result = await executeUpdate(
      `UPDATE USERS SET ROLE = :role, UPDATED_AT = SYSDATE WHERE USER_ID = :userId`,
      { role, userId }
    );

    if (!result) {
      return res.status(404).json(
        APIResponse.error('User not found', 'USER_NOT_FOUND', 404).body
      );
    }

    console.log(`[ADMIN] User ${userId} role updated to ${role} by ${req.user.email}`);

    const response = APIResponse.success(
      { userId, role },
      `User role updated to ${role}`
    );
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * ✅ NEW: DELETE /api/admin/users/:userId
 * Delete user (ADMIN only) - Soft delete recommended
 */
router.delete('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json(
        APIResponse.error('Cannot delete your own account', 'CANNOT_SELF_DELETE', 400).body
      );
    }

    // ✅ SOFT DELETE: Set status instead of deleting
    const result = await executeUpdate(
      `UPDATE USERS SET STATUS = 'DELETED', UPDATED_AT = SYSDATE WHERE USER_ID = :userId`,
      { userId }
    );

    if (!result) {
      return res.status(404).json(
        APIResponse.error('User not found', 'USER_NOT_FOUND', 404).body
      );
    }

    console.log(`[ADMIN] User ${userId} deleted by ${req.user.email}`);

    const response = APIResponse.success(
      { userId },
      'User successfully deleted'
    );
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * ✅ NEW: GET /api/admin/products
 * Get all products for admin (ADMIN only)
 */
router.get('/products', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const [products, total] = await Promise.all([
      executeQuery(`
        SELECT 
          MASP, TENSP, GIABAN, SOLUONGTON,
          HINHANH AS IMAGE_URL,
          MOTA AS DESCRIPTION,
          NVL(MANCC,'') AS MANCC
        FROM SANPHAM
        ORDER BY TENSP
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `, { offset, limit }),
      executeQuery(`SELECT COUNT(*) AS TOTAL FROM SANPHAM`),
    ]);

    const pagination = {
      page,
      limit,
      total: total.rows[0]?.TOTAL || 0,
      pages: Math.ceil((total.rows[0]?.TOTAL || 0) / limit),
    };

    const response = APIResponse.paginated(
      products.rows || [],
      pagination
    );
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

/**
 * ✅ NEW: GET /api/admin/orders
 * Get all orders with filtering (ADMIN only)
 */
router.get('/orders', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const status = req.query.status ? req.query.status.toUpperCase() : null;
    const offset = (page - 1) * limit;

    let statusClause = '';
    const params = { offset, limit };

    if (status && ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'].includes(status)) {
      statusClause = 'WHERE STATUS = :status';
      params.status = status;
    }

    const [orders, total] = await Promise.all([
      executeQuery(`
        SELECT 
          ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT,
          ORDER_DATE, PAYMENT_METHOD
        FROM ORDERS
        ${statusClause}
        ORDER BY ORDER_DATE DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `, params),
      executeQuery(`SELECT COUNT(*) AS TOTAL FROM ORDERS ${statusClause}`, 
        status ? { status } : {}),
    ]);

    const pagination = {
      page,
      limit,
      total: total.rows[0]?.TOTAL || 0,
      pages: Math.ceil((total.rows[0]?.TOTAL || 0) / limit),
    };

    const response = APIResponse.paginated(
      orders.rows || [],
      pagination
    );
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
