# 🎨 Frontend Architecture - Visual Diagrams

## 1. Complete Component Dependency Tree

```
webbansach/
│
├── [Root] layout.tsx
│   ├── <ChatBotClient />
│   │   └── <ChatBotWrapper /> (dynamic import, SSR: false)
│   │       └── <ChatBot position="bottom-right" theme="light" />
│   │           ├── <ChatMessage /> (repeated for each message)
│   │           ├── <input /> Send message
│   │           └── <button /> Clear conversation
│   │
│   └── {children}
│       │
│       ├──── / (HOME)
│       │      ├── <CategoryMegaMenu onSelectCategory={} />
│       │      ├── [SEARCH] Search input
│       │      ├── [FILTER] Price range slider
│       │      ├── [FILTER] Category dropdown
│       │      ├── [PAGINATE] Page controls
│       │      ├── <ProductCard /> (repeated)
│       │      │   ├── <img src={IMAGE_URL} />
│       │      │   ├── <p>{TENSP}</p>
│       │      │   ├── <p>{GIABAN}</p>
│       │      │   └── <button onClick={() => router.push(`/product/${MASP}`)}>
│       │      └── <Footer />
│       │
│       ├──── /login
│       │      ├── <LoginForm>
│       │      │   ├── <input type="text" name="emailOrUsername" />
│       │      │   ├── <input type="password" name="password" />
│       │      │   ├── <input type="checkbox" name="rememberMe" />
│       │      │   └── <button type="submit">Login</button>
│       │      │       └── POST /api/auth/login → redirect based on role
│       │      │
│       │      ├── [TAB TOGGLE]
│       │      │   └── Switches to RegisterForm
│       │      │
│       │      ├── <RegisterForm>
│       │      │   ├── <input type="text" name="username" />
│       │      │   ├── <input type="email" name="email" />
│       │      │   ├── <input type="password" name="password" />
│       │      │   └── <button type="submit">Register</button>
│       │      │       └── POST /api/auth/register → auto login
│       │      │
│       │      ├── <ForgotPasswordForm>
│       │      │   ├── <input type="email" />
│       │      │   └── <button>Reset Password</button>
│       │      │
│       │      └── <Footer />
│       │
│       ├──── /product/[id]
│       │      ├── [FETCH] useEffect(() => productAPI.getById(id))
│       │      ├── {loading && <ProductSkeleton />}
│       │      ├── <img src={product.IMAGE_URL} alt={product.TENSP} />
│       │      ├── <h1>{product.TENSP}</h1>
│       │      ├── <p className="price">{product.GIABAN}</p>
│       │      ├── <p className="description">{product.DESCRIPTION}</p>
│       │      ├── <p className="stock">{product.SOLUONGTON} in stock</p>
│       │      ├── <input type="number" min="1" max={product.SOLUONGTON} />
│       │      ├── <button onClick={handleAddToCart}>
│       │      │   └── IF NOT LOGGED IN: redirect to /login
│       │      │   └── ELSE: cartAPI.addToCart(userId, productId, qty)
│       │      └── <Footer />
│       │
│       ├──── /cart
│       │      ├── [AUTH CHECK] authAPI.getCurrentUser()
│       │      │   └── IF NOT LOGGED IN: redirect to /login
│       │      ├── [FETCH] useEffect(() => cartAPI.getCart(userId))
│       │      ├── {loading && <CartSkeleton />}
│       │      ├── {cartItems.map(item => (
│       │      │   <CartItem>
│       │      │     ├── <img src={item.IMAGE_URL} />
│       │      │     ├── <p>{item.TENSP}</p>
│       │      │     ├── <p>{item.SOLUONG} x {item.GIABAN}</p>
│       │      │     ├── <p className="subtotal">{item.TOTAL_PRICE}</p>
│       │      │     └── <button onClick={removeFromCart}>Remove</button>
│       │      │   ))}
│       │      ├── <div className="summary">
│       │      │   ├── <p>Subtotal: {subtotal}</p>
│       │      │   ├── <p>Tax: {tax}</p>
│       │      │   └── <p className="total">Total: {total}</p>
│       │      ├── <button onClick={() => router.push('/checkout')}>
│       │      │   Proceed to Checkout
│       │      │ </button>
│       │      └── <Footer />
│       │
│       ├──── /checkout
│       │      ├── [AUTH CHECK] authAPI.getCurrentUser()
│       │      │   └── IF NOT LOGGED IN: redirect to /login
│       │      ├── [FETCH] useEffect(() => {
│       │      │   cartAPI.getCart(userId)
│       │      │ })
│       │      ├── <form onSubmit={handleSubmit}>
│       │      │   │
│       │      │   ├── <CheckoutForm>
│       │      │   │   ├── <input name="fullname" />
│       │      │   │   ├── <input name="phone" />
│       │      │   │   └── <input name="email" />
│       │      │   │
│       │      │   ├── <AddressForm>
│       │      │   │   ├── <select name="province" />
│       │      │   │   │   └── onChange: updates shipping fee
│       │      │   │   ├── <select name="district" />
│       │      │   │   ├── <select name="ward" />
│       │      │   │   └── <input name="street" />
│       │      │   │
│       │      │   ├── <PaymentMethod>
│       │      │   │   ├── <radio value="cod"> COD </radio>
│       │      │   │   ├── <radio value="vnpay"> VNPay </radio>
│       │      │   │   └── <radio value="momo"> Momo </radio>
│       │      │   │
│       │      │   ├── <VoucherSelector>
│       │      │   │   ├── <input type="text" placeholder="Voucher code" />
│       │      │   │   ├── <button onClick={applyVoucher}>Apply</button>
│       │      │   │   │   └── Validates against DEMO_VOUCHERS array
│       │      │   │   ├── <DiscountVouchers>
│       │      │   │   │   └── {DEMO_VOUCHERS.map(voucher => (
│       │      │   │   │       <VoucherCard 
│       │      │   │   │         code={voucher.code}
│       │      │   │   │         description={voucher.description}
│       │      │   │   │         onClick={() => selectVoucher(voucher)}
│       │      │   │   │       />
│       │      │   │   │     ))}
│       │      │   │   └── <p>Applied discount: {discountResult.totalDiscount}</p>
│       │      │   │
│       │      │   ├── <OrderSummary>
│       │      │   │   ├── <p>Subtotal: {subtotal}</p>
│       │      │   │   ├── <p>Shipping: {shippingFee}</p>
│       │      │   │   ├── <p>Discount: -{discount}</p>
│       │      │   │   └── <p className="total">Total: {total}</p>
│       │      │   │
│       │      │   └── <button type="submit">
│       │      │       Place Order
│       │      │     </button>
│       │      │     └── orderAPI.createOrder({...})
│       │      │        └── navigate to /order-success?id={orderId}
│       │      │
│       │      ├── {paymentMethod === 'vnpay' && (
│       │      │   <VNPayCheckout
│       │      │     orderId={order.id}
│       │      │     amount={total}
│       │      │     userId={user.id}
│       │      │   />
│       │      │ )}
│       │      │   ├── <select name="bank" />
│       │      │   │   └── Bank options list
│       │      │   └── <button onClick={handlePayment}>
│       │      │       Pay with VNPay
│       │      │     </button>
│       │      │     └── createVNPayPayment(orderId, amount, userId, bank)
│       │      │        └── Redirect to VNPay gateway (demo)
│       │      │
│       │      ├── {toast && <Toast message={toast} type={type} />}
│       │      └── <Footer />
│       │
│       ├──── /account
│       │      ├── [AUTH CHECK] authAPI.getCurrentUser()
│       │      │   └── IF NOT LOGGED IN: redirect to /login
│       │      ├── [FETCH] useEffect(() => {
│       │      │   orderAPI.getUserOrders(userId, 1, 20)
│       │      │ })
│       │      │
│       │      ├── <UserProfile>
│       │      │   │
│       │      │   ├── <ProfileHeader user={user}>
│       │      │   │   ├── <div className="avatar">
│       │      │   │   │   └── {user.fullname?.[0]?.toUpperCase()}
│       │      │   │   └── {!isEditing ? (
│       │      │   │       <div>
│       │      │   │         ├── <h1>{user.fullName}</h1>
│       │      │   │         ├── <p>{user.email}</p>
│       │      │   │         ├── <p>{user.phone}</p>
│       │      │   │         └── <button onClick={() => setIsEditing(true)}>
│       │      │   │             Edit
│       │      │   │           </button>
│       │      │   │       ) : (
│       │      │   │       <form>
│       │      │   │         ├── <input value={fullName} onChange={} />
│       │      │   │         ├── <input value={email} onChange={} />
│       │      │   │         ├── <input value={phone} onChange={} />
│       │      │   │         └── <button onClick={handleSave}>
│       │      │   │             Save
│       │      │   │           </button>
│       │      │   │       )}
│       │      │   │
│       │      │   ├── <PasswordForm>
│       │      │   │   ├── <input type="password" name="old" />
│       │      │   │   ├── <input type="password" name="new" />
│       │      │   │   └── <button onClick={handleChangePassword}>
│       │      │   │       Change Password
│       │      │   │     </button>
│       │      │   │
│       │      │   └── <OrderHistory orders={orders}>
│       │      │       └── {orders.map(order => (
│       │      │           <OrderCard>
│       │      │             ├── <p>Order #{order.ORDER_ID}</p>
│       │      │             ├── <p>{order.ORDER_DATE}</p>
│       │      │             ├── <p>{order.STATUS}</p>
│       │      │             ├── <p>{order.TOTAL_AMOUNT}</p>
│       │      │             └── <button onClick={() => setSelectedOrder(order)}>
│       │      │                 View Details
│       │      │               </button>
│       │      │           ))}
│       │      │
│       │      ├── {selectedOrder && (
│       │      │   <OrderDetail>
│       │      │     ├── <p>Order ID: {selectedOrder.ORDER_ID}</p>
│       │      │     ├── <p>Status: {selectedOrder.STATUS}</p>
│       │      │     ├── <p>Date: {selectedOrder.ORDER_DATE}</p>
│       │      │     ├── <table>
│       │      │     │   └── {selectedOrder.items.map(item => (
│       │      │     │       <tr>
│       │      │     │         ├── <td>{item.TENSP}</td>
│       │      │     │         ├── <td>{item.SOLUONG}</td>
│       │      │     │         ├── <td>{item.PRICE}</td>
│       │      │     │         └── <td>{item.TOTAL}</td>
│       │      │     │       </tr>
│       │      │     │     ))}
│       │      │     └── <p className="total">Total: {selectedOrder.TOTAL_AMOUNT}</p>
│       │      │   )
│       │      │ )}
│       │      │
│       │      ├── {toast && <Toast />}
│       │      └── <Footer />
│       │
│       ├──── /order-success?id={orderId}
│       │      ├── <div className="success-icon">✓</div>
│       │      ├── <h1>Order Successful!</h1>
│       │      ├── <div className="order-id">
│       │      │   └── <p>Order ID: {orderId}</p>
│       │      ├── <div className="info-box">
│       │      │   ├── <p>✓ Order received</p>
│       │      │   ├── <p>✓ Confirmation email sent</p>
│       │      │   ├── <p>✓ Ships in 1-3 days</p>
│       │      │   └── <p>✓ Track in your account</p>
│       │      ├── <Link href="/account">View Orders</Link>
│       │      ├── <Link href="/">Continue Shopping</Link>
│       │      └── <Footer />
│       │
│       └──── /admin
│              ├── [AUTHORIZATION CHECK]
│              │   └── authAPI.getCurrentUser()
│              │       ├── IF !user: redirect to /login
│              │       └── IF user.role !== 'ADMIN': redirect to /
│              │
│              ├── <AdminDashboard>
│              │   ├── <TabNavigation>
│              │   │   ├── <button>Dashboard</button>
│              │   │   ├── <button>Products</button>
│              │   │   ├── <button>Accounts</button>
│              │   │   └── <button>Orders</button>
│              │   │
│              │   ├── {activeTab === 'dashboard' && (
│              │   │   <DashboardTab>
│              │   │     ├── <RevenueChart
│              │   │     │   data={orderData}
│              │   │     │   />
│              │   │     │   └── Recharts LineChart component
│              │   │     │
│              │   │     ├── <div className="stats-grid">
│              │   │     │   ├── <StatBox
│              │   │     │   │   title="Total Products"
│              │   │     │   │   value={totalProducts}
│              │   │     │   │   icon="📦"
│              │   │     │   │ />
│              │   │     │   ├── <StatBox
│              │   │     │   │   title="Total Orders"
│              │   │     │   │   value={totalOrders}
│              │   │     │   │   icon="📋"
│              │   │     │   │ />
│              │   │     │   └── <StatBox
│              │   │     │       title="Total Revenue"
│              │   │     │       value={totalRevenue}
│              │   │     │       icon="💰"
│              │   │     │     />
│              │   │     │
│              │   │     ├── <ProductSection title="Best Sellers">
│              │   │     │   <ProductTopList products={bestSellers} />
│              │   │     │
│              │   │     └── <ProductSection title="Worst Sellers">
│              │   │         <ProductTopList products={worstSellers} />
│              │   │ )}
│              │   │
│              │   ├── {activeTab === 'products' && (
│              │   │   <ProductsTab>
│              │   │     ├── <button onClick={() => setIsProductModalOpen(true)}>
│              │   │     │   + Create Product
│              │   │     │ </button>
│              │   │     │
│              │   │     ├── {isProductModalOpen && (
│              │   │     │   <ProductModal
│              │   │     │     product={editingProduct}
│              │   │     │     onSubmit={handleSaveProduct}
│              │   │     │     onClose={() => setIsProductModalOpen(false)}
│              │   │     │   >
│              │   │     │     ├── <input name="TENSP" />
│              │   │     │     ├── <input name="GIABAN" type="number" />
│              │   │     │     ├── <input name="SOLUONGTON" type="number" />
│              │   │     │     ├── <input name="IMAGE_URL" />
│              │   │     │     ├── <textarea name="DESCRIPTION" />
│              │   │     │     └── <button type="submit">
│              │   │     │         {editingProduct ? 'Update' : 'Create'}
│              │   │     │       </button>
│              │   │     │       └── productAPI.create() or update()
│              │   │     │   )
│              │   │     │ )}
│              │   │     │
│              │   │     ├── <ProductTable
│              │   │     │   products={products}
│              │   │     │   onEdit={setEditingProduct}
│              │   │     │   onDelete={deleteProduct}
│              │   │     │ >
│              │   │     │   └── {products.map(p => (
│              │   │     │       <tr>
│              │   │     │         ├── <td>{p.MASP}</td>
│              │   │     │         ├── <td>{p.TENSP}</td>
│              │   │     │         ├── <td>{p.GIABAN}</td>
│              │   │     │         ├── <td>{p.SOLUONGTON}</td>
│              │   │     │         ├── <button onClick={() => onEdit(p)}>Edit</button>
│              │   │     │         └── <button onClick={() => onDelete(p.MASP)}>
│              │   │     │             Delete
│              │   │     │           </button>
│              │   │     │       ))}
│              │   │     │
│              │   │     └── <Pagination
│              │   │         currentPage={currentPage}
│              │   │         totalPages={totalPages}
│              │   │         onPageChange={setCurrentPage}
│              │   │       />
│              │   │ )}
│              │   │
│              │   ├── {activeTab === 'accounts' && (
│              │   │   <AccountsTab>
│              │   │     ├── <button onClick={() => setIsAccountModalOpen(true)}>
│              │   │     │   + Create Account
│              │   │     │ </button>
│              │   │     │
│              │   │     ├── {isAccountModalOpen && (
│              │   │     │   <AccountModal
│              │   │     │     user={editingUser}
│              │   │     │     onSubmit={handleSaveUser}
│              │   │     │     onClose={() => setIsAccountModalOpen(false)}
│              │   │     │   >
│              │   │     │     ├── <input name="USERNAME" />
│              │   │     │     ├── <input name="EMAIL" />
│              │   │     │     ├── <input name="PASSWORD" type="password" />
│              │   │     │     ├── <select name="ROLE">
│              │   │     │     │   <option>USER</option>
│              │   │     │     │   <option>ADMIN</option>
│              │   │     │     │ </select>
│              │   │     │     └── <button type="submit">
│              │   │     │         {editingUser ? 'Update' : 'Create'}
│              │   │     │       </button>
│              │   │     │       └── adminAPI.createUser() or updateUser()
│              │   │     │   )
│              │   │     │ )}
│              │   │     │
│              │   │     ├── <AccountsTable
│              │   │     │   users={users}
│              │   │     │   onEdit={setEditingUser}
│              │   │     │   onDelete={deleteUser}
│              │   │     │ />
│              │   │     │
│              │   │     └── <Pagination />
│              │   │ )}
│              │   │
│              │   ├── {activeTab === 'orders' && (
│              │   │   <OrdersTab>
│              │   │     ├── <ProductSection title="All Orders" />
│              │   │     ├── OrderTable with pagination
│              │   │     ├── <ProductSection title="Best Sellers" />
│              │   │     └── <ProductTopList />
│              │   │ )}
│              │   │
│              │   └── {toast && <Toast />}
│              │
│              └── <Footer />
```

