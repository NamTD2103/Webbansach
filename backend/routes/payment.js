/**
 * VNPay Payment Routes
 * Handles payment creation, return, IPN webhook, and queries
 */

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate, getConnection } = require('../config/db');
const vnpayConfig = require('../config/vnpay');
const vnpayUtils = require('../utils/vnpayUtils');
const oracledb = require('oracledb');

/**
 * GET /api/payment/create-payment-url
 * Create VNPay payment URL and store transaction record
 * 
 * Query/Body Parameters:
 * - orderId: Order ID
 * - amount: Payment amount in VND
 * - userId: User ID
 * - email: User email (optional)
 * - phone: User phone (optional)
 * - bankCode: Bank code like 'NCB', 'AGRIBANK' (optional)
 * - ipAddress: Client IP address
 */
router.post('/create-payment-url', async (req, res) => {
  let connection;
  try {
    const { orderId, amount, userId, email, phone, bankCode, ipAddress } = req.body;

    // Validate required fields
    if (!orderId || !amount || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount, userId',
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be a positive number',
      });
    }

    console.log(`[PAYMENT] Creating payment URL for order ${orderId}, amount: ${amount} VND`);

    // Get connection
    connection = await getConnection();

    // Verify order exists and get order details
    const orderQuery = `
      SELECT o.ORDER_ID, o.USER_ID, o.TOTAL_AMOUNT, o.STATUS
      FROM ORDERS o
      WHERE o.ORDER_ID = :orderId AND o.USER_ID = :userId
    `;

    const orderResult = await connection.execute(orderQuery, { orderId, userId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized',
      });
    }

    // Check if order is already paid
    if (orderResult.rows[0].STATUS === 'PAID' || orderResult.rows[0].STATUS === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid',
      });
    }

    // Generate payment URL
    const paymentData = {
      orderId,
      amount,
      userId,
      email,
      phone,
      bankCode,
      ipAddress: ipAddress || '127.0.0.1',
      orderInfo: `Payment for order ${orderId}`,
    };

    const { paymentUrl, transactionId, vnpParams } = vnpayUtils.createPaymentUrl(paymentData);

    // Store transaction in database
    const transactionInsert = `
      INSERT INTO PAYMENT_TRANSACTIONS 
      (TRANSACTION_ID, ORDER_ID, USER_ID, AMOUNT, STATUS, PAYMENT_METHOD, 
       CREATED_AT, UPDATED_AT, BANK_CODE, TRANSACTION_DATA)
      VALUES (:transactionId, :orderId, :userId, :amount, :status, :paymentMethod, 
              SYSDATE, SYSDATE, :bankCode, :transactionData)
    `;

    await connection.execute(
      transactionInsert,
      {
        transactionId,
        orderId,
        userId,
        amount,
        status: 'PENDING',
        paymentMethod: 'VNPAY',
        bankCode: bankCode || null,
        transactionData: JSON.stringify(vnpParams),
      },
      { autoCommit: true }
    );

    console.log(`[PAYMENT] Transaction ${transactionId} created for order ${orderId}`);

    return res.json({
      success: true,
      message: 'Payment URL created successfully',
      paymentUrl,
      transactionId,
      amount,
      orderId,
    });
  } catch (error) {
    console.error('[PAYMENT] Error creating payment URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment URL',
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
});

/**
 * GET /api/payment/return
 * Handle return from VNPay payment page
 * This is called when user returns from VNPay gateway (browser redirect)
 */
