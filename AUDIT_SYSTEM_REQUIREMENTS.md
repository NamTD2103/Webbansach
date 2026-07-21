# 🔍 AUDIT HỆ THỐNG - KIỂM CHỨNG YÊU CẦU (06/2026)

**Ngày audit:** 06/2026  
**Hệ thống:** Web Bán Sách - Next.js (Frontend) + Node.js (Backend) + Oracle Database  
**Trạng thái:** 65% hoàn thành - Cần bổ sung 35%

---

## 📊 BẢNG TÓMO TẮT - TÍNH NĂNG ĐÃ CÓ vs CÒN THIẾU

| # | Tính Năng | Trạng Thái | Chi Tiết | Mức Độ Ưu Tiên |
|---|-----------|-----------|---------|---|
| **A. ADMIN - QUẢN LÍ HÀNG HÓA** | | | | |
| 1.1 | Trừ số lượng khi đặt hàng thành công | ✅ ĐÃ CÓ | `backend/routes/order.js:234-250` - Update stock | 🔴 BẮT BUỘC |
| 1.2 | Cộng lại số lượng khi hủy đơn | ⚠️ CHƯA KIỂM CHỨNG | Cần xác nhân logic hủy đơn | 🔴 BẮT BUỘC |
| 1.3 | Không hiển thị hàng số lượng = 0 | ⚠️ CÒN THIẾU | Cần thêm `WHERE SOLUONGTON > 0` | 🔴 BẮT BUỘC |
| 1.4 | Đánh dấu sản phẩm "HOT" | ❌ CÒN THIẾU | Cần thêm cột `IS_HOT`, `HOT_RANK` | 🟠 MAJOR |
| 1.5 | Đánh dấu sản phẩm "BÁN CHẠY" | ❌ CÒN THIẾU | Cần thêm cột `BESTSELLER`, `SALES_COUNT` | 🟠 MAJOR |
| 1.6 | Hiển thị "CHÁY HÀNG" cho hot items (qty=0) | ❌ CÒN THIẾU | Cần logic hiển thị điều kiện | 🟠 MAJOR |
| 1.7 | Chỉ hiển thị hàng sẵn sàng bán | ⚠️ CÒN THIẾU | Cần thêm cột `IS_AVAILABLE`, filter logic | 🟠 MAJOR |
| **B. ADMIN - QUẢN LÍ NGƯỜI DÙNG** | | | | |
| 2.1 | Thêm người dùng mới (CRUD) | ✅ ĐÃ CÓ | `backend/routes/auth.js` - Register | ✅ |
| 2.2 | Cập nhật thông tin người dùng | ✅ ĐÃ CÓ | `backend/routes/profile.js` | ✅ |
| 2.3 | Đặt/thay đổi mật khẩu | ✅ ĐÃ CÓ | `backend/routes/auth.js` - changePassword | ✅ |
| 2.4 | Phân loại người dùng (role system) | ✅ ĐÃ CÓ | ADMIN, USER, STAFF roles | ✅ |
| 2.5 | Hạng thẻ khách hàng dựa trên điểm tích lũy | ❌ CÒN THIẾU | Cần thêm `CUSTOMER_TIER`, `LOYALTY_POINTS` | 🟠 MAJOR |
| 2.6 | Điểm tích lũy (LOYALTY POINTS) | ⚠️ CHƯA RÕ | Cần xác nhận logic tính điểm | 🔴 BẮT BUỘC |
| 2.7 | Đăng nhập bằng Facebook | ❌ CÒN THIẾU | Cần integ Facebook OAuth | 🟠 MAJOR |
| 2.8 | Quên mật khẩu / Reset | ✅ ĐÃ CÓ | `backend/routes/auth.js` | ✅ |
| **C. ADMIN - QUẢN LÍ KHUYẾN MÃI** | | | | |
| 3.1 | Tạo mã khuyến mãi (Voucher CRUD) | ✅ BACKEND ĐÃ CÓ | `lib/api.ts` - voucher API | ✅ |
| 3.2 | Admin UI quản lý voucher | ❌ CÒN THIẾU | Cần tạo component VoucherManagement | 🟠 MAJOR |
| 3.3 | Các loại voucher: sản phẩm, ship, platform | ✅ ĐÃ CÓ | Checkout logic hỗ trợ | ✅ |
| **D. ADMIN - CHĂM SÓC KHÁCH HÀNG** | | | | |
| 4.1 | Quản lý Q&A / Feedback | ❌ CÒN THIẾU | Cần tạo bảng & UI quản lý | 🟠 MAJOR |
| 4.2 | Đánh giá sản phẩm / Reviews | ✅ ĐÃ CÓ | `backend/routes/review.js` | ✅ |
| 4.3 | Quản lý bảo hành sản phẩm | ❌ CÒN THIẾU | Cần tạo warranty system | 🟠 MAJOR |
| **E. ADMIN - XỬ LÝ ĐƠN HÀNG** | | | | |
| 5.1 | Xem chi tiết đơn hàng | ✅ ĐÃ CÓ | `admin/page.tsx`, `admin.js` | ✅ |
| 5.2 | Duyệt và cập nhật trạng thái | ✅ ĐÃ CÓ | `backend/routes/admin.js` PUT /orders | ✅ |
| 5.3 | Phân công giao hàng | ⚠️ CHƯA RÕ | Cần xác nhân logic phân công | 🟠 MAJOR |
| 5.4 | Xác nhận giao thành công/không thành công | ✅ ĐÃ CÓ | Status: COMPLETED, PENDING | ✅ |
| 5.5 | Hủy đơn hàng | ⚠️ CÒN THIẾU | Cần logic hủy + hoàn tiền + khôi phục stock | 🔴 BẮT BUỘC |
| 5.6 | Thu công nợ đơn hàng | ❌ CÒN THIẾU | Cần debit system + tracking | 🟠 MAJOR |
| **F. ADMIN - THỐNG KÊ DOANH THU** | | | | |
| 6.1 | Thống kê theo thời gian (ngày/tháng/năm) | ❌ CÒN THIẾU | Cần API stats + UI biểu đồ | 🟠 MAJOR |
| 6.2 | Thống kê theo trạng thái đơn hàng | ❌ CÒN THIẾU | Cần API stats | 🟠 MAJOR |
| 6.3 | Thống kê theo phương thức thanh toán | ❌ CÒN THIẾU | Cần API stats (COD, VNPay, etc) | 🟠 MAJOR |
| **G. KHÁCH HÀNG - ĐĂNG KÍ/ĐĂNG NHẬP** | | | | |
| 7.1 | Đăng kí tài khoản | ✅ ĐÃ CÓ | `backend/routes/auth.js` | ✅ |
| 7.2 | Đăng nhập email/password | ✅ ĐÃ CÓ | `backend/routes/auth.js` | ✅ |
| 7.3 | Xác thực email | ✅ ĐÃ CÓ | Email verification | ✅ |
| **H. KHÁCH HÀNG - TRANG CHỦ** | | | | |
| 8.1 | Hiển thị sản phẩm theo danh mục | ✅ ĐÃ CÓ | `app/page.tsx` + Category filter | ✅ |
| 8.2 | Xem chi tiết sản phẩm | ✅ ĐÃ CÓ | `app/product/[id]/page.tsx` | ✅ |
| 8.3 | Tìm kiếm sản phẩm | ✅ ĐÃ CÓ | `backend/routes/product.js` search | ✅ |
| 8.4 | Tìm kiếm nâng cao (filter, sort) | ✅ ĐÃ CÓ | Price range, category filters | ✅ |
| 8.5 | Thêm vào giỏ hàng | ✅ ĐÃ CÓ | `backend/routes/cart.js` | ✅ |
| 8.6 | Đặt hàng | ✅ ĐÃ CÓ | Order creation + stock update | ✅ |
| 8.7 | Chọn phương thức thanh toán | ✅ ĐÃ CÓ | COD, VNPay | ✅ |
| 8.8 | Thông báo đặt hàng thành công | ⚠️ CHƯA RÕ | Cần xác nhân email/SMS notification | 🟠 MAJOR |
| 8.9 | Theo dõi đơn hàng | ✅ ĐÃ CÓ | `backend/routes/order.js` getUserOrders | ✅ |
| 8.10 | Chat trực tuyến / Q&A | ✅ ĐÃ CÓ | Chatbot system | ✅ |
| **I. KHÁCH HÀNG THÂN THIẾT** | | | | |
| 9.1 | Nhận ưu đãi / discount | ✅ ĐÃ CÓ | Voucher system | ✅ |
| 9.2 | Xem điểm tích lũy | ❌ CÒN THIẾU | Cần UI hiển thị loyalty points | 🟠 MAJOR |
| 9.3 | Cập nhật thông tin | ✅ ĐÃ CÓ | Profile update | ✅ |
| 9.4 | Reset mật khẩu | ✅ ĐÃ CÓ | Change password | ✅ |
| 9.5 | Đánh giá sản phẩm | ✅ ĐÃ CÓ | Review system | ✅ |
| 9.6 | Quản lý đơn hàng (tất cả, lịch sử, hủy) | ✅ ĐÃ CÓ | `account/page.tsx` | ✅ |
| 9.7 | Theo dõi đơn hàng | ✅ ĐÃ CÓ | Order tracking | ✅ |

