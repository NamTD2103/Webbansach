"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, orderAPI } from "@/lib/api";
import Footer from "@/components/Footer";
import { getWishlistItems } from "@/lib/userExperience";
import AccountHero from "@/components/account/AccountHero";
import AccountStats from "@/components/account/AccountStats";
import Sidebar from "@/components/account/Sidebar";
import OrderList from "@/components/account/OrderList";
import EditProfileModal from "@/components/account/EditProfileModal";
import ReviewModal from "@/components/orders/ReviewModal";
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

  const [showReviewModal, setShowReviewModal] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  

  const [cancelLoading, setCancelLoading] = useState(false);

  const [reorderLoading, setReorderLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);


  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ email: "", fullname: "" });
  const [editing, setEditing] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ===== INIT =====
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    const normalized = normalizeUser(currentUser);

    if (!normalized.userId) {
      router.push("/login");
      return;
    }

    setUser(normalized);
    setWishlistItems(getWishlistItems());
    setEditData({
      email: normalized.email || "",
      fullname: normalized.fullname || "",
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
      console.error("[Orders Error]", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);
  const handleDetail = async (order: Order) => {
    try {
      const result = await orderAPI.getOrderDetail(order.ORDER_ID);

      setSelectedOrder(result.data);

      setShowOrderModal(true);
    } catch (err) {
      console.error(err);
      showToast("error", "Không tải được chi tiết đơn hàng");
    }
  };
  const handleCancel = async (order: Order) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;

    try {
      setCancelLoading(true);

      await orderAPI.cancelOrder(order.ORDER_ID);

      showToast("success", "Hủy đơn thành công");

      if (user) {
        fetchOrders(user.userId);
      }
    } catch (err: any) {
      showToast("error", err.message || "Không thể hủy đơn");
    } finally {
      setCancelLoading(false);
    }
  };
  const handleReorder = async (order: Order) => {
    try {
      setReorderLoading(true);

      await orderAPI.reorder(order.ORDER_ID);

      showToast("success", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (err: any) {
      showToast("error", err.message || "Không thể mua lại");
    } finally {
      setReorderLoading(false);
    }
  };
  const handleRepay = async (order: Order) => {
    try {
      await orderAPI.repay(order.ORDER_ID);

      showToast("success", "Đang chuyển sang thanh toán");
    } catch (err: any) {
      showToast("error", err.message || "Không thể thanh toán");
    }
  };
  const handleInvoice = async (order: Order) => {
    try {
      const blob = await orderAPI.downloadInvoice(order.ORDER_ID);

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `Invoice_${order.ORDER_ID}.pdf`;

      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      showToast("error", "Không tải được hóa đơn");
    }
  };
const handleReview = async (order: Order) => {
  try {
    const result = await orderAPI.getOrderDetail(order.ORDER_ID);

    setSelectedOrder(result.data);

    setShowReviewModal(true);

  } catch (err) {
    console.error(err);
    showToast("error", "Không tải được sản phẩm");
  }
};

  // ===== TOAST =====
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== UPDATE PROFILE =====
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!editData.email && !editData.fullname) {
      return showToast("error", "Vui lòng nhập dữ liệu");
    }

    if (editData.email && !isValidEmail(editData.email)) {
      return showToast("error", "Email không hợp lệ");
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
          : prev,
      );

      setShowEditModal(false);
      showToast("success", "Cập nhật thành công");
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Lỗi cập nhật");
    } finally {
      setEditing(false);
    }
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    if (!confirm("Đăng xuất?")) return;
    authAPI.logout();
    router.push("/");
  };

  // ===== FORMAT =====
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(p);

  const formatDate = (d: string) => new Date(d).toLocaleString("vi-VN");

  const getStatusBadge = (status: string) => {
    const map: any = {
      PENDING: "bg-yellow-100",
      PROCESSING: "bg-blue-100",
      SHIPPED: "bg-purple-100",
      DELIVERED: "bg-green-100",
      CANCELLED: "bg-red-100",
    };
    return (
      <span className={`${map[status] || "bg-gray-100"} px-3 py-1 rounded`}>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-red-500">
            📚 CloudyInSouth
          </Link>
          <div className="flex gap-3">
            <Link
              href="/cart"
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              🛒 Giỏ hàng
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <AccountHero
          user={user}
          totalOrders={orders.length}
          wishlistCount={wishlistItems.length}
        />

        {/* Stats */}
        <div className="mt-8">
          <AccountStats
            orders={orders.length}
            wishlist={wishlistItems.length}
          />
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 mt-8 items-start">
          <Sidebar
            onEdit={() => setShowEditModal(true)}
            onLogout={handleLogout}
          />

          <OrderList
            orders={orders}
            loading={ordersLoading}
            onDetail={handleDetail}
            onCancel={handleCancel}
            onReorder={handleReorder}
            onRepay={handleRepay}
            onInvoice={handleInvoice}
            onReview={handleReview}
          />
        </div>
      </main>

      {/* MODAL */}
      <EditProfileModal
        open={showEditModal}
        editData={editData}
        editing={editing}
        onClose={() => setShowEditModal(false)}
        onChange={(field, value) =>
          setEditData((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onSave={handleUpdateProfile}
      />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2">
          {toast.message}
        </div>
      )}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-4">
              Đơn hàng #{selectedOrder.ORDER_ID}
            </h2>

            <p>Trạng thái: {selectedOrder.STATUS}</p>

            <p>
              Tổng tiền:
              {selectedOrder.TOTAL_AMOUNT?.toLocaleString()}đ
            </p>

            {selectedOrder.items?.map((item: any) => (
              <div key={item.ITEM_ID} className="flex gap-3 border-b py-3">
                <img src={item.IMAGE_URL} className="w-16 h-16 rounded" />

                <div>
                  <p>{item.TENSP}</p>
                  <p>x{item.SOLUONG}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
{showReviewModal && selectedOrder && (
    <ReviewModal
        order={selectedOrder}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
            showToast("success", "Đánh giá thành công");
            setShowReviewModal(false);
        }}
    />
)}
      <Footer />
    </div>
  );
}
