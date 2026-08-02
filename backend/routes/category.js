const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');

/**
 * GET /api/category
 * Get all categories
 */
router.get('/', async (req, res) => {
  try {
    console.log('[CATEGORY] Fetching all categories');

    const query = `
  SELECT
    MADM  AS CAT_ID,
    TENDM AS CAT_NAME,
    MALOAI
  FROM DANHMUC
  ORDER BY TENDM ASC
`;

    try {
      const result = await executeQuery(query, {});

      if (!result.rows) {
        return res.json({
          success: true,
          data: [],
          total: 0,
        });
      }

      console.log(`[CATEGORY] Found ${result.rows.length} categories`);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      });
    } catch (queryError) {
      // If table doesn't exist, return empty list
      if (queryError.message?.includes('ORA-00942')) {
        console.log('[CATEGORY] Table does not exist, returning empty list');
        return res.json({
          success: true,
          data: [],
          total: 0,
        });
      }
      throw queryError;
    }
  } catch (error) {
    console.error('[CATEGORY ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

module.exports = router;