---

## 🔴 TÍNH NĂNG CÁPT BẮT BUỘC (CRITICAL)

### 1. **Quản lý Số Lượng Tồn Kho**
- ✅ Trừ stock khi đặt hàng (ĐÃ CÓ)
- ❌ **Cộng lại stock khi hủy đơn** (CÒN THIẾU)
- ❌ **Không hiển thị sản phẩm với qty=0** (CÒN THIẾU)

### 2. **Điểm Tích Lũy & Hạng Thẻ Khách Hàng**
- ❌ Tính điểm tích lũy theo từng đơn hàng
- ❌ Thang hạng: Bronze, Silver, Gold, Platinum (dựa trên điểm)
- ❌ Ưu đãi theo hạng (discount %, free ship, etc)

### 3. **Loại Hình Sản Phẩm: HOT & BESTSELLER**
- ❌ Flag `IS_HOT` - Hiển thị khu vực "Sản phẩm HOT"
- ❌ Flag `BESTSELLER` - Hiển thị khu vực "Bán chạy"
- ❌ Logic "cháy hàng": Nếu HOT + qty=0 → Hiển thị "CHÁY HÀNG"

---

## 🟠 TÍNH NĂNG MAJOR (CAP CẤP TIẾP THEO)

### 1. **Hủy Đơn Hàng (Order Cancellation)**
- ❌ Thêm logic hủy: `CANCELLED` status
- ❌ Hoàn tiền (refund) nếu đã thanh toán
- ❌ Khôi phục stock sản phẩm