router.get('/return', async (req, res) => {
  let connection;
  try {
    const { vnp_Amount, vnp_BankCode, vnp_BankTranNo, vnp_CardType, vnp_OrderInfo, vnp_PayDate, vnp_ResponseCode, vnp_TMN_Code, vnp_TransactionNo, vnp_TxnRef, vnp_SecureHash, vnp_SecureHashType } = req.query;

    console.log('[PAYMENT] Return from VNPay:', { vnp_TxnRef, vnp_ResponseCode });

    // Verify merchant code
    if (vnp_TMN_Code !== vnpayConfig.tmnCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid merchant code',
      });
    }

    // Verify secure hash
    const isValidHash = vnpayUtils.verifyHash(req.query);
    if (!isValidHash) {
      console.error('[PAYMENT] Hash verification failed for transaction:', vnp_TxnRef);
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    // Parse return data
    const paymentResult = vnpayUtils.parseReturnData(req.query);
    const isSuccessful = vnpayUtils.isPaymentSuccessful(vnp_ResponseCode);

    console.log('[PAYMENT] Payment verification:', {
      transactionId: paymentResult.orderId,
      responseCode: vnp_ResponseCode,
      isSuccessful,
    });

    connection = await getConnection();

    // Update transaction status
    const transactionUpdate = `
      UPDATE PAYMENT_TRANSACTIONS
      SET STATUS = :status, 
          RESPONSE_CODE = :responseCode,
          TRANSACTION_NO = :transactionNo,
          BANK_CODE = :bankCode,
          PAY_DATE = :payDate,
          UPDATED_AT = SYSDATE
      WHERE TRANSACTION_ID = :transactionId
    `;

    await connection.execute(
      transactionUpdate,
      {
        status: isSuccessful ? 'SUCCESS' : 'FAILED',
        responseCode: vnp_ResponseCode,
        transactionNo: vnp_TransactionNo,
        bankCode: vnp_BankCode,
        payDate: vnp_PayDate,
        transactionId: paymentResult.orderId,
      },
      { autoCommit: false }
    );

    // If payment successful, update order
    if (isSuccessful) {
      const orderUpdate = `
        UPDATE ORDERS
        SET STATUS = 'PAID', 
            PAYMENT_METHOD = 'VNPAY',
            TOTAL_AMOUNT = :amount,
            UPDATED_AT = SYSDATE
        WHERE ORDER_ID = (SELECT ORDER_ID FROM PAYMENT_TRANSACTIONS WHERE TRANSACTION_ID = :transactionId)
      `;

      await connection.execute(
        orderUpdate,
        {
          amount: paymentResult.amount,
          transactionId: paymentResult.orderId,
        },
        { autoCommit: false }
      );

      console.log(`[PAYMENT] Order status updated to PAID for transaction ${paymentResult.orderId}`);
    }

    // Commit transaction
    await connection.commit();

    const statusDescription = vnpayUtils.getPaymentStatusDescription(vnp_ResponseCode);

    return res.json({
      success: isSuccessful,
      message: statusDescription,
      transactionId: paymentResult.orderId,
      amount: paymentResult.amount,
      responseCode: vnp_ResponseCode,
      bankTranNo: vnp_BankTranNo,
    });
  } catch (error) {
    console.error('[PAYMENT] Error processing return:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment return',
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
});

/**
 * POST /api/payment/ipn
 * Instant Payment Notification webhook from VNPay
 * This is called server-to-server by VNPay to confirm payment
 * 
 * IMPORTANT: This endpoint must be accessible from the internet
 * Required environment: VNPAY_IPN_URL pointing to this endpoint
 */
router.post('/ipn', async (req, res) => {
  let connection;
  try {
    const { vnp_Amount, vnp_BankCode, vnp_BankTranNo, vnp_CardType, vnp_OrderInfo, vnp_PayDate, vnp_ResponseCode, vnp_TMN_Code, vnp_TransactionNo, vnp_TxnRef, vnp_SecureHash } = req.body;

    console.log('[IPN] Received IPN from VNPay:', { vnp_TxnRef, vnp_ResponseCode });

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ RspCode: '00', Message: 'Received' });

    // Verify merchant code
    if (vnp_TMN_Code !== vnpayConfig.tmnCode) {
      console.error('[IPN] Invalid merchant code:', vnp_TMN_Code);
      return;
    }

    // Verify secure hash
    const isValidHash = vnpayUtils.verifyHash(req.body);
    if (!isValidHash) {
      console.error('[IPN] Hash verification failed');
      return;
    }

    // Parse payment data
    const paymentResult = vnpayUtils.parseReturnData(req.body);
    const isSuccessful = vnpayUtils.isPaymentSuccessful(vnp_ResponseCode);

    console.log('[IPN] Payment verification result:', {
      transactionId: paymentResult.orderId,
      isSuccessful,
    });

    connection = await getConnection();

    // Check if transaction already processed
    const checkQuery = `
      SELECT STATUS FROM PAYMENT_TRANSACTIONS 
      WHERE TRANSACTION_ID = :transactionId
    `;

    const checkResult = await connection.execute(checkQuery, { transactionId: paymentResult.orderId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    if (checkResult.rows && checkResult.rows.length > 0) {
      const currentStatus = checkResult.rows[0].STATUS;
      
      // Skip if already processed
      if (currentStatus === 'SUCCESS' || currentStatus === 'FAILED') {
        console.log('[IPN] Transaction already processed:', paymentResult.orderId);
        return;
      }
    }

    // Update transaction status
    const transactionUpdate = `
      UPDATE PAYMENT_TRANSACTIONS
      SET STATUS = :status, 
          RESPONSE_CODE = :responseCode,
          TRANSACTION_NO = :transactionNo,
          BANK_CODE = :bankCode,
          PAY_DATE = :payDate,
          UPDATED_AT = SYSDATE
      WHERE TRANSACTION_ID = :transactionId
    `;

    await connection.execute(
      transactionUpdate,
      {
        status: isSuccessful ? 'SUCCESS' : 'FAILED',
        responseCode: vnp_ResponseCode,
        transactionNo: vnp_TransactionNo,
        bankCode: vnp_BankCode,
        payDate: vnp_PayDate,
        transactionId: paymentResult.orderId,
      },
      { autoCommit: false }
    );

    // If payment successful, update order
    if (isSuccessful) {
      const orderUpdate = `
        UPDATE ORDERS
        SET STATUS = 'PAID', 
            PAYMENT_METHOD = 'VNPAY',
            TOTAL_AMOUNT = :amount,
            UPDATED_AT = SYSDATE
        WHERE ORDER_ID = (SELECT ORDER_ID FROM PAYMENT_TRANSACTIONS WHERE TRANSACTION_ID = :transactionId)
      `;

      await connection.execute(
        orderUpdate,
        {
          amount: paymentResult.amount,
          transactionId: paymentResult.orderId,
        },
        { autoCommit: false }
      );

      console.log(`[IPN] Order status updated to PAID for transaction ${paymentResult.orderId}`);
    }

    // Commit transaction
    await connection.commit();

    console.log('[IPN] Transaction processed successfully');
  } catch (error) {
    console.error('[IPN] Error processing IPN:', error);
  }
});

/**
 * POST /api/payment/query-status
 * Query payment status from VNPay
 * Used to verify payment status if IPN wasn't received
 */
router.post('/query-status', async (req, res) => {
  try {
    const { transactionId, transactionNo, transactionDate } = req.body;

    if (!transactionId || !transactionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transactionId, transactionDate',
      });
    }

    console.log('[PAYMENT] Querying payment status for:', { transactionId, transactionNo });

    // For production: Call VNPay queryDr API endpoint
    // Below is the structure - you need to implement actual API call
    const queryParams = {
      vnp_Command: vnpayConfig.commands.queryDr,
      vnp_Version: vnpayConfig.version,
      vnp_TmnCode: vnpayConfig.tmnCode,
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Query for transaction ${transactionId}`,
      vnp_CreateDate: vnpayUtils.formatDate(new Date()), // YYYYMMDDHHmmss
      vnp_IpAddr: req.ip || '127.0.0.1',
    };

    // Generate secure hash
    queryParams.vnp_SecureHash = vnpayUtils.generateHash(queryParams, vnpayConfig.secretKey);

    console.log('[PAYMENT] Query params prepared (would be sent to VNPay API)');

    // TODO: Implement actual HTTP call to VNPay queryDr endpoint
    // const response = await axios.post(vnpayConfig.vnpayApiUrl, queryParams);

    return res.json({
      success: true,
      message: 'Query request prepared (implement actual API call)',
      transactionId,
      queryParams,
    });
  } catch (error) {
    console.error('[PAYMENT] Error querying payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to query payment status',
      error: error.message,
    });
  }
});

/**
 * POST /api/payment/refund
 * Request refund for a payment
 * Note: Full refund must be done through VNPay merchant dashboard
 * This is for reference implementation
 */
router.post('/refund', async (req, res) => {
  let connection;
  try {
    const { transactionId, orderId, refundAmount, reason } = req.body;

    if (!transactionId || !orderId || !refundAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transactionId, orderId, refundAmount',
      });
    }

    console.log('[REFUND] Processing refund for:', { transactionId, orderId, refundAmount });

    connection = await getConnection();

    // Verify transaction exists and is paid
    const checkQuery = `
      SELECT * FROM PAYMENT_TRANSACTIONS 
      WHERE TRANSACTION_ID = :transactionId AND STATUS = 'SUCCESS'
    `;

    const checkResult = await connection.execute(checkQuery, { transactionId }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found or not in paid status',
      });
    }

    // Store refund request in database
    const refundInsert = `
      INSERT INTO REFUND_REQUESTS 
      (REFUND_ID, TRANSACTION_ID, ORDER_ID, AMOUNT, REASON, STATUS, CREATED_AT)
      VALUES (refund_seq.NEXTVAL, :transactionId, :orderId, :refundAmount, :reason, 'PENDING', SYSDATE)
    `;

    await connection.execute(
      refundInsert,
      {
        transactionId,
        orderId,
        refundAmount,
        reason: reason || 'Customer requested refund',
      },
      { autoCommit: true }
    );

    console.log('[REFUND] Refund request created for transaction:', transactionId);

    return res.json({
      success: true,
      message: 'Refund request submitted. Please complete refund through VNPay merchant dashboard',
      transactionId,
      refundAmount,
      note: 'VNPay refunds must be processed through merchant dashboard for security',
    });
  } catch (error) {
    console.error('[REFUND] Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
});

/**
 * GET /api/payment/transaction-history
 * Get payment transaction history for user
 */
router.get('/transaction-history/:userId', async (req, res) => {
  let connection;
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    connection = await getConnection();

    const query = `
      SELECT 
        pt.TRANSACTION_ID,
        pt.ORDER_ID,
        pt.AMOUNT,
        pt.STATUS,
        pt.RESPONSE_CODE,
        pt.PAYMENT_METHOD,
        pt.BANK_CODE,
        pt.CREATED_AT,
        pt.PAY_DATE,
        o.STATUS as ORDER_STATUS
      FROM PAYMENT_TRANSACTIONS pt
      LEFT JOIN ORDERS o ON pt.ORDER_ID = o.ORDER_ID
      WHERE pt.USER_ID = :userId
      ORDER BY pt.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await connection.execute(
      query,
      { userId: parseInt(userId), offset: parseInt(offset), limit: parseInt(limit) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json({
      success: true,
      transactions: result.rows || [],
      limit,
      offset,
    });
  } catch (error) {
    console.error('[PAYMENT] Error fetching transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
});

module.exports = router;
