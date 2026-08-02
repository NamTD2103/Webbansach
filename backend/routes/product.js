'use strict';

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');

// ================= UTILS =================
const parseNumber = (val) => Number(val);
const isValidNumber = (n) => typeof n === 'number' && !isNaN(n);

// ================= LIST =================
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const query = `
      SELECT
    MASP,
    TENSP,
    GIABAN,
    SOLUONGTON,
    HINHANH AS IMAGE_URL,
    MOTA AS DESCRIPTION,
    NVL(MANCC,'') AS MANCC,
    MADM AS CAT_ID
FROM SANPHAM
ORDER BY TENSP
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const [data, count] = await Promise.all([
      executeQuery(query, { offset, limit }),
      executeQuery('SELECT COUNT(*) AS TOTAL FROM SANPHAM'),
    ]);

    const total = count.rows[0]?.TOTAL || 0;

    res.json({
      success: true,
      data: data.rows || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[LIST ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ================= SEARCH =================
router.get('/search/query', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Keyword required' });
    }

    const keyword = `%${q.toUpperCase()}%`;

    const result = await executeQuery(
      `
      SELECT MASP, TENSP, GIABAN,
             NVL(SOLUONGTON,0) AS SOLUONGTON,
             HINHANH AS IMAGE_URL,
             NVL(MOTA,'') AS DESCRIPTION,
             NVL(MANCC,'') AS MANCC
      FROM SANPHAM
      WHERE UPPER(TENSP) LIKE :keyword
         OR UPPER(MOTA) LIKE :keyword
      ORDER BY TENSP
      `,
      { keyword }
    );

    res.json({
      success: true,
      data: result.rows || [],
      count: result.rows?.length || 0,
    });
  } catch (err) {
    console.error('[SEARCH ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ================= DETAIL =================
router.get('/:id', async (req, res) => {
  try {
    const result = await executeQuery(
      `
      SELECT MASP, TENSP, GIABAN, SOLUONGTON,
             HINHANH AS IMAGE_URL,
             MOTA AS DESCRIPTION,
             NVL(MANCC,'') AS MANCC
      FROM SANPHAM
      WHERE MASP = :id
      `,
      { id: req.params.id }
    );

    if (!result.rows?.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[DETAIL ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ================= CREATE =================
router.post('/', async (req, res) => {
  try {
    let { TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC } = req.body;

    if (!TENSP?.trim()) {
      return res.status(400).json({ success: false, message: 'Tên sản phẩm bắt buộc' });
    }

    TENSP = TENSP.trim();
    GIABAN = parseNumber(GIABAN);
    SOLUONGTON = parseNumber(SOLUONGTON);

    if (!isValidNumber(GIABAN) || GIABAN <= 0) {
      return res.status(400).json({ success: false, message: 'Giá không hợp lệ' });
    }

    if (!isValidNumber(SOLUONGTON) || SOLUONGTON < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }

    // ⚡ tránh trùng ID
    const newId = `SP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await executeUpdate(
      `
      INSERT INTO SANPHAM
      (MASP, TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC)
      VALUES (:id, :TENSP, :GIABAN, :SOLUONGTON, :HINHANH, :MOTA, :MANCC)
      `,
      { id: newId, TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC }
    );

    res.json({
      success: true,
      data: {
        MASP: newId,
        TENSP,
        GIABAN,
        SOLUONGTON,
        IMAGE_URL: HINHANH,
        DESCRIPTION: MOTA,
        MANCC,
      },
    });
  } catch (err) {
    console.error('[CREATE ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ================= UPDATE =================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC } = req.body;

    GIABAN = parseNumber(GIABAN);
    SOLUONGTON = parseNumber(SOLUONGTON);

    if (!isValidNumber(GIABAN) || GIABAN <= 0) {
      return res.status(400).json({ success: false, message: 'Giá không hợp lệ' });
    }

    if (!isValidNumber(SOLUONGTON) || SOLUONGTON < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
    }

    const exist = await executeQuery(
      'SELECT 1 FROM SANPHAM WHERE MASP = :id',
      { id }
    );

    if (!exist.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tồn tại' });
    }

    await executeUpdate(
      `
      UPDATE SANPHAM SET
        TENSP = :TENSP,
        GIABAN = :GIABAN,
        SOLUONGTON = :SOLUONGTON,
        HINHANH = :HINHANH,
        MOTA = :MOTA,
        MANCC = :MANCC
      WHERE MASP = :id
      `,
      { id, TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[UPDATE ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ================= DELETE =================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const exist = await executeQuery(
      'SELECT 1 FROM SANPHAM WHERE MASP = :id',
      { id }
    );

    if (!exist.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tồn tại' });
    }

    await executeUpdate('DELETE FROM SANPHAM WHERE MASP = :id', { id });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE ERROR]', err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;