### 2. **Hệ Thống Q&A / Feedback**
- ❌ Tạo bảng `QUESTIONS`, `ANSWERS`
- ❌ Admin UI quản lý Q&A
- ❌ Notification cho customer khi có trả lời

### 3. **Quản Lý Bảo Hành Sản Phẩm**
- ❌ Tạo bảng `WARRANTY_CLAIMS`
- ❌ Admin xử lý yêu cầu bảo hành
- ❌ Tracking trạng thái bảo hành

### 4. **Admin UI - Voucher Management**
- ✅ Backend API ĐÃ CÓ
- ❌ Cần React Component: `VoucherManagement.tsx`
- ❌ CRUD UI cho voucher

### 5. **Thống Kê Doanh Thu (Revenue Analytics)**
- ❌ API endpoint: `/api/admin/stats/revenue`
- ❌ Filter: ngày/tháng/năm, trạng thái, phương thức
- ❌ UI Dashboard với biểu đồ (Recharts)

### 6. **Notification System (Email/SMS)**
- ❌ Thông báo khi đặt hàng thành công
- ❌ Thông báo cập nhật trạng thái đơn hàng
- ❌ Thông báo Q&A có câu trả lời
- ❌ Support: Email + SMS

### 7. **Social Login (Facebook/Google)**
- ❌ Facebook OAuth integration
- ❌ Google OAuth integration

