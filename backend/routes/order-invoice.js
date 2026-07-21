const express = require('express');
const router = express.Router();

const oracledb = require('oracledb');
const { executeQuery } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper: safe string
function asString(v) {
  return v === null || v === undefined ? null : String(v);
}

function toMoney(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapOrderStatus(status) {
  // ORDERS.STATUS in this repo: PENDING, PROCESSING, COMPLETED, CANCELLED
  const s = asString(status);
  return s || 'PENDING';
}

function mapPaymentStatus(paymentStatus) {
  // PAYMENT_TRANSACTIONS.STATUS in this repo: PENDING, SUCCESS, FAILED (and possibly CANCELLED)
  const s = asString(paymentStatus);
  if (!s) return 'PENDING';
  return s;
}

/**
 * GET /api/order/:orderId/invoice
 * Returns invoice detail for a specific order.
 * ✅ PROTECTED
 */
router.get('/:orderId/invoice', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderId',
      });
    }

    // 1) Load order header + verify ownership
    const orderHeaderSql = `
      SELECT
        o.ORDER_ID,
        o.USER_ID,
        o.STATUS as ORDER_STATUS,
        o.TOTAL_AMOUNT,
        o.PAYMENT_METHOD,
        o.ORDER_DATE,
        o.UPDATED_AT,
        u.USERNAME,
        u.EMAIL,
        u.FULLNAME
      FROM ORDERS o
      LEFT JOIN USERS u ON u.USER_ID = o.USER_ID
      WHERE o.ORDER_ID = :orderId
    `;

    const orderHeaderResult = await executeQuery(orderHeaderSql, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: 1,
    });

    if (!orderHeaderResult.rows || orderHeaderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orderHeaderResult.rows[0];

    // Ownership check
    if (Number(order.USER_ID) !== Number(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - you do not own this order',
      });
    }

    // 2) Payment transaction (if exists)
    const paymentSql = `
      SELECT
        pt.TRANSACTION_ID,
        pt.AMOUNT,
        pt.STATUS as PAYMENT_STATUS,
        pt.PAY_DATE,
        pt.PAYMENT_METHOD,
        pt.BANK_CODE,
        pt.TRANSACTION_NO
      FROM PAYMENT_TRANSACTIONS pt
      WHERE pt.ORDER_ID = :orderId
      ORDER BY pt.CREATED_AT DESC
    `;

    const paymentResult = await executeQuery(paymentSql, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: 1,
    });

    const paymentRow = paymentResult.rows && paymentResult.rows.length > 0 ? paymentResult.rows[0] : null;

    // 3) Default address (ADDRESS table exists in init-db)
    // If ADDRESS has no IS_DEFAULT=Y, we fallback to latest.
    const addressSql = `
      SELECT
        a.ADDRESS,
        a.CITY,
        a.PHONE,
        a.IS_DEFAULT
      FROM ADDRESS a
      WHERE a.USER_ID = :userId
      ORDER BY CASE WHEN a.IS_DEFAULT = 'Y' THEN 0 ELSE 1 END, a.CREATED_AT DESC
    `;

    const addressResult = await executeQuery(addressSql, { userId: order.USER_ID }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: 1,
    });

    const addressRow = addressResult.rows && addressResult.rows.length > 0 ? addressResult.rows[0] : null;

    // 4) Items + product data
    const itemsSql = `
      SELECT
        oi.ITEM_ID,
        oi.MASP,
        sp.TENSP,
        sp.MANCC,
        sp.HINHANH AS IMAGE_URL,
        oi.SOLUONG,
        oi.PRICE,
        (oi.SOLUONG * oi.PRICE) AS LINE_TOTAL
      FROM ORDER_ITEMS oi
      LEFT JOIN SANPHAM sp ON sp.MASP = oi.MASP
      WHERE oi.ORDER_ID = :orderId
      ORDER BY oi.ITEM_ID
    `;

    const itemsResult = await executeQuery(itemsSql, { orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    const items = (itemsResult.rows || []).map((r) => ({
      itemId: r.ITEM_ID,
      sku: asString(r.MASP),
      title: asString(r.TENSP) || 'Sản phẩm',
      imageUrl: asString(r.IMAGE_URL) || '/placeholder-book.jpg',
      manufacturer: asString(r.MANCC),
      quantity: Number(r.SOLUONG) || 0,
      unitPrice: toMoney(r.PRICE),
      discount: 0, // repo hiện chưa có discount/giá khuyến mãi lưu riêng
      lineTotal: toMoney(r.LINE_TOTAL),
    }));

    // 5) Response contract for frontend invoice UI
    const response = {
      success: true,
      data: {
        order: {
          orderId: Number(order.ORDER_ID),
          orderDate: order.ORDER_DATE,
          orderStatus: mapOrderStatus(order.ORDER_STATUS),
          totalAmount: toMoney(order.TOTAL_AMOUNT),
        },
        invoice: {
          invoiceId: `HD-${String(order.ORDER_ID).padStart(6, '0')}`,
        },
        customer: {
          fullName: asString(order.FULLNAME) || asString(order.USERNAME) || 'Khách hàng',
          email: asString(order.EMAIL),
          phone: addressRow && addressRow.PHONE ? asString(addressRow.PHONE) : null,
          address: addressRow && addressRow.ADDRESS ? asString(addressRow.ADDRESS) : null,
          city: addressRow && addressRow.CITY ? asString(addressRow.CITY) : null,
        },
        payment: {
          transactionId: paymentRow ? asString(paymentRow.TRANSACTION_ID) : null,
          paymentStatus: paymentRow ? mapPaymentStatus(paymentRow.PAYMENT_STATUS) : 'PENDING',
          paymentDate: paymentRow ? asString(paymentRow.PAY_DATE) : null,
          paymentMethod: paymentRow ? asString(paymentRow.PAYMENT_METHOD) : asString(order.PAYMENT_METHOD),
          bankCode: paymentRow ? asString(paymentRow.BANK_CODE) : null,
          transactionNo: paymentRow ? asString(paymentRow.TRANSACTION_NO) : null,
          amount: paymentRow ? toMoney(paymentRow.AMOUNT) : toMoney(order.TOTAL_AMOUNT),
        },
        items,
        pricing: {
          // Vì repo chưa có tách shipping/voucher/VAT trong DB, frontend sẽ tự tính VAT/ship/voucher = 0
          subtotal: items.reduce((sum, it) => sum + it.lineTotal, 0),
          discount: 0,
          shippingFee: 0,
          vatRate: 0.1, // 10% giả định cho VAT
          vatAmount: 0,
          total: toMoney(order.TOTAL_AMOUNT),
        },
      },
    };

    // compute VAT amount based on subtotal if not matching (client can adjust)
    response.data.pricing.vatAmount = Math.round(response.data.pricing.subtotal * response.data.pricing.vatRate);

    return res.json(response);
  } catch (error) {
    console.error('[ORDER-INVOICE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
});

module.exports = router;

