const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');
const crypto = require('crypto');

/**
 * Helper: Hash password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    console.log(`[AUTH] Login attempt for user: ${username}`);

    const query = `
      SELECT USER_ID, USERNAME, ROLE 
      FROM USERS 
      WHERE USERNAME = :username AND PASSWORD = :password
    `;

    const result = await executeQuery(query, { username, password });

    if (!result.rows || result.rows.length === 0) {
      console.log(`[AUTH] Login failed for user: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = result.rows[0];
    console.log(`[AUTH] Login successful for user: ${username} (ID: ${user.USER_ID})`);

    // In production, generate JWT token here
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.USER_ID,
        username: user.USERNAME,
        role: user.ROLE,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 * User registration with role
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
    console.log(`[AUTH] Registration attempt for user: ${username} (role: ${userRole})`);

    // Check if user exists
    const checkUser = await executeQuery(
      'SELECT USER_ID FROM USERS WHERE USERNAME = :username',
      { username }
    );

    if (checkUser.rows && checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Get next user ID
    const idResult = await executeQuery('SELECT MAX(USER_ID) as MAX_ID FROM USERS');
    const userId = (idResult.rows[0]?.MAX_ID || 0) + 1;

    const insertQuery = `
      INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, ROLE, EMAIL, FULLNAME)
      VALUES (:userId, :username, :password, :role, :email, :fullname)
    `;

    await executeUpdate(insertQuery, {
      userId,
      username,
      password,
      role: userRole,
      email: email || null,
      fullname: username,
    });

    console.log(`[AUTH] User registered successfully: ${username} (ID: ${userId}, Role: ${userRole})`);

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        userId,
        username,
        email: email || null,
        role: userRole,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register',
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/user/:userId
 * Get user info
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT USER_ID, USERNAME, ROLE, EMAIL, FULLNAME
      FROM USERS 
      WHERE USER_ID = :userId
    `;

    const result = await executeQuery(query, { userId });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

/**
 * PUT /api/auth/user/:userId
 * Update user profile
 */
router.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullname } = req.body;

    if (!email && !fullname) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (email or fullname) is required',
      });
    }

    console.log(`[AUTH] Updating user profile for user ${userId}`);

    // Check user exists
    const checkUser = await executeQuery(
      'SELECT USER_ID FROM USERS WHERE USER_ID = :userId',
      { userId }
    );

    if (!checkUser.rows || checkUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let updateQuery = 'UPDATE USERS SET ';
    const params = {};
    const updates = [];

    if (email) {
      updates.push('EMAIL = :email');
      params.email = email;
    }

    if (fullname) {
      updates.push('FULLNAME = :fullname');
      params.fullname = fullname;
    }

    updateQuery += updates.join(', ') + ' WHERE USER_ID = :userId';
    params.userId = userId;

    await executeUpdate(updateQuery, params);

    console.log(`[AUTH] User ${userId} profile updated successfully`);

    // Get updated user
    const updatedUser = await executeQuery(
      'SELECT USER_ID, USERNAME, ROLE, EMAIL, FULLNAME FROM USERS WHERE USER_ID = :userId',
      { userId }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

module.exports = router;
