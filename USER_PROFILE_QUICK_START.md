# 👤 User Profile Dashboard - Quick Setup

## ⚡ 3-Minute Quick Start

### Step 1: Run Database Migration
```bash
# Option A: Using sqlplus
sqlplus system/password@localhost:1521/orcl21pdb1 < backend/database/user-profile-enhancement-schema.sql

# Option B: Copy-paste SQL content into your database client
```

### Step 2: That's It! ✅
- Backend routes already added to server.js
- React components ready in /account page
- Profile page automatically uses new dashboard

---

## 📊 What User Sees

When logged-in user visits `/account`:

```
┌─────────────────────────────────────────────┐
│  👤 Nguyễn Văn A        [✏️ Edit Profile]   │
│  📧 nguyenvana@email.com                    │
│  📱 0909 123 456                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────┐ ┌─────────────┐
│ 🎯 Thông tin về bạn             │ │ 📈 Tóm tắt  │
├─────────────────────────────────┤ ├─────────────┤
│ 📚 Bạn là người đọc sách...     │ │ ❤️ 5 Yêu t. │
│ ❤️ Yêu thích: Kinh doanh (5)    │ │ ⭐ 12 Đánh g│
│ 📖 Thích sách dễ đọc            │ │ 🛒 3 Đơn    │
│ 🎯 Mua nhiều vào thứ 7          │ └─────────────┘
│ ⏰ Thường xem tối                │
│ 💰 Chi 1.5M đồng                │
└─────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 Thống kê đọc sách                        │
├─────────────────────────────────────────────┤
│  [📚 120]  [💳 25]  [⭐ 8]  [💰 1.5M]      │
│  Sách xem   Sách mua  Đánh giá  Chi tiêu   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📚 Sách dành riêng cho bạn                  │
├─────────────────────────────────────────────┤
│  [Book1]  [Book2]  [Book3]  [Book4] ...    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🛒 Đơn hàng gần đây                         │
├─────────────────────────────────────────────┤
│  Đơn #1001 - ✓ Đã giao    - 450,000đ      │
│  Đơn #1002 - 📦 Đang gửi  - 320,000đ      │
│  Đơn #1003 - 🔄 Xử lý     - 180,000đ      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ❤️ Sách yêu thích (5)                       │
├─────────────────────────────────────────────┤
│  [Atomic Habits]  [Deep Work]  [Mindset]   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### 1. AI Insights Card 🧠
- Analyzes reading behavior
- Shows 5 insights about user
- Examples:
  - "Bạn là người đọc sách đơm sâu"
  - "Yêu thích: Kinh doanh, Self-help, Tâm lý"
  - "Thích sách dễ đọc"
  - "Mua sách nhiều vào cuối tuần"
  - "Thường hoạt động buổi tối"

### 2. Analytics Dashboard 📊
- Total books viewed
- Books purchased
- Books reviewed
- Total spending
- Favorite categories
- Displayed as colorful stat cards

### 3. Personalized Recommendations 📚
- 6 books recommended just for them
- Based on viewing/purchase history
- Shows why each book is recommended
- Quick "View details" button

### 4. Recent Orders 🛒
- Last 5 orders
- Order ID, date, status
- Color-coded status badges
- Order total

### 5. Wishlist ❤️
- Saved favorite books
- Priority levels
- Quick add/remove

### 6. Editable Profile 👤
- Click "Edit" to change info
- Inline editing (no popup)
- Saves without page reload

---

## 🔧 API Endpoints

All endpoints return data for React components:

```bash
# Main profile data
GET /api/profile/:userId

# AI insights
GET /api/profile/:userId/insights?refresh=true

# Reading stats
GET /api/profile/:userId/analytics

# Books they want
GET /api/profile/:userId/wishlist
POST /api/profile/:userId/wishlist
DELETE /api/profile/:userId/wishlist/:wishlistId

# Reviews they wrote
GET /api/profile/:userId/reviews