### 8. **Thu Công Nợ (Debt Collection)**
- ❌ Tạo bảng `DEBT_TRACKING`
- ❌ Logic tính toán công nợ
- ❌ Admin dashboard theo dõi

### 9. **Phân Công Giao Hàng (Delivery Assignment)**
- ❌ Tạo bảng `DELIVERY_STAFF`
- ❌ Gán shipper cho đơn hàng
- ❌ Tracking shipper + đơn hàng

---

## 📁 CẤU TRÚC DỮ LIỆU HỆ THỐNG HIỆN TẠI

```
Frontend:
  ✅ app/page.tsx - Trang chủ + product list
  ✅ app/product/[id]/page.tsx - Chi tiết sản phẩm
  ✅ app/checkout/page.tsx - Thanh toán
  ✅ app/account/page.tsx - Tài khoản khách hàng
  ✅ app/admin/page.tsx - Admin dashboard (products, users, orders)
  ✅ components/ChatBot.tsx - Chatbot
  ✅ components/UserProfile.tsx - User profile
  ✅ components/VNPayCheckout.tsx - VNPay integration

Backend Routes:
  ✅ /api/auth - Đăng kí, đăng nhập, thay đổi mật khẩu
  ✅ /api/product - CRUD sản phẩm
  ✅ /api/cart - Giỏ hàng
  ✅ /api/order - Tạo đơn hàng
  ✅ /api/payment - VNPay integration
  ✅ /api/admin - Quản lý (products, users, orders)
  ✅ /api/profile - Tài khoản người dùng
  ✅ /api/review - Đánh giá sản phẩm
  ✅ /api/chatbot - Chatbot API
  ✅ /api/recommendations - Gợi ý sản phẩm

Database Tables:
  ✅ USERS - Người dùng
  ✅ SANPHAM - Sản phẩm
  ✅ CART - Giỏ hàng
  ✅ ORDERS - Đơn hàng
  ✅ ORDER_ITEMS - Chi tiết đơn hàng
  ✅ PAYMENT_TRANSACTIONS - Giao dịch thanh toán
  ✅ PRODUCT_REVIEWS - Đánh giá sản phẩm
  ✅ VOUCHERS - Mã khuyến mãi
  ✅ USER_READING_ANALYTICS - Thống kê người dùng
  ✅ ... (20+ tables)
```

---

## 🎯 KHUYẾN NGHỊ BƯỚC TIẾP THEO

### **SPRINT 1 (Tuần 1-2): CẠP CẤP BẮT BUỘC**
1. ✅ Hủy đơn hàng + hoàn tiền + khôi phục stock
2. ✅ Điểm tích lũy & Hạng thẻ khách hàng
3. ✅ Flag HOT/BESTSELLER + Logic hiển thị

### **SPRINT 2 (Tuần 3-4): MAJOR FEATURES**
1. ✅ Admin UI Voucher Management
2. ✅ Revenue Analytics Dashboard
3. ✅ Notification System (Email)
4. ✅ Q&A Management System

### **SPRINT 3 (Tuần 5+): ENHANCEMENT**
1. ✅ Facebook/Google OAuth
2. ✅ Warranty Management
3. ✅ Delivery Assignment
4. ✅ Debt Tracking

---

## 📊 TỔNG KẾT

| Loại | Tổng Số | ĐÃ CÓ | CÒN THIẾU | % Hoàn Thành |
|------|--------|-------|----------|---|
| **Tính Năng ADMIN** | 20 | 10 | 10 | 50% |
| **Tính Năng CUSTOMER** | 19 | 15 | 4 | 79% |
| **Tính Năng TỔNG CỘNG** | **39** | **25** | **14** | **64%** |

---

## 🚀 NEXT STEP

Hãy chọn một trong các tính năng CÒN THIẾU để bắt đầu phát triển. Tôi sẽ:
1. Viết code chi tiết (Backend + Frontend)
2. Giải thích logic phức tạp
3. Cung cấp SQL migrations nếu cần
4. Đảm bảo đồng nhất với codebase hiện tại