---

## 2. API Request Flow Diagram

```
Frontend Component
    │
    ├─── try {
    │    const response = await API_CALL()
    │
    ├─── setLoading(true)
    │
    ├─── HTTP Request
    │    │
    │    ├─ Method: GET/POST/PUT/DELETE
    │    ├─ URL: http://localhost:5000/api/...
    │    ├─ Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ...' }
    │    └─ Body: JSON.stringify(data) [if POST/PUT]
    │
    ├─── Network
    │    │
    │    └─► Backend API Server
    │        │
    │        ├─ Route Handler
    │        ├─ Validation
    │        ├─ Database Query
    │        └─ Response: { success: true, data: {...}, message: '...' }
    │
    ├─── Response Handler
    │    │
    │    ├─ if (!response.ok) throw Error
    │    ├─ const data = await response.json()
    │    └─ setData(data.data || [])
    │
    └─── finally {
         setLoading(false)
         setError(null) or setError(error.message)
    }
```

---

## 3. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   LOGIN/REGISTER PAGE                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ User enters credentials
                       │
                       ├─ POST /api/auth/login
                       │       or
                       │  POST /api/auth/register (with role: 'USER' HARDCODED)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND VALIDATION                      │
├─────────────────────────────────────────────────────────────┤
│ - Validate username/password                                 │
│ - Check database for user                                    │
│ - Generate JWT tokens (accessToken, refreshToken)           │
│ - Return: {                                                  │
│     success: true,                                           │
│     user: {                                                  │
│       userId: 1,                                             │
│       username: 'user1',                                     │
│       email: 'user@example.com',                             │
│       role: 'USER' or 'ADMIN'  ◄─── SERVER DECIDES!         │
│     },                                                       │
│     tokens: {                                                │
│       accessToken: 'eyJhbG...',                              │
│       refreshToken: 'eyJhbG...'                              │
│     }                                                        │
│   }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND STORAGE                            │
├─────────────────────────────────────────────────────────────┤
│ localStorage.setItem('user', JSON.stringify(user))           │
│ localStorage.setItem('accessToken', tokens.accessToken)    │
│ localStorage.setItem('refreshToken', tokens.refreshToken)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
       ROLE ===          ROLE ===
       'ADMIN'           'USER'
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │  /admin      │      │  /account    │
    │  Dashboard   │      │  My Profile  │
    │  ✓ View all  │      │  ✓ View own  │
    │    products  │      │    orders    │
    │  ✓ CRUD      │      │  ✓ Edit      │
    │    products  │      │    profile   │
    │  ✓ View all  │      │  ✓ Change    │
    │    users     │      │    password  │
    │  ✓ View all  │      │  ✓ View own  │
    │    orders    │      │    addresses │
    └──────────────┘      └──────────────┘
            │                     │
            └────────────┬────────┘
                         │
        ┌────────────────┴──────────────┐
        │                               │
    ON EVERY API CALL                   │
        │                               │
    Include Authorization Header        │
        │                               │
        ├─ Get token from localStorage  │
        └─ headers['Authorization'] =   │
          `Bearer ${accessToken}`       │
                  │                     │
                  ▼                     │
            BACKEND CHECKS              │
            TOKEN VALIDITY              │
                  │                     │
        ┌─────────┴─────────┐           │
        │                   │           │
    VALID            INVALID           │
        │                   │           │
        ├─► Continue   ├─► Refresh    │
        │   Request    │   Token      │
        │   ✓          │   OR         │
        │              ├─► Redirect   │
        │              │   to /login  │
        │              │   ✓          │
        │              │              │
        └──────────────┴──────────────┘
