const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');

/**
 * POST /api/cart/add
 * Add product to cart
 */
router.post('/add', async (req, res) => {
  try {
    const { userId, masp, soluong } = req.body;

    // Validate input
    if (!userId || !masp || !soluong) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, masp, soluong',
      });
    }

    console.log(`[CART] Adding product ${masp} (qty: ${soluong}) to cart of user ${userId}`);

    // Check if product exists and has stock
    const productCheck = await executeQuery(
      'SELECT SOLUONGTON, GIABAN FROM SANPHAM WHERE MASP = :masp',
      { masp }
    );

    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product ${masp} not found`,
      });
    }

    const product = productCheck.rows[0];
    if (product.SOLUONGTON < soluong) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Available: ${product.SOLUONGTON}`,
      });
    }

    // Get or create cart for user
    const cartCheck = await executeQuery(
      'SELECT CART_ID FROM CART WHERE USER_ID = :userId',
      { userId }
    );

    let cartId;
    if (cartCheck.rows && cartCheck.rows.length > 0) {
      cartId = cartCheck.rows[0].CART_ID;
    } else {
      // Create new cart using sequence
      const cartInsert = await executeUpdate(
        `INSERT INTO CART (CART_ID, USER_ID) VALUES (cart_seq.NEXTVAL, :userId)`,
        { userId }
      );
      
      // Get the newly created cart ID
      const newCartCheck = await executeQuery(
        'SELECT CART_ID FROM CART WHERE USER_ID = :userId ORDER BY CART_ID DESC',
        { userId }
      );
      if (!newCartCheck.rows || newCartCheck.rows.length === 0) {
        throw new Error('Failed to create cart');
      }
      cartId = newCartCheck.rows[0].CART_ID;
    }

    // Check if product already in cart
    const itemCheck = await executeQuery(
      'SELECT SOLUONG FROM CART_ITEM WHERE CART_ID = :cartId AND MASP = :masp',
      { cartId, masp }
    );

    if (itemCheck.rows && itemCheck.rows.length > 0) {
      // Update quantity
      const newQty = itemCheck.rows[0].SOLUONG + soluong;
      if (product.SOLUONGTON < newQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot add. Total would exceed available stock (${product.SOLUONGTON})`,
        });
      }
      
      await executeUpdate(
        'UPDATE CART_ITEM SET SOLUONG = :soluong WHERE CART_ID = :cartId AND MASP = :masp',
        { soluong: newQty, cartId, masp }
      );
      console.log(`[CART] Updated quantity for product ${masp}`);
    } else {
      // Insert new item with sequence
      await executeUpdate(
        'INSERT INTO CART_ITEM (ITEM_ID, CART_ID, MASP, SOLUONG) VALUES (cart_item_seq.NEXTVAL, :cartId, :masp, :soluong)',
        { cartId, masp, soluong }
      );
      console.log(`[CART] Added new product ${masp} to cart`);
    }

    res.json({
      success: true,
      message: 'Product added to cart successfully',
      cartId,
    });
  } catch (error) {
    console.error('[CART ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart',
      error: error.message,
    });
  }
});

/**
 * GET /api/cart/:userId
 * Get user's cart with all items
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[CART] Fetching cart for user ${userId}`);

    const query = `
      SELECT 
        ci.MASP, 
        sp.TENSP, 
        sp.HINHANH AS IMAGE_URL, 
        sp.GIABAN, 
        sp.SOLUONGTON,
        ci.SOLUONG,
        (ci.SOLUONG * sp.GIABAN) AS TOTAL_PRICE
      FROM CART_ITEM ci
      JOIN CART c ON ci.CART_ID = c.CART_ID
      JOIN SANPHAM sp ON ci.MASP = sp.MASP
      WHERE c.USER_ID = :userId
      ORDER BY ci.MASP
    `;

    const result = await executeQuery(query, { userId });

    if (!result.rows) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        count: 0,
      });
    }

    // Calculate total
    const total = result.rows.reduce((sum, item) => sum + (item.TOTAL_PRICE || 0), 0);

    console.log(`[CART] Cart has ${result.rows.length} items, total: ${total}`);

    res.json({
      success: true,
      data: result.rows,
      total: total,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[CART ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/cart/item/:userId/:masp
 * Remove product from cart
 */
router.delete('/item/:userId/:masp', async (req, res) => {
  try {
    const { userId, masp } = req.params;

    console.log(`[CART] Removing product ${masp} from cart of user ${userId}`);

    await executeUpdate(
      `DELETE FROM CART_ITEM 
       WHERE MASP = :masp 
       AND CART_ID = (SELECT CART_ID FROM CART WHERE USER_ID = :userId)`,
      { masp, userId }
    );

    res.json({
      success: true,
      message: 'Product removed from cart',
    });
  } catch (error) {
    console.error('[CART ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from cart',
      error: error.message,
    });
  }
});
/**
 * DELETE /api/cart/clear/:userId
 * Xóa toàn bộ giỏ hàng sau khi đặt hàng thành công
 */
router.delete("/clear/:userId", async (req, res) => {
  try {

    const { userId } = req.params;

    // Lấy cart
    const cart = await executeQuery(
      `
      SELECT CART_ID
      FROM CART
      WHERE USER_ID = :userId
      `,
      { userId }
    );

    if (!cart.rows.length) {
      return res.json({
        success: true,
        message: "Giỏ hàng trống"
      });
    }

    const cartId = cart.rows[0].CART_ID;

    // Xóa toàn bộ item
    await executeUpdate(
      `
      DELETE FROM CART_ITEM
      WHERE CART_ID = :cartId
      `,
      { cartId }
    );

    res.json({
      success: true,
      message: "Đã xóa giỏ hàng"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
/**
 * PUT /api/cart/update
 * Update quantity in cart
 */
router.put("/update", async (req, res) => {
  try {
    const { userId, masp, soluong } = req.body;

    if (!userId || !masp || soluong == null) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu"
      });
    }

    // Kiểm tra tồn kho
    const product = await executeQuery(
      `SELECT SOLUONGTON
       FROM SANPHAM
       WHERE MASP = :masp`,
      { masp }
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    const stock = product.rows[0].SOLUONGTON;

    if (soluong > stock) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${stock} sản phẩm`
      });
    }

    await executeUpdate(
      `
      UPDATE CART_ITEM
      SET SOLUONG = :soluong
      WHERE MASP = :masp
      AND CART_ID = (
          SELECT CART_ID
          FROM CART
          WHERE USER_ID = :userId
      )
      `,
      {
        soluong,
        masp,
        userId
      }
    );

    res.json({
      success: true,
      message: "Đã cập nhật giỏ hàng"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
module.exports = router;
