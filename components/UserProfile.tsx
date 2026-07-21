'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { authAPI } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ProfileUser {
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

interface ProfileHeaderProps {
  user?: ProfileUser;
  userId?: number | string;
  onEdit?: (data: { fullName: string; email: string; phone: string }) => void;
}

/**
 * ProfileHeader Component
 * User basic info with avatar and edit button
 */
export const ProfileHeader = ({ user, userId, onEdit }: ProfileHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    try {
      if (!userId) {
        alert('User ID không tìm thấy');
        return;
      }
      await axios.put(`${API_BASE_URL}/profile/${userId}`, formData);
      onEdit?.(formData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Lỗi khi lưu thông tin');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white shadow-lg">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 shadow-md">
          {user?.fullName?.[0]?.toUpperCase() || '👤'}
        </div>

        {/* User Info */}
        {!isEditing ? (
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user?.fullName || 'Người dùng'}</h1>
            <p className="text-blue-100 mt-1">📧 {user?.email}</p>
            <p className="text-blue-100">📱 {user?.phone || 'Chưa cập nhật'}</p>
            
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 px-4 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 transition"
            >
              ✏️ Chỉnh sửa
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <input
              type="text"
              placeholder="Tên đầy đủ"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded text-gray-800"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded text-gray-800"
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded text-gray-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 transition"
              >
                ✓ Lưu
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-blue-400 text-white font-semibold rounded hover:bg-blue-300 transition"
              >
                ✕ Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface InsightsData {
  allInsights?: Array<{ emoji?: string; text?: string }>;
  confidenceScore?: number;
}

interface UserInsightsCardProps {
  insights?: InsightsData;
  loading?: boolean;
}

/**
 * UserInsightsCard Component
 * Display AI-generated insights about user
 */
export const UserInsightsCard = ({ insights, loading = false }: UserInsightsCardProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights?.allInsights?.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow-md border-l-4 border-purple-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Thông tin về bạn</h2>

      <div className="space-y-3">
        {insights.allInsights.slice(0, 5).map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <span className="text-2xl">{insight.emoji}</span>
            <p className="text-gray-700">{insight.text}</p>
          </div>
        ))}
      </div>

      {insights.confidenceScore && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Độ tin cậy: {Math.round(insights.confidenceScore * 100)}%
          </p>
        </div>
      )}
    </div>
  );
};

interface AnalyticsData {
  totalBooksViewed?: number;
  totalBooksPurchased?: number;
  totalBooksReviewed?: number;
  totalSpent?: number;
  favoriteCategories?: Array<{ category?: string; count?: number }>;
}

interface ReadingAnalyticsCardProps {
  analytics?: AnalyticsData;
}

/**
 * ReadingAnalyticsCard Component
 * Display user's reading statistics
 */