```

---

## 4. Checkout & Order Creation Flow

```
START: /checkout PAGE
    │
    ├─ Check auth: authAPI.getCurrentUser()
    │  └─ If null → redirect to /login
    │
    ├─ Load cart from localStorage OR API
    │  └─ cartAPI.getCart(userId)
    │
    ├─ FORM ENTRY
    │  │
    │  ├─ Customer Info
    │  │  ├─ Full Name (validation: required)
    │  │  ├─ Phone (validation: format 0XXXXXXXXX)
    │  │  └─ Email (validation: email format)
    │  │
    │  ├─ Delivery Address
    │  │  ├─ Province (hard-coded list)
    │  │  │  └─ onChange: Update shippingFee
    │  │  │     HN=0, HCM=0, DN=15K, HP=20K, OTHER=30K
    │  │  ├─ District
    │  │  ├─ Ward
    │  │  └─ Street Address
    │  │
    │  ├─ Payment Method
    │  │  ├─ COD (Cash on Delivery)
    │  │  │  └─ Order created immediately
    │  │  ├─ VNPay (Demo)
    │  │  │  └─ Show bank selector
    │  │  │     └─ On submit: createVNPayPayment()
    │  │  │        └─ Redirect to VNPay simulator
    │  │  └─ Momo (Demo)
    │  │     └─ Similar to VNPay
    │  │
    │  └─ Voucher Code
    │     ├─ <input type="text" placeholder="Enter voucher code" />
    │     ├─ <button>Apply Voucher</button>
    │     │  └─ Check against DEMO_VOUCHERS:
    │     │     ├─ DEMO50: 10% off (max 500K)
    │     │     ├─ SAVE100K: 100K off (min 500K order)
    │     │     ├─ WELCOME: 5% off (max 200K)
    │     │     ├─ SHIP2K: 20K off shipping
    │     │     └─ SYSCM99: 50K off (min 300K order)
    │     │
    │     └─ Display all demo vouchers
    │
    ├─ CALCULATE PRICES
    │  │
    │  ├─ Subtotal = sum(cartItems.price × quantity)
    │  │
    │  ├─ Shipping = SHIPPING_FEES[province]
    │  │
    │  ├─ Discount = VoucherSelector calculates:
    │  │  ├─ Check min order amount
    │  │  ├─ Calculate discount (% or fixed)
    │  │  └─ Apply max discount limit
    │  │
    │  └─ Total = Subtotal + Shipping - Discount
    │
    ├─ VALIDATION
    │  │
    │  ├─ Customer info required
    │  ├─ Phone format: 0\d{9,10}
    │  ├─ Email format: \S+@\S+\.\S+
    │  ├─ Address fields required
    │  └─ If any error: show error messages, stop
    │
    ├─ FORM SUBMIT
    │  │
    │  └─ POST /api/order
    │     │
    │     ├─ Payload:
    │     │  {
    │     │    USER_ID: user.userId,
    │     │    CUSTOMER_NAME: customer.fullname,
    │     │    CUSTOMER_PHONE: customer.phone,
    │     │    CUSTOMER_EMAIL: customer.email,
    │     │    DELIVERY_PROVINCE: address.province,
    │     │    DELIVERY_DISTRICT: address.district,
    │     │    DELIVERY_WARD: address.ward,
    │     │    DELIVERY_ADDRESS: address.street,
    │     │    PAYMENT_METHOD: paymentMethod,
    │     │    APPLIED_VOUCHER: selectedVouchers.code,
    │     │    ITEMS: cartItems,
    │     │    SUBTOTAL: subtotal,
    │     │    SHIPPING_FEE: shippingFee,
    │     │    DISCOUNT_AMOUNT: discount,
    │     │    TOTAL_AMOUNT: total
    │     │  }
    │     │
    │     └─ Response: { success: true, data: { ORDER_ID: '...' } }
    │
    ├─ IF paymentMethod === 'COD'
    │  └─ Order status: PENDING
    │     └─ Navigate to /order-success?id={ORDER_ID}
    │
    ├─ IF paymentMethod === 'VNPAY'
    │  │
    │  ├─ Show <VNPayCheckout />
    │  │  │
    │  │  ├─ Select bank:
    │  │  │  ├─ NCB, AGRIBANK, ACB, VCB
    │  │  │  ├─ BIDV, TCB, SHB
    │  │  │
    │  │  ├─ Click "Pay with VNPay"
    │  │  │  └─ POST /api/payment/vnpay
    │  │  │     └─ Create VNPay URL
    │  │  │        ├─ Amount: total
    │  │  │        ├─ Order ID: order.id
    │  │  │        ├─ Bank: selected bank
    │  │  │        └─ Redirect URL
    │  │  │
    │  │  ├─ Redirect to VNPay simulator
    │  │  │
    │  │  └─ After payment:
    │  │     ├─ VNPay calls callback endpoint
    │  │     ├─ Backend verifies payment
    │  │     └─ Navigate to /order-success
    │  │
    │  └─ Order status: PAID (if successful)
    │
    └─ END: /order-success PAGE
       ├─ Show order ID
       ├─ Show "Order successful" message
       ├─ Button: "View My Orders" → /account
       └─ Button: "Continue Shopping" → /
