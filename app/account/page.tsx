'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI, orderAPI } from '@/lib/api';
import Footer from '@/components/Footer';

// ================= TYPES =================
interface UserProfile {
  userId: number;
  username?: string;
  role?: string;
  email?: string;
  fullname?: string;
}

interface Order {
  ORDER_ID: number;
  USER_ID: number;
  STATUS: string;
  TOTAL_AMOUNT: number;
  ORDER_DATE: string;
}

// ================= UTILS =================
const normalizeUser = (u: any): UserProfile => ({
  userId: u.userId || u.USER_ID,
  username: u.username || u.USERNAME,
  role: u.role || u.ROLE,
  email: u.email || u.EMAIL,
  fullname: u.fullname || u.FULLNAME,
});

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ================= COMPONENT =================
export default function Account() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ email: '', fullname: '' });
  const [editing, setEditing] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ===== INIT =====
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();

    if (!currentUser) {
      router.push('/login');
      return;
    }

    const normalized = normalizeUser(currentUser);

    if (!normalized.userId) {
      router.push('/login');
      return;
    }

    setUser(normalized);
    setEditData({
      email: normalized.email || '',
      fullname: normalized.fullname || '',
    });

    fetchOrders(normalized.userId);
    setLoading(false);
  }, [router]);

  // ===== FETCH ORDERS =====
  const fetchOrders = useCallback(async (userId: number) => {
    try {
      setOrdersLoading(true);
      const result = await orderAPI.getUserOrders(userId, 1, 20);
      setOrders(result?.data || []);
    } catch (err) {
      console.error('[Orders Error]', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ===== TOAST =====
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== UPDATE PROFILE =====
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!editData.email && !editData.fullname) {
      return showToast('error', 'Vui lòng nhập dữ liệu');
    }

    if (editData.email && !isValidEmail(editData.email)) {
      return showToast('error', 'Email không hợp lệ');
    }

    try {
      setEditing(true);

      const payload: any = {};
      if (editData.email) payload.email = editData.email;
      if (editData.fullname) payload.fullname = editData.fullname;

      const result = await authAPI.updateProfile(user.userId, payload);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              email: result?.data?.EMAIL || payload.email,
              fullname: result?.data?.FULLNAME || payload.fullname,
            }
          : prev
      );

      setShowEditModal(false);
      showToast('success', 'Cập nhật thành công');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Lỗi cập nhật');
    } finally {
      setEditing(false);
    }
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    if (!confirm('Đăng xuất?')) return;
    authAPI.logout();
    router.push('/');
  };

  // ===== FORMAT =====
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(p);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('vi-VN');

  const getStatusBadge = (status: string) => {
    const map: any = {
      PENDING: 'bg-yellow-100',
      PROCESSING: 'bg-blue-100',
      SHIPPED: 'bg-purple-100',
      DELIVERED: 'bg-green-100',
      CANCELLED: 'bg-red-100',
    };
    return (
      <span className={`${map[status] || 'bg-gray-100'} px-3 py-1 rounded`}>
        {status}
      </span>
    );
  };

  // ===== LOADING =====
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-10 text-center">
        <Link href="/login">Login</Link>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white shadow p-4 flex justify-between">
        <Link href="/">Home</Link>
        <div className="flex gap-4">
          <Link href="/cart">Cart</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">

        {/* PROFILE */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4">
            Xin chào {user.fullname || user.username}
          </h2>

          <p>Email: {user.email || 'Chưa có'}</p>

          <button
            onClick={() => setShowEditModal(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Edit
          </button>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-bold mb-4">Orders</h3>

          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders</p>
          ) : (
            orders.map((o) => (
              <div key={o.ORDER_ID} className="border p-3 mb-2">
                <p>#{o.ORDER_ID}</p>
                <p>{formatDate(o.ORDER_DATE)}</p>
                <p>{formatPrice(o.TOTAL_AMOUNT)}</p>
                {getStatusBadge(o.STATUS)}
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">

            <input
              value={editData.fullname}
              onChange={(e) =>
                setEditData({ ...editData, fullname: e.target.value })
              }
              placeholder="Fullname"
              className="w-full mb-3 p-2 border"
            />

            <input
              value={editData.email}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
              placeholder="Email"
              className="w-full mb-3 p-2 border"
            />

            <div className="flex gap-2">
              <button onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button onClick={handleUpdateProfile}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2">
          {toast.message}
        </div>
      )}

      <Footer />
    </div>
  );
}