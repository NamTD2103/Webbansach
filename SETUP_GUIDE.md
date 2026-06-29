# 📚 WebBanSach - E-Commerce Platform

A modern, full-stack e-commerce platform for selling books, built with **Node.js + Express (Backend)**, **Next.js (Frontend)**, and **Oracle Database**.

## ⚙️ System Requirements

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Oracle Database**: Already set up with these credentials:
  - User: `system`
  - Password: `123456`
  - Connection String: `localhost:1521/orcl21pdb1`

## 📦 Database Tables

The following tables must exist in your Oracle database:

```sql
USERS (USER_ID, USERNAME, PASSWORD_HASH, ROLE)
CATEGORY (CAT_ID, CAT_NAME)
NHACUNGCAP (MANCC, TENNCC)
SANPHAM (MASP, TENSP, GIABAN, SOLUONGTON, IMAGE_URL, DESCRIPTION, CAT_ID, MANCC)
CART (CART_ID, USER_ID)
CART_ITEM (ITEM_ID, CART_ID, MASP, SOLUONG)
ORDERS (ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, ORDER_DATE)
ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
PAYMENTS (PAYMENT_ID, ORDER_ID, AMOUNT, STATUS)
ADDRESS (ADDR_ID, USER_ID, ADDRESS, CITY, PHONE)
AUDIT_LOG (LOG_ID, TABLE_NAME, OPERATION, USER_ID, TIMESTAMP)
```

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
# From root directory
npm install
```

### 3. Start Backend Server

```bash
cd backend
npm start
# Or for development with auto-reload:
npm run dev
```

The backend will run on **http://localhost:5000**

Server output:
```
╔══════════════════════════════════╗
║  🚀 Server running on port 5000  ║
║  http://localhost:5000            ║
╚══════════════════════════════════╝

✓ Oracle Connection Pool Initialized
```

### 4. Start Frontend Development Server

```bash
# From root directory
npm run dev
```

The frontend will run on **http://localhost:3000**

## 🌐 API Endpoints

### Products
- `GET /api/product` - List all products with pagination
- `GET /api/product/:id` - Get product details
- `GET /api/product/search/query?q=keyword` - Search products

### Cart
- `POST /api/cart/add` - Add product to cart
- `GET /api/cart/:userId` - Get user's cart
- `DELETE /api/cart/item/:userId/:masp` - Remove item from cart

### Orders
- `POST /api/order/create` - Create order from cart
- `POST /api/order/add-item` - Add item to order
- `GET /api/order/:orderId` - Get order details

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/user/:userId` - Get user info

### Health Check
- `GET /health` - Server health status

## 📁 Project Structure

```
webbansach/
├── backend/
│   ├── config/
│   │   └── db.js              # Oracle connection pool
│   ├── middleware/
│   │   └── index.js           # CORS, error handling, logging
│   ├── routes/
│   │   ├── product.js         # Product endpoints
│   │   ├── cart.js            # Cart endpoints
│   │   ├── order.js           # Order endpoints
│   │   └── auth.js            # Authentication endpoints
│   ├── server.js              # Express server setup
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
│
├── app/
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles
│   ├── product/
│   │   └── [id]/page.tsx      # Product detail page
│   ├── cart/
│   │   └── page.tsx           # Shopping cart page
│   └── login/
│       └── page.tsx           # Login/Register page
│
├── lib/
│   └── api.ts                 # API client utilities
│
├── public/                    # Static assets
├── .env.local                 # Frontend env variables
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Frontend dependencies
```

## 🔧 Testing the Application

### 1. Test Backend API

```bash
# Get all products
curl http://localhost:5000/api/product

# Get product details
curl http://localhost:5000/api/product/SP001

# Search products
curl "http://localhost:5000/api/product/search/query?q=javascript"

# Health check
curl http://localhost:5000/health
```

### 2. Test Frontend

Navigate to **http://localhost:3000** in your browser:

1. **Home Page** - Browse products
2. **Product Detail** - Click on any product to see details
3. **Login** - Create account or login (test: username=`test`, password=`123456`)
4. **Cart** - Add products and checkout
5. **Order** - Create and track orders

