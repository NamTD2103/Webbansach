const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const { initializePool, closePool } = require('./config/db');
const { errorHandler, requestLogger } = require('./middleware');

// Import routes
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const orderCancellationRoutes = require('./routes/order-cancellation'); // ✅ NEW: Order cancellation
const orderInvoiceRoutes = require('./routes/order-invoice');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const chatbotRoutes = require('./routes/chatbot');
const voucherRoutes = require("./routes/voucher");
const recommendationRoutes = require('./routes/recommendations');
const profileRoutes = require('./routes/profile');
const questionRoutes = require("./routes/question");
const reviewRoutes=require("./routes/review");
const chatRoutes = require("./routes/chat");
const loyaltyRoutes = require("./routes/loyalty");
// const adminOrderRoutes =require("./routes/admin/orders");
// Initialize Express app

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;







// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SECURITY: Add cookie parser for httpOnly cookies support
app.use(cookieParser());

// ✅ SECURITY: Configure CORS to support httpOnly cookies (credentials: include)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from localhost and your production domain
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://192.168.1.108:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

app.use(requestLogger);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  },
});

app.set("io", io);
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("newMessage", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected");
  });
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/order', orderCancellationRoutes); // ✅ NEW: Order cancellation
app.use('/api/order', orderInvoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/voucher', voucherRoutes);
app.use("/api/review",reviewRoutes);
// app.use("/api/admin/orders",adminOrderRoutes);
app.use("/api/admin/reviews",reviewRoutes);
app.use("/api/question", questionRoutes);

app.use("/api/admin/questions", questionRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/loyalty", loyaltyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handling middleware
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database connection pool
    await initializePool();

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════╗`);
      console.log(`║  🚀 Server running on port ${PORT}    ║`);
      console.log(`║  http://localhost:${PORT}              ║`);
      console.log(`╚══════════════════════════════════╝\n`);

      console.log('📚 Available endpoints:');
      console.log('  GET  /api/product              - List all products');
      console.log('  GET  /api/product/:id          - Get product details');
      console.log('  GET  /api/product/search/query - Search products');
      console.log('  POST /api/cart/add             - Add to cart');
      console.log('  GET  /api/cart/:userId         - Get cart');
      console.log('  POST /api/order/create         - Create order');
      console.log('  GET  /api/order/:orderId       - Get order details');
      console.log('  POST /api/auth/login           - Login');
      console.log('  POST /api/auth/register        - Register');
      console.log('  POST /api/payment/create-payment-url - Create VNPay URL');
      console.log('  GET  /api/payment/return       - VNPay return callback');
      console.log('  POST /api/payment/ipn          - VNPay IPN webhook');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start the server
startServer();