```

---

## 5. Admin Dashboard Workflow

```
VISIT /admin
    │
    ├─ [AUTHORIZATION CHECK]
    │  └─ authAPI.getCurrentUser()
    │     ├─ If !user → redirect to /login
    │     └─ If user.role !== 'ADMIN' → redirect to /
    │
    ├─ FETCH INITIAL DATA
    │  ├─ productAPI.getAll(1, pageSize) → products[]
    │  ├─ adminAPI.getOrders() → orders[]
    │  └─ adminAPI.getOrderItems() → orderItems[]
    │
    ├─ PROCESS DATA WITH HOOK
    │  └─ useProductAnalytics(products, orderItems, orders)
    │     ├─ Calculate total products sold: sum(SOLUONG)
    │     ├─ Group sales by product: productSales[MASP]
    │     ├─ Find top 5 best sellers: sort desc by sales
    │     └─ Find top 5 worst sellers: sort asc by sales
    │
    └─ RENDER TABS
       │
       ├─────────────────────────────────────────────────
       │ [DASHBOARD TAB] (Default)
       ├─────────────────────────────────────────────────
       │  │
       │  ├─ Display <RevenueChart />
       │  │  └─ x-axis: dates/months
       │  │     y-axis: revenue amount
       │  │     data: orders mapped to revenue
       │  │
       │  ├─ Display Stats Grid
       │  │  ├─ <StatBox title="Total Products" value={totalProducts} />
       │  │  ├─ <StatBox title="Total Orders" value={totalOrders} />
       │  │  └─ <StatBox title="Total Revenue" value={totalRevenue} />
       │  │
       │  ├─ <ProductSection title="Top 5 Best Sellers">
       │  │  └─ <ProductTopList products={bestSelling} />
       │  │
       │  └─ <ProductSection title="Top 5 Worst Sellers">
       │     └─ <ProductTopList products={slowSelling} />
       │
       ├─────────────────────────────────────────────────
       │ [PRODUCTS TAB]
       ├─────────────────────────────────────────────────
       │  │
       │  ├─ <button>+ Create Product</button>
       │  │  └─ onClick: setIsProductModalOpen(true)
       │  │
       │  ├─ If isProductModalOpen:
       │  │  └─ <ProductModal
       │  │      product={editingProduct}
       │  │      onSubmit={handleProductSubmit}
       │  │     >
       │  │       ├─ <input name="TENSP" />
       │  │       ├─ <input name="GIABAN" />
       │  │       ├─ <input name="SOLUONGTON" />
       │  │       ├─ <input name="IMAGE_URL" />
       │  │       ├─ <textarea name="DESCRIPTION" />
       │  │       └─ <button>
       │  │           {editingProduct ? 'Update' : 'Create'}
       │  │         </button>
       │  │         └─ If create:
       │  │            └─ POST /api/product
       │  │               └─ productAPI.create(formData)
       │  │         └─ If edit:
       │  │            └─ PUT /api/product/{MASP}
       │  │               └─ productAPI.update(id, formData)
       │  │
       │  ├─ <ProductTable
       │  │   products={products}
       │  │   onEdit={handleEdit}
       │  │   onDelete={handleDelete}
       │  │  >
       │  │   └─ Display table with columns:
       │  │      ├─ MASP (Product ID)
       │  │      ├─ TENSP (Name)
       │  │      ├─ GIABAN (Price)
       │  │      ├─ SOLUONGTON (Stock) - with color badge
       │  │      └─ Actions: [Edit] [Delete]
       │  │
       │  ├─ On [Edit] click:
       │  │  ├─ setEditingProduct(product)
       │  │  ├─ setIsProductModalOpen(true)
       │  │  └─ Modal shows product data in form
       │  │
       │  ├─ On [Delete] click:
       │  │  ├─ Show confirmation (if implemented)
       │  │  └─ DELETE /api/product/{MASP}
       │  │     └─ productAPI.delete(id)
       │  │     └─ Refresh product list
       │  │
       │  └─ <Pagination
       │      currentPage={currentPage}
       │      totalPages={totalPages}
       │      onPageChange={setCurrentPage}
       │     />
       │     └─ Triggers new fetch with new page
       │
       ├─────────────────────────────────────────────────
       │ [ACCOUNTS TAB]
       ├─────────────────────────────────────────────────
       │  │
       │  ├─ <button>+ Create Account</button>
       │  │
       │  ├─ If isAccountModalOpen:
       │  │  └─ <AccountModal
       │  │      user={editingUser}
       │  │      onSubmit={handleAccountSubmit}
       │  │     >
       │  │       ├─ <input name="USERNAME" />
       │  │       ├─ <input name="EMAIL" />
       │  │       ├─ <input name="PASSWORD" />
       │  │       ├─ <select name="ROLE">
       │  │       │   <option>USER</option>
       │  │       │   <option>ADMIN</option>
       │  │       │ </select>
       │  │       └─ <button>
       │  │           {editingUser ? 'Update' : 'Create'}
       │  │         </button>
       │  │         └─ POST /api/admin/user (create)
       │  │         └─ PUT /api/admin/user/{id} (edit)
       │  │
       │  ├─ <AccountsTable
       │  │   users={users}
       │  │   onEdit={handleEdit}
       │  │   onDelete={handleDelete}
       │  │  />
       │  │   └─ Display table with columns:
       │  │      ├─ USERNAME
       │  │      ├─ EMAIL
       │  │      ├─ ROLE
       │  │      └─ Actions: [Edit] [Delete]
       │  │
       │  └─ <Pagination />
       │
       ├─────────────────────────────────────────────────
       │ [ORDERS TAB]
       ├─────────────────────────────────────────────────
       │  │
       │  ├─ <ProductSection title="All Orders" />
       │  │
       │  ├─ Order list table
       │  │  ├─ ORDER_ID
       │  │  ├─ USER_ID
       │  │  ├─ STATUS
       │  │  ├─ TOTAL_AMOUNT
       │  │  └─ ORDER_DATE
       │  │
       │  ├─ <ProductSection title="Best Sellers" />
       │  │
       │  └─ <ProductTopList products={bestSelling} />
       │
       └─────────────────────────────────────────────────
          │
          └─ {toast && <Toast message={toast} type={type} />}
             ├─ Success: "Product created successfully"
             ├─ Success: "Product updated successfully"
             ├─ Success: "Product deleted successfully"
             ├─ Error: "Failed to create product"
             ├─ Error: "Failed to delete product"
             └─ Auto-dismiss after 3 seconds