## 🎨 Features

### Frontend (Next.js + React)
- ✅ Modern, responsive UI (Shopee/Lazada style)
- ✅ Product listing with pagination
- ✅ Product search functionality
- ✅ Product detail page
- ✅ Shopping cart management
- ✅ User authentication (login/register)
- ✅ Order creation
- ✅ Loading skeletons for better UX
- ✅ Error handling
- ✅ Local storage for user session
- ✅ Tailwind CSS for styling

### Backend (Node.js + Express)
- ✅ Oracle connection pooling
- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Transaction management
- ✅ Stock validation and management
- ✅ Request logging
- ✅ CORS support
- ✅ Async/await pattern
- ✅ Security best practices

## 🛡️ Important Notes

### Oracle Field Names
Oracle returns field names in **UPPERCASE**. The API is configured with `OUT_FORMAT_OBJECT` to properly map fields:
- `MASP` - Product ID
- `TENSP` - Product Name
- `GIABAN` - Price
- `SOLUONGTON` - Stock Quantity
- `IMAGE_URL` - Product Image
- `DESCRIPTION` - Product Description

### Authentication
- Simple password hashing with SHA256 (upgrade to bcrypt in production)
- User stored in localStorage client-side
- Each request from frontend includes user ID from localStorage
- For production: implement JWT tokens

### Cart Management
- Automatic cart creation on first add-to-cart
- Stock validation before adding items
- Cart items cleared after successful order

### Database Transactions
- All insert/update/delete operations use transactions
- Auto-rollback on error
- Auto-commit on success

## 🐛 Troubleshooting

### Backend won't connect to Oracle
1. Verify Oracle is running: `sqlplus system/123456@localhost:1521/orcl21pdb1`
2. Check connection string in `backend/config/db.js`
3. Verify database tables exist with correct names (UPPERCASE)
4. Check `backend/.env` file

### Frontend API errors
1. Verify backend is running on port 5000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for error details
4. Verify CORS is enabled in backend

### Products not showing
1. Verify `SANPHAM` table has data
2. Check field names are in UPPERCASE
3. Check API response: `curl http://localhost:5000/api/product`
4. Check browser console for errors

### Can't login
1. Verify `USERS` table has test user
2. Check password is hashed correctly
3. Verify `PASSWORD_HASH` field exists in `USERS` table

## 📊 Data Flow

```
User Browser (Next.js Frontend)
    ↓
API Requests (axios/fetch)
    ↓
Express Server (Node.js Backend)
    ↓
Connection Pool
    ↓
Oracle Database
    ↓
Results JSON
    ↓
Frontend Components (React)
    ↓
UI Display (Tailwind CSS)
```

## 🔐 Security Considerations

For **production deployment**:

1. **Authentication**
   - Replace SHA256 with bcrypt
   - Implement JWT tokens
   - Add refresh token rotation
   - Implement rate limiting

2. **Database**
   - Use encrypted connections
   - Implement parameterized queries (already done)
   - Regular backups
   - Monitor slow queries

3. **API**
   - Add input validation/sanitization
   - Implement request logging
   - Add API rate limiting
   - Use HTTPS only
   - Implement CORS properly

4. **Frontend**
   - Never store sensitive data in localStorage
   - Implement proper session timeout
   - Use secure cookies with HttpOnly flag

## 📝 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_USER=system
DB_PASSWORD=123456
DB_CONNECT_STRING=localhost:1521/orcl21pdb1
```

## 🚀 Deployment

### Frontend (Next.js)
```bash
npm run build
npm start
```

### Backend (Node.js)
```bash
npm install --production
node server.js
```

## 📚 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, React 18+, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Database | Oracle Database |
| API | RESTful API |
| State Management | React Hooks |
| HTTP Client | Fetch API |

## 📞 Support

For issues or questions:
1. Check the terminal/console for error logs
2. Verify all prerequisites are installed
3. Ensure Oracle database is accessible
4. Check network connectivity between frontend and backend

## 📄 License

MIT License - Feel free to use this project for learning and development.

---

**Last Updated**: March 2026  
**Version**: 1.0.0