# Recommended for them
GET /api/profile/:userId/personalized-recommendations
```

---

## 📱 Responsive Design

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): 2-3 columns
- **Desktop** (> 1024px): Full dashboard layout

All cards stack nicely on mobile!

---

## 🎨 UI/UX Highlights

✨ Modern Design:
- Gradient headers
- Color-coded status badges
- Smooth hover effects
- Loading spinners
- Icon + text labels

📊 Visual Elements:
- Stat cards with icons
- Book cover images
- Clear typography
- Whitespace for readability
- Consistent color scheme

⚡ Interactions:
- Inline editing (no reload)
- Instant feedback
- Smooth transitions
- Responsive buttons

---

## 🔐 Privacy & Security

✅ Ready for:
- Login history tracking
- 2FA (Two-Factor Auth)
- Privacy settings
- Password change
- Session management

---

## 🚀 How It Works

### User Journey:

```
1. User logs in
   ↓
2. Navigates to /account
   ↓
3. System fetches:
   - Basic profile (name, email, phone)
   - Analytics (stats from purchases/views)
   - AI Insights (generated from data)
   - Recent orders
   - Wishlist
   - Recommendations
   ↓
4. Components render dashboard
   ↓
5. User can:
   - Edit profile
   - View insights
   - See recommendations
   - Manage wishlist
```

### Data Flow:

```
React Component
    ↓
axios call
    ↓
Backend API (/api/profile/:userId)
    ↓
Database Query
    ↓
Response with JSON
    ↓
Component renders
    ↓
User sees dashboard
```

---

## 🧠 How AI Insights Generate

```
Step 1: Collect Data
├─ Reading history (views, purchases, reviews)
├─ Order history
└─ User preferences

Step 2: Analyze
├─ Calculate total books
├─ Find favorite categories
├─ Detect time patterns
└─ Analyze spending

Step 3: Generate Insights
├─ "You're a thoughtful reader"
├─ "You love Business & Self-Help"
├─ "You prefer easy-to-read books"
├─ "You shop on weekends"
└─ "You browse in the evening"

Step 4: Cache Results
└─ Save in USER_AI_INSIGHTS

Step 5: Display
└─ Show formatted insights with emojis
```

---

## 🛠️ Customization Examples

### Change Insight Messages

```javascript
// In userInsightsGenerator.js
const generateReadingStyleInsight = (analytics) => {
  return '📚 Your custom insight here';
};
```

### Change Colors

```typescript
// In UserProfile.tsx
className="bg-gradient-to-r from-purple-500 to-pink-600"
// Change blue to your color
```

### Add More Stats

```typescript
const stats = [
  { label: '📚 Books Viewed', value: analytics.totalBooksViewed },
  { label: 'YOUR_STAT', value: 'YOUR_VALUE' }, // Add here
];
```

---

## 📊 Database Tables

Created tables:
- `USER_READING_ANALYTICS` - Stats
- `USER_LOGIN_HISTORY` - Security
- `USER_SECURITY_SETTINGS` - 2FA, privacy
- `USER_WISHLIST` - Saved books
- `USER_BOOK_REVIEWS` - User reviews
- `USER_PROFILE_COMPLETENESS` - Completion %
- `USER_NOTIFICATIONS` - Alerts
- `USER_AI_INSIGHTS` - Cached insights

---

## ✅ Checklist

- [x] Database schema created
- [x] Backend routes implemented
- [x] React components built
- [x] AI insights generator ready
- [x] Profile page integrated
- [x] Recommendation integration
- [x] Responsive design
- [x] Error handling
- [x] Loading states

---

## 🚀 Status: READY NOW!

Just access `/account` with a logged-in user and see the new dashboard!

**No additional setup needed** - everything is connected and ready to go.

---

## 📞 Support

For issues:
1. Check `USER_PROFILE_SYSTEM.md` for full documentation
2. Verify database migration ran
3. Check browser console for errors
4. Check server logs for API errors