```

---

## 6. Component State Management Pattern

```
Pattern Used Throughout:

const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);
      const response = await API.get();
      setData(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  fetch();
}, [dependencies]);

// Render
return (
  <>
    {loading && <Skeleton />}
    {error && <ErrorMessage message={error} />}
    {!loading && !error && <DataDisplay data={data} />}
  </>
);
```

No global state management (Redux/Zustand):
- localStorage for user/cart persistence
- React Context would be next improvement
- Component-level state management (useState)

---

## 7. Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 16.2.1 (App Router)                         │   │
│  │  ├─ React 19.2.4 (UI Components)                     │   │
│  │  ├─ TypeScript 5 (Type Safety)                       │   │
│  │  └─ ESLint 9 (Code Quality)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│                    [Styling Layer]                           │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tailwind CSS 4 + PostCSS                            │   │
│  │  ├─ Utility-first CSS framework                      │   │
│  │  ├─ @tailwindcss/postcss plugin                      │   │
│  │  ├─ Dark mode hooks (partial)                        │   │
│  │  └─ Global styles in globals.css                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│                 [HTTP Client Layer]                          │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Axios 1.6.0 + Fetch API                             │   │
│  │  ├─ axios for direct HTTP calls (LoginForm, etc)     │   │
│  │  ├─ Fetch API for main API client (lib/api.ts)       │   │
│  │  ├─ Headers: 'Content-Type': 'application/json'      │   │
│  │  ├─ Auth: 'Authorization': 'Bearer {token}'          │   │
│  │  └─ Timeout: 10 seconds                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│              [Data Visualization Layer]                      │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Recharts 3.8.1 (Charts)                             │   │
│  │  ├─ LineChart (Revenue over time)                    │   │
│  │  ├─ XAxis, YAxis (axes)                              │   │
│  │  └─ Tooltip, Legend (interactions)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│            [Browser APIs & Runtime]                         │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Browser APIs Used:                                  │   │
│  │  ├─ localStorage (user, token, cart, preferences)    │   │
│  │  ├─ sessionStorage (temporary data)                  │   │
│  │  ├─ window.location (navigation)                     │   │
│  │  ├─ Fetch API (HTTP requests)                        │   │
│  │  ├─ useRouter (next/navigation client-side routing)  │   │
│  │  ├─ useParams (dynamic route params)                 │   │
│  │  ├─ useSearchParams (query params)                   │   │
│  │  └─ React hooks (useState, useEffect, useCallback)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│               [Backend API Gateway]                         │
│                          ↓                                    │
│  http://localhost:5000/api                                  │
│  (or NEXT_PUBLIC_API_URL environment variable)               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. File Structure Overview

```
d:\webbansach\
│
├── public/                     (Static assets)
│   └── ...
│
├── app/                        (Next.js App Router)
│   ├── layout.tsx             (Root layout with ChatBot)
│   ├── page.tsx               (Home page)
│   ├── globals.css            (Global Tailwind import)
│   ├── favicon.ico
│   │
│   ├── login/
│   │   └── page.tsx           (Auth page: login/register)
│   │
│   ├── cart/
│   │   └── page.tsx           (Cart display & checkout link)
│   │
│   ├── checkout/
│   │   ├── page.tsx           (Checkout form)
│   │   └── components/
│   │       ├── CheckoutForm.tsx
│   │       ├── AddressForm.tsx
│   │       ├── PaymentMethod.tsx
│   │       ├── OrderSummary.tsx
│   │       ├── VoucherSelector.tsx
│   │       └── DiscountVouchers.tsx
│   │
│   ├── product/
│   │   └── [id]/
│   │       └── page.tsx       (Product detail page)
│   │
│   ├── account/
│   │   └── page.tsx           (User profile & orders)
│   │
│   ├── order-success/
│   │   └── page.tsx           (Success confirmation)
│   │
│   └── admin/
│       ├── layout.tsx         (Admin wrapper)
│       ├── page.tsx           (Admin dashboard)
│       ├── hook/
│       │   └── useProductAnalytics.ts
│       └── components/
│           ├── ProductTable.tsx
│           ├── ProductModal.tsx
│           ├── AccountsTable.tsx
│           ├── AccountModal.tsx
│           ├── RevenueChart.tsx
│           ├── ProductTopList.tsx
│           ├── ProductSection.tsx
│           ├── ProductStats.tsx
│           ├── StatBox.tsx
│           ├── Toast.tsx
│           └── Pagination.tsx
│
├── components/                (Global components)
│   ├── VNPayCheckout.tsx
│   ├── UserProfile.tsx
│   ├── EnhancedChatBot.tsx
│   ├── ChatBot.tsx
│   ├── BookRecommendation.tsx
│   ├── ChatBotWrapper.tsx
│   ├── ChatBotClient.tsx
│   ├── ChatMessage.tsx
│   ├── ChatBotStatsAdmin.tsx
│   ├── OrderSuccessVNPay.tsx
│   ├── RegisterForm.tsx
│   ├── LoginForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── Footer.tsx
│   ├── CategoryMegaMenu.tsx
│   └── RootLayoutContent.tsx
│
├── lib/                       (Utilities & APIs)
│   ├── api.ts                (Core API client: productAPI, cartAPI, orderAPI)
│   ├── authAPI.ts            (Authentication endpoints)
│   ├── hooks/
│   │   └── useChatbot.ts     (Chat hook)
│   ├── services/
│   │   └── vnpayService.ts   (VNPay payment integration)
│   └── vouchers/
│       ├── types.ts          (Voucher type definitions)
│       └── utils.ts          (Voucher calculation logic)
│
├── package.json              (Dependencies)
├── next.config.ts            (Next.js configuration)
├── tsconfig.json             (TypeScript configuration)
├── postcss.config.mjs        (PostCSS + Tailwind config)
├── eslint.config.mjs         (ESLint rules)
│
└── [Documentation Files]
    ├── FRONTEND_ARCHITECTURE_DETAILED_ANALYSIS.md (THIS FILE)
    ├── README.md
    ├── SETUP_GUIDE.md
    ├── CHATBOT_SYSTEM_COMPLETE.md
    ├── VNPAY-IMPLEMENTATION.md
    └── ... (other docs)
```

---

This comprehensive visual guide covers:
✅ Component dependency tree  
✅ API request flow  
✅ Authentication flow  
✅ Checkout process  
✅ Admin dashboard workflow  
✅ State management pattern  
✅ Technology stack  
✅ File structure overview
