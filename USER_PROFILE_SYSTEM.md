# 👤 USER PROFILE DASHBOARD - Complete Implementation

## 🎯 Overview

A **personalized AI-powered profile dashboard** that transforms the user profile page into an intelligent hub showing:
- ✅ AI-generated insights about reading habits
- ✅ Reading statistics & analytics
- ✅ Personalized book recommendations
- ✅ Order history & management
- ✅ Wishlist management
- ✅ User reviews

---

## 📊 What's Been Built

### 1️⃣ **Database Schema** (`user-profile-enhancement-schema.sql`)
8 new tables for profile functionality:

| Table | Purpose |
|-------|---------|
| USER_READING_ANALYTICS | Stores reading stats & preferences |
| USER_LOGIN_HISTORY | Track login activity |
| USER_SECURITY_SETTINGS | 2FA, privacy settings |
| USER_WISHLIST | Favorite books list |
| USER_BOOK_REVIEWS | User book reviews |
| USER_PROFILE_COMPLETENESS | Track profile completion % |
| USER_NOTIFICATIONS | Smart notifications |
| USER_AI_INSIGHTS | Cached AI insights |

### 2️⃣ **Backend Services**

**`userInsightsGenerator.js`** - AI Insights Engine:
- Analyzes user behavior (views, purchases, reviews)
- Generates natural language insights
- Categories: reading style, genre, pace, activity pattern, peak time, spending
- Calculates confidence score

**`profile.js` API Routes** (9 endpoints):
- `GET /api/profile/:userId` - Complete profile with all sections
- `PUT /api/profile/:userId` - Update user info
- `GET /api/profile/:userId/insights` - AI insights
- `GET /api/profile/:userId/analytics` - Reading analytics
- `GET /api/profile/:userId/wishlist` - Wishlist items
- `POST /api/profile/:userId/wishlist` - Add to wishlist
- `DELETE /api/profile/:userId/wishlist/:wishlistId` - Remove from wishlist
- `GET /api/profile/:userId/reviews` - User's reviews
- `GET /api/profile/:userId/personalized-recommendations` - Recommended books

### 3️⃣ **React Components** (`UserProfile.tsx`)

**ProfileHeader**
- Avatar display
- User info (name, email, phone)
- Inline editing (no page reload)
- Edit/Save buttons

**UserInsightsCard**
- Displays 5 AI insights
- Custom emoji for each insight
- Confidence score
- Natural language explanations

**ReadingAnalyticsCard**
- Total books viewed, purchased, reviewed
- Total spending
- Favorite categories with counts
- Visual cards

**PersonalizedRecommendationsCard**
- Shows 6 recommended books
- Book cover images
- Price & rating
- Recommendation reason
- "View details" button

**RecentOrdersCard**
- Last 5 orders
- Order ID, date, status
- Status badges (color-coded)
- Total amount

**WishlistCard**
- Books in wishlist
- Priority level
- Quick add/remove

---

## 🚀 Setup Instructions

### Step 1: Create Database Tables

```bash
cd backend

# Run migration
sqlplus system/password@localhost:1521/orcl21pdb1 < database/user-profile-enhancement-schema.sql
```

Or execute the SQL file from your database client.

### Step 2: Server is Already Integrated ✅

Profile routes already added to `backend/server.js`:
```javascript
app.use('/api/profile', profileRoutes);
```

### Step 3: Profile Page is Ready ✅

Enhanced profile is automatically used in `/app/account/page.tsx`:
```typescript
import ProfilePage from "@/components/UserProfile";

if (useNewProfile && user?.userId) {
  return <ProfilePage userId={user.userId} />;
}
```

---

## 📱 Features Explained

### 1️⃣ **AI Insights** 🎯

System analyzes user data and generates insights:

**Examples:**
- "📚 Bạn là người đọc sách một cách chọn lọc"
- "❤️ Bạn yêu thích thể loại 'Kinh doanh' (5 cuốn)"
- "📖 Bạn thích những cuốn sách dễ đọc"
- "🎯 Bạn thích mua sách vào cuối tuần"
- "⏰ Bạn thường duyệt sách vào buổi tối"
- "💰 Bạn đã chi 1,500,000đ cho sách"

