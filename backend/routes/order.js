const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate, getConnection } = require('../config/db');
const oracledb = require('oracledb');
const PDFDocument=require("pdfkit");

/**
 * POST /api/order/create
 * Create order from cart
 */
router.post('/create', async (req, res) => {
  let connection;
  try {
    const {
 userId,
 customerInfo,
 shippingAddress,
 paymentMethod
} = req.body;

    if (!paymentMethod) {
  return res.status(400).json({
    success: false,
    message: "Missing payment method",
  });
}

    console.log(`[ORDER] Creating order for user ${userId} with method ${paymentMethod}`);

    // Get cart items
    const cartQuery = `
      SELECT 
        ci.MASP, 
        sp.GIABAN, 
        ci.SOLUONG,
        (ci.SOLUONG * sp.GIABAN) AS ITEM_TOTAL,
        c.CART_ID
      FROM CART_ITEM ci
      JOIN CART c ON ci.CART_ID = c.CART_ID
      JOIN SANPHAM sp ON ci.MASP = sp.MASP
      WHERE c.USER_ID = :userId
    `;

    const cartResult = await executeQuery(cartQuery, { userId });

    if (!cartResult.rows || cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const cartItems = cartResult.rows;
    const totalAmount = cartItems.reduce((sum, item) => sum + item.ITEM_TOTAL, 0);
    const cartId = cartItems[0].CART_ID;

    console.log(`[ORDER] Cart total: ${totalAmount} for ${cartItems.length} items`);

    connection = await getConnection();

    // Get next order ID
    const orderIdResult = await connection.execute(
      'SELECT MAX(ORDER_ID) as MAX_ID FROM ORDERS',
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const maxId = orderIdResult.rows[0]?.MAX_ID || 0;
    const orderId = maxId + 1;

    // Insert order
    const orderInsert = `
      INSERT INTO ORDERS
(
ORDER_ID,
USER_ID,
STATUS,
TOTAL_AMOUNT,
PAYMENT_METHOD,
ORDER_DATE,
CUSTOMER_NAME,
CUSTOMER_PHONE,
CUSTOMER_EMAIL,
SHIPPING_ADDRESS
)
VALUES
(
:orderId,
:userId,
'PENDING',
:totalAmount,
:paymentMethod,
SYSDATE,
:customerName,
:customerPhone,
:customerEmail,
:shippingAddress
)
    `;

    await connection.execute(
orderInsert,
{
 orderId,

 userId: userId || null,

 totalAmount,

 paymentMethod,

 customerName: customerInfo?.fullname || null,

 customerPhone: customerInfo?.phone || null,

 customerEmail: customerInfo?.email || null,

 shippingAddress:
 `${shippingAddress.street},
 ${shippingAddress.district},
 ${shippingAddress.province}`
},
{
 autoCommit:false
}
);

    console.log(`[ORDER] Created order ${orderId}`);

    // Insert order items
    for (let item of cartItems) {
      const itemIdResult = await connection.execute(
        'SELECT MAX(ITEM_ID) as MAX_ID FROM ORDER_ITEMS',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const maxItemId = itemIdResult.rows[0]?.MAX_ID || 0;
      const itemId = maxItemId + 1;

      const itemInsert = `
        INSERT INTO ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
        VALUES (:itemId, :orderId, :masp, :soluong, :price)
      `;

      await connection.execute(itemInsert, [itemId, orderId, item.MASP, item.SOLUONG, item.GIABAN], {
        autoCommit: false,
      });

      // Reduce stock (trigger should handle this, but manual backup)
      const updateStock = `
        UPDATE SANPHAM 
        SET SOLUONGTON = SOLUONGTON - :soluong 
        WHERE MASP = :masp
      `;

      await connection.execute(updateStock, [item.SOLUONG, item.MASP], {
        autoCommit: false,
      });
    }

    // Clear cart items
    const clearCart = `
      DELETE FROM CART_ITEM WHERE CART_ID = :cartId
    `;

    await connection.execute(clearCart, [cartId], {
      autoCommit: false,
    });

    // Commit transaction
    await connection.commit();
    console.log(`[ORDER] Order ${orderId} created successfully`);

    res.json({
      success: true,
      message: 'Order created successfully',
      orderId,
      totalAmount,
      itemCount: cartItems.length,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.log('[ORDER] Transaction rolled back');
      } catch (rollbackError) {
        console.error('[ORDER] Rollback failed:', rollbackError.message);
      }
    }
    
    console.error('[ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[ORDER] Error closing connection:', err.message);
      }
    }
  }
});

/**
 * POST /api/order/add-item
 * Add item to existing order (internal use)
 */
router.post('/add-item', async (req, res) => {
  try {
    const { orderId, masp, soluong, price } = req.body;

    if (!orderId || !masp || !soluong || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    console.log(`[ORDER] Adding item ${masp} (qty: ${soluong}) to order ${orderId}`);

    // Get next item ID
    const idResult = await executeQuery('SELECT MAX(ITEM_ID) as MAX_ID FROM ORDER_ITEMS');
    const itemId = (idResult.rows[0]?.MAX_ID || 0) + 1;

    // Insert item
    await executeUpdate(
      `INSERT INTO ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
       VALUES (:itemId, :orderId, :masp, :soluong, :price)`,
      [itemId, orderId, masp, soluong, price]
    );

    // Update order total
    await executeUpdate(
      `UPDATE ORDERS 
       SET TOTAL_AMOUNT = TOTAL_AMOUNT + :itemTotal 
       WHERE ORDER_ID = :orderId`,
      [soluong * price, orderId]
    );

    // Reduce stock
    await executeUpdate(
      `UPDATE SANPHAM 
       SET SOLUONGTON = SOLUONGTON - :soluong 
       WHERE MASP = :masp`,
      [soluong, masp]
    );

    console.log(`[ORDER] Item added to order ${orderId}`);

    res.json({
      success: true,
      message: 'Item added to order successfully',
      itemId,
    });
  } catch (error) {
    console.error('[ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to order',
      error: error.message,
    });
  }
});

/**
 * GET /api/order/:orderId
 * Get order details
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`[ORDER] Fetching order ${orderId}`);

    // Get order header
    const orderQuery = `
      SELECT ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, ORDER_DATE
      FROM ORDERS
      WHERE ORDER_ID = :orderId
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
        oi.SOLUONG, 
        oi.PRICE,
        sp.TENSP, 
        sp.IMAGE_URL,
        (oi.SOLUONG * oi.PRICE) AS TOTAL
      FROM ORDER_ITEMS oi
      JOIN SANPHAM sp ON oi.MASP = sp.MASP
      WHERE oi.ORDER_ID = :orderId
    `;

    const itemsResult = await executeQuery(itemsQuery, { orderId });

    console.log(`[ORDER] Retrieved order ${orderId} with ${itemsResult.rows?.length || 0} items`);

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows || [],
      },
    });
  } catch (error) {
    console.error('[ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
});

/**
 * GET /api/order/user/:userId
 * Get user's order history
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log(`[ORDER] Fetching orders for user ${userId}`);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as TOTAL FROM ORDERS WHERE USER_ID = :userId
    `;
    const countResult = await executeQuery(countQuery, { userId });
    const total = countResult.rows[0]?.TOTAL || 0;

    // Get orders
    const ordersQuery = `
      SELECT ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, ORDER_DATE
      FROM ORDERS
      WHERE USER_ID = :userId
      ORDER BY ORDER_DATE DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const ordersResult = await executeQuery(ordersQuery, { userId, offset, limit: parseInt(limit) });

    console.log(`[ORDER] Retrieved ${ordersResult.rows?.length || 0} orders for user ${userId}`);

    res.json({
      success: true,
      data: ordersResult.rows || [],
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('[ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});
/************************************************
 * PUT /api/order/:id/cancel
 ************************************************/
router.put("/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await executeQuery(
      `SELECT STATUS
       FROM ORDERS
       WHERE ORDER_ID=:id`,
      { id: orderId }
    );

    if (order.rows.length === 0) {
      return res.status(404).json({
        success:false,
        message:"Order not found"
      });
    }

    if (order.rows[0].STATUS !== "PENDING") {
      return res.status(400).json({
        success:false,
        message:"Không thể hủy đơn"
      });
    }

    await executeUpdate(
      `UPDATE ORDERS
       SET STATUS='CANCELLED'
       WHERE ORDER_ID=:id`,
      { id: orderId }
    );

    res.json({
      success:true,
      message:"Đã hủy đơn hàng"
    });

  } catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
});
router.post("/:orderId/reorder",async(req,res)=>{

try{

const {orderId}=req.params;

const orderItems=await executeQuery(

`SELECT MASP,SOLUONG
FROM ORDER_ITEMS
WHERE ORDER_ID=:id`,

{id:orderId}

);

if(orderItems.rows.length===0){

return res.status(404).json({
success:false
});

}

res.json({

success:true,
items:orderItems.rows

});

}catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

});
 router.get("/:orderId/tracking",async(req,res)=>{

const {orderId}=req.params;

const result=await executeQuery(

`SELECT
STATUS,
ORDER_DATE
FROM ORDERS
WHERE ORDER_ID=:id`,

{id:orderId}

);

res.json({

success:true,
data:result.rows[0]

});

});
router.post("/:orderId/pay",async(req,res)=>{

const {orderId}=req.params;

await executeUpdate(

`UPDATE ORDERS
SET STATUS='PAID'
WHERE ORDER_ID=:id
AND STATUS='PENDING'`,

{id:orderId}

);

res.json({

success:true

});

});
router.get("/:orderId/invoice",async(req,res)=>{

const doc=new PDFDocument();

res.setHeader(
"Content-Type",
"application/pdf"
);

doc.pipe(res);

doc.fontSize(20).text("BOOK STORE");

doc.moveDown();

doc.text("Invoice");

doc.text("Order ID : "+req.params.orderId);

doc.end();

});
module.exports = router;