export const ReadingAnalyticsCard = ({ analytics }: ReadingAnalyticsCardProps) => {
  if (!analytics) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md text-center text-gray-500">
        Chưa có dữ liệu thống kê
      </div>
    );
  }

  const stats = [
    { label: '📚 Sách đã xem', value: analytics.totalBooksViewed },
    { label: '💳 Sách đã mua', value: analytics.totalBooksPurchased },
    { label: '⭐ Đánh giá', value: analytics.totalBooksReviewed },
    { label: '💰 Tổng chi tiêu', value: `${(analytics.totalSpent || 0).toLocaleString('vi-VN')}₫` },
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Thống kê đọc sách</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Favorite categories */}
      {(analytics.favoriteCategories?.length ?? 0) > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">❤️ Thể loại yêu thích:</p>
          <div className="flex flex-wrap gap-2">
            {(analytics.favoriteCategories ?? []).map((cat, idx) => (
              cat.category && (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full"
                >
                  {cat.category} ({cat.count})
                </span>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PersonalizedRecommendationsCardProps {
  userId?: number | string;
}

/**
 * PersonalizedRecommendationsCard Component
 * Show recommended books for this user
 */
export const PersonalizedRecommendationsCard = ({ userId }: PersonalizedRecommendationsCardProps) => {
  const [recommendations, setRecommendations] = useState<Array<{ hinhanh?: string; tensp?: string; giaban?: number; recommendedReason?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/profile/${userId}/personalized-recommendations`,
        { params: { limit: 6 } }
      );

      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Sách dành riêng cho bạn</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.slice(0, 6).map((rec, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
            <img
              src={rec.hinhanh || '/placeholder-book.jpg'}
              alt={rec.tensp}
              className="w-full h-40 object-cover rounded mb-3"
            />
            <h4 className="font-bold text-sm line-clamp-2">{rec.tensp}</h4>
            <p className="text-blue-600 font-bold mt-2">{(rec.giaban || 0).toLocaleString('vi-VN')}₫</p>
            <p className="text-xs text-gray-500 mt-1">{rec.recommendedReason}</p>
            <button className="mt-3 w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition">
              Xem chi tiết
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RecentOrdersCardProps {
  orders?: Array<{
    status?: string;
    ORDER_ID?: number;
    TOTAL_AMOUNT?: number;
    ORDER_DATE?: string;
    orderId?: number;
    totalAmount?: number;
    createdAt?: string;
  }>;
}

/**
 * RecentOrdersCard Component
 * Show recent orders
 */
export const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
  const statusBadgeColor = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      PENDING: '⏳ Chờ xử lý',
      PROCESSING: '🔄 Đang xử lý',
      SHIPPED: '📦 Đã gửi',
      DELIVERED: '✓ Đã giao',
      CANCELLED: '❌ Đã hủy',
    };
    return status ? labels[status] || status : status;
  };

  if (!orders?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🛒 Đơn hàng gần đây</h3>

      <div className="space-y-3">
        {orders.slice(0, 5).map((order, idx) => (
          <div key={idx} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">
                  Đơn #{order.orderId ?? order.ORDER_ID ?? 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt || order.ORDER_DATE || Date.now()).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeColor(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {(order.totalAmount ?? order.TOTAL_AMOUNT ?? 0).toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full px-4 py-2 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded font-semibold transition">
        Xem tất cả đơn hàng
      </button>
    </div>
  );
};

/**
 * UserReviewsCard Component
 * Show user's book reviews
 */
interface UserReviewsCardProps {
  userId?: number | string;
  reviewCount?: number;
}

export const UserReviewsCard = ({ userId, reviewCount }: UserReviewsCardProps) => {
  const [reviews, setReviews] = useState<Array<{
    bookTitle?: string;
    rating?: number;
    content?: string;
    reviewDate?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/${userId}/reviews`, {
        params: { limit: 5 },
      });

      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">⭐ Đánh giá đã viết</h3>
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">⭐ Đánh giá đã viết</h3>
          <p className="text-sm text-gray-500 mt-1">{reviewCount || 0} đánh giá</p>
        </div>
        <Link href="/product">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold">
            ➕ Thêm
          </button>
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Chưa có đánh giá nào</p>
          <p className="text-gray-400 text-sm mt-2">Hãy mua sách và chia sẻ nhận xét của bạn</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="border-l-4 border-yellow-400 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{review.bookTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500">{'⭐'.repeat(review.rating ?? 0)}</span>
                    <span className="text-gray-500 text-sm">({review.rating ?? 0}/5)</span>
                  </div>
                  <p className="text-gray-700 text-sm mt-2 line-clamp-2">{review.content}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    📅 {new Date(review.reviewDate || Date.now()).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * WishlistCard Component
 * Show wishlist items
 */
interface WishlistCardProps {
  userId?: number | string;
  wishlistCount?: number;
}

export const WishlistCard = ({ userId, wishlistCount }: WishlistCardProps) => {
  const [wishlist, setWishlist] = useState<Array<{
    hinhanh?: string;
    tensp?: string;
    giaban?: number;
    priority?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [userId]);

  const loadWishlist = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/${userId}/wishlist`, {
        params: { limit: 6 },
      });

      if (response.data.success) {
        setWishlist(response.data.data);
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">❤️ Sách trong danh sách yêu thích</h3>
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">❤️ Sách trong danh sách yêu thích</h3>
          <p className="text-sm text-gray-500 mt-1">{wishlistCount || 0} sách</p>
        </div>
        <Link href="/product">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold">
            ➕ Thêm
          </button>
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Chưa có sách yêu thích nào</p>
          <p className="text-gray-400 text-sm mt-2">Bắt đầu tìm kiếm và thêm những cuốn sách bạn thích</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-3">
                <img
                  src={item.hinhanh || '/placeholder-book.jpg'}
                  alt={item.tensp}
                  className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm line-clamp-2">{item.tensp}</p>
                  <p className="text-blue-600 font-bold text-sm mt-1">
                    {(item.giaban || 0).toLocaleString('vi-VN')}₫
                  </p>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mt-2 inline-block">
                    {item.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Profile Page Component
 */
interface ProfilePageProps {
  userId?: number | string;
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, insightsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/profile/${userId}`),
        axios.get(`${API_BASE_URL}/profile/${userId}/insights`),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }
      if (insightsRes.data.success) {
        setInsights(insightsRes.data.data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // Still show page even if data fails
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const profileUser = (profile?.user as ProfileUser | undefined) ?? undefined;
  const analytics = (profile?.analytics as AnalyticsData | undefined) ?? undefined;
  const insightsData = (insights as InsightsData | undefined) ?? undefined;
  const recentOrders = (profile?.recentOrders as RecentOrdersCardProps['orders']) ?? [];
  const wishlistCount = typeof profile?.wishlistCount === 'number' ? profile.wishlistCount : 0;
  const reviewCount = typeof profile?.reviewCount === 'number' ? profile.reviewCount : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Navigation Header */}
      <div className="mb-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">👤 Thông tin cá nhân</h1>
          <div className="flex gap-3">
            <Link href="/cart">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                🛒 Giỏ hàng
              </button>
            </Link>
            <Link href="/">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                🏠 Trang chủ
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <ProfileHeader user={profileUser} userId={userId} onEdit={loadProfile} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Insights & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            <UserInsightsCard insights={insightsData} loading={false} />
            <ReadingAnalyticsCard analytics={analytics} />
          </div>

          {/* Right column: Quick stats */}
          <div className="bg-white rounded-lg p-6 shadow-md h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Tóm tắt</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Sách trong danh sách yêu thích</p>
                <p className="text-3xl font-bold text-blue-600">{wishlistCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đánh giá đã viết</p>
                <p className="text-3xl font-bold text-green-600">{reviewCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Đơn hàng gần đây</p>
                <p className="text-3xl font-bold text-purple-600">{recentOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <PersonalizedRecommendationsCard userId={userId} />

        {/* Recent Orders */}
        <RecentOrdersCard orders={recentOrders} />

        {/* Wishlist */}
        <WishlistCard userId={userId} wishlistCount={wishlistCount} />

        {/* User Reviews */}
        <UserReviewsCard userId={userId} reviewCount={reviewCount} />
      </div>
    </div>
  );
}