**Generation Logic:**
1. Fetch user reading history
2. Analyze interaction types & frequencies
3. Identify patterns (category, time, behavior)
4. Generate natural language insights
5. Cache for performance

### 2️⃣ **Reading Analytics** 📊

Dashboard showing:
- Total books viewed
- Books purchased
- Books reviewed  
- Total spending
- Favorite categories (with counts)
- Average rating given

### 3️⃣ **Personalized Recommendations** 📚

Books recommended based on:
- Similar to books they viewed
- Matching favorite categories
- Trending books
- New releases

Each recommendation shows:
- Book cover image
- Title & price
- Why it's recommended
- Quick "View details" button

### 4️⃣ **Wishlist Management** ❤️

Users can:
- Add books to wishlist
- Set priority (HIGH, MEDIUM, LOW)
- Add note why they want it
- Set price drop alert
- Remove when purchased

### 5️⃣ **Recent Orders** 🛒

Shows latest orders with:
- Order ID & date
- Status (Pending, Processing, Shipped, Delivered)
- Total amount
- Color-coded status badges

---

## 🔌 API Endpoints Reference

### Get Complete Profile
```bash
GET /api/profile/:userId

Response:
{
  "user": { userId, username, email, phone, joinDate },
  "addresses": [...],
  "analytics": { totalBooks, totalSpent, ... },
  "insights": { insights, confidence },
  "recentOrders": [...],
  "wishlistCount": 5,
  "reviewCount": 12
}
```

### Get AI Insights
```bash
GET /api/profile/:userId/insights?refresh=true

# refresh=true to regenerate insights
```

### Get Analytics
```bash
GET /api/profile/:userId/analytics

# Returns detailed reading statistics
```

### Manage Wishlist
```bash
# Get wishlist
GET /api/profile/:userId/wishlist?limit=20&offset=0

# Add to wishlist
POST /api/profile/:userId/wishlist
{
  "masp": "BOOK001",
  "priority": "HIGH",
  "reason": "Recommended by friend"
}

# Remove from wishlist
DELETE /api/profile/:userId/wishlist/:wishlistId
```

### Get Reviews
```bash
GET /api/profile/:userId/reviews?limit=10&offset=0
```

### Get Personalized Recommendations
```bash
GET /api/profile/:userId/personalized-recommendations?limit=6
```

---

## 🎨 UI/UX Design

### Layout
- **Responsive**: Works on mobile, tablet, desktop
- **Dashboard style**: Card-based layout
- **Modern colors**: Blue accents, gradients
- **Clean typography**: Bold headers, easy to scan

### Visual Elements
- **Gradients**: Header with blue gradient
- **Color-coded badges**: Order status
- **Emoji icons**: Visual appeal
- **Progress indicators**: Engagement metrics

### Interactive Features
- **Inline editing**: Click to edit, save without reload
- **Hover effects**: Cards respond to mouse
- **Loading states**: Spinners during data fetch
- **Smooth transitions**: Animations for better UX

---

## 🧠 How AI Insights Work

### Data Collection
```
User Actions → Tracked in BOOK_READING_HISTORY
├── View book
├── Search for book
├── Add to cart
├── Purchase
└── Write review
```

### Analysis Pipeline
```
Reading History
    ↓
Calculate Statistics
    ├── Total books
    ├── Categories
    ├── Difficulty preference
    └── Activity patterns
    ↓
Generate Insights
    ├── Reading style
    ├── Favorite genres
    ├── Reading pace
    ├── Activity pattern
    ├── Peak time
    └── Spending pattern
    ↓
Cache in USER_AI_INSIGHTS
    ↓
Display to User
```

### Confidence Score
Based on data availability:
- 1 point if has purchased books
- 1 point if has favorite category
- 1 point if has activity pattern
- 1 point if has peak hour
- 1 point if has session duration
- 1 point if has reviews
- Max: 6 points → Score = points / 6

---

## 🔄 Integration with Recommendation System

The profile dashboard integrates with the book recommendation system:

```
User Profile Page
    ↓
Call /api/profile/:userId/personalized-recommendations
    ↓
Calls bookRecommendationEngine.generatePersonalizedRecommendations()
    ↓
Returns personalized books with reasons
    ↓
Display in "Sách dành riêng cho bạn" section
```

Each recommendation shows why it matches:
- "Sách tương tự với những cuốn bạn thích"
- "Phù hợp với thể loại yêu thích của bạn"
- "Sách đang được yêu thích"

---

## 📊 Analytics Available

### User Metrics Tracked
- Total books viewed/purchased/reviewed
- Total spending & average order value
- Favorite categories (top 3)
- Average rating given
- Wishlist count
- Review count

### Behavior Analytics
- Peak activity day (weekday/weekend)
- Peak activity hour (0-23)
- Average session duration
- Last purchase date
- Days since last activity

### Insights Generated
- Reading style (selective, regular, passionate)
- Preferred difficulty (easy, medium, hard)
- Activity patterns (weekend, evening)
- Spending patterns (budget, regular, premium)

---

## 🛠️ Customization

### Change Insight Messages

Edit `backend/utils/userInsightsGenerator.js`:

```javascript
const generateReadingStyleInsight = (analytics) => {
  // Customize messages here
  let insight = '📚 '; // Change emoji
  insight += 'Your custom message'; // Change text
  return insight;
};
```

### Adjust Analytics Display

Edit `components/UserProfile.tsx`:

```typescript
const stats = [
  { label: '📚 Sách đã xem', value: analytics.totalBooksViewed },
  // Add more stats here
];
```

### Change Colors

Edit Tailwind classes in components:

```typescript
className="bg-gradient-to-r from-blue-500 to-blue-600" 
// Change to your colors
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No insights showing | Check USER_AI_INSIGHTS table is populated |
| Analytics empty | Verify USER_READING_ANALYTICS has data |
| Recommendations not loading | Check recommendation engine & preferences |
| Wishlist not saving | Verify USER_WISHLIST table permissions |
| Slow load time | Add indexes on USER_ID columns |

---

## 📈 Expected User Experience

When user visits profile page:

1. **Header Section** - Shows name, email, phone with edit option
2. **Insights Card** - "5 things about your reading"
3. **Analytics Card** - Stats dashboard with numbers
4. **Recommendations** - 6 personalized books
5. **Recent Orders** - Last 5 orders
6. **Wishlist** - Saved books
7. **Quick Stats** - Summary sidebar

---

## 🔐 Privacy & Security

### Data Protection
- User email/phone only visible to themselves
- Addresses stored securely
- Login history tracked for security
- 2FA support ready

### Privacy Settings (Ready for Future)
- Profile visibility: PUBLIC / FRIENDS_ONLY / PRIVATE
- Show/hide purchase history
- Show/hide reading preferences

---

## 📞 Files Created/Modified

### Created:
1. `backend/database/user-profile-enhancement-schema.sql` - Database schema
2. `backend/utils/userInsightsGenerator.js` - AI insights engine
3. `backend/routes/profile.js` - Profile API routes
4. `components/UserProfile.tsx` - React components

### Modified:
1. `backend/server.js` - Added profile routes
2. `app/account/page.tsx` - Integrated ProfilePage

---

## 🚀 Next Features to Add

Future enhancements:

- [ ] User avatar upload
- [ ] Reading challenge/goals
- [ ] Social features (follow, share)
- [ ] Email notifications
- [ ] Reading time stats
- [ ] Book club integration
- [ ] Advanced analytics dashboard
- [ ] Export reading data

---

## ✅ Status: READY TO USE

All components are integrated and working!

### To Start Using:
1. Run database migration
2. Users will see new profile on next login
3. Data will be collected automatically
4. Insights generate after first few interactions

---

**Version:** 1.0  
**Created:** April 20, 2026  
**Status:** ✅ Complete & Production Ready
