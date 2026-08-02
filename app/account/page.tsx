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
import ReviewItem from "@/components/orders/ReviewItem";
import PasswordModal from "@/components/account/PasswordModal";
import LoyaltyCard from "./components/LoyaltyCard";
import { loyaltyAPI } from "@/lib/api";
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
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [reorderLoading, setReorderLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [editData, setEditData] = useState({ email: "", fullname: "" });
  const [editing, setEditing] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

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

    // Lấy điểm tích lũy
    loadLoyalty(normalized.userId);

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
  const loadLoyalty = async (userId: number) => {
    try {
      const result = await loyaltyAPI.getPoints(userId);

      setLoyaltyPoints(result.points || 0);
    } catch (err) {
      console.error(err);
    }
  };
  const handleRedeem = async (point: number) => {
    if (!user) return;

    const ok = confirm(`Bạn có chắc muốn đổi ${point} điểm lấy voucher?`);

    if (!ok) return;

    try {
      const result = await loyaltyAPI.redeem(user.userId, point);

      alert(
        `🎉 Đổi điểm thành công!\n\n` +
          `Mã voucher: ${result.voucher.code}\n` +
          `Giảm: ${result.voucher.discount.toLocaleString()}đ`,
      );

      // Load lại điểm
      loadLoyalty(user.userId);
    } catch (err: any) {
      showToast("error", err.message || "Không thể đổi điểm");
    }
  };
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

  const handleChangePassword = async () => {
    if (!user) return;

    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      return showToast("error", "Vui lòng nhập đầy đủ thông tin");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast("error", "Mật khẩu xác nhận không khớp");
    }

    if (passwordData.newPassword.length < 6) {
      return showToast("error", "Mật khẩu mới tối thiểu 6 ký tự");
    }

    try {
      setChangingPassword(true);

      await authAPI.changePassword(user.userId, {
        oldPassword: passwordData.oldPassword,

        newPassword: passwordData.newPassword,
      });

      showToast("success", "Đổi mật khẩu thành công");

      setShowPasswordModal(false);

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      showToast("error", err.message || "Đổi mật khẩu thất bại");
    } finally {
      setChangingPassword(false);
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
  const filteredOrders = orders.filter((order) => {
    // tìm kiếm
    const matchKeyword =
      order.ORDER_ID.toString().includes(searchKeyword) ||
      order.STATUS.toLowerCase().includes(searchKeyword.toLowerCase());

    // lọc trạng thái
    const matchStatus = statusFilter === "ALL" || order.STATUS === statusFilter;

    return matchKeyword && matchStatus;
  });

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
          onWishlist={() => setShowWishlist(true)}
        />

        {/* Stats */}
        <div className="mt-8">
          <AccountStats
            orders={orders.length}
            wishlist={wishlistItems.length}
            loyaltyPoints={loyaltyPoints}
          />
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 mt-8 items-start">
          {/* Sidebar */}
          <Sidebar
            userId={user.userId}
            onWishlist={() => setShowWishlist(true)}
            onEdit={() => setShowEditModal(true)}
            onChangePassword={() => setShowPasswordModal(true)}
            onLogout={handleLogout}
          />

          {/* Nội dung bên phải */}
          <div>
            <LoyaltyCard points={loyaltyPoints} onRedeem={handleRedeem} />
            {/* Search */}
            <div className="bg-white rounded-xl p-5 shadow">
              <input
                type="text"
                placeholder="Tìm theo mã đơn hoặc trạng thái..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-3 flex-wrap mt-4 mb-6">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "ALL" ? "bg-red-500 text-white" : ""
                }`}
              >
                Tất cả
              </button>

              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "PENDING" ? "bg-yellow-500 text-white" : ""
                }`}
              >
                Chờ xác nhận
              </button>

              <button
                onClick={() => setStatusFilter("PROCESSING")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "PROCESSING" ? "bg-blue-500 text-white" : ""
                }`}
              >
                Đang xử lý
              </button>

              <button
                onClick={() => setStatusFilter("SHIPPED")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "SHIPPED" ? "bg-purple-500 text-white" : ""
                }`}
              >
                Đang giao
              </button>

              <button
                onClick={() => setStatusFilter("DELIVERED")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "DELIVERED" ? "bg-green-600 text-white" : ""
                }`}
              >
                Đã giao
              </button>

              <button
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-4 py-2 rounded-lg border ${
                  statusFilter === "CANCELLED" ? "bg-red-600 text-white" : ""
                }`}
              >
                Đã hủy
              </button>

              <button
                onClick={() => {
                  setSearchKeyword("");
                  setStatusFilter("ALL");
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Reset
              </button>
            </div>

            {/* Danh sách đơn */}
            {showWishlist ? (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">❤️ Danh sách yêu thích</h2>

                  <button
                    onClick={() => setShowWishlist(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  >
                    Quay lại đơn hàng
                  </button>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Chưa có sản phẩm yêu thích.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item: any) => (
                      <div
                        key={item.MASP}
                        className="border rounded-xl p-4 hover:shadow-lg transition"
                      >
                        <img
                          src={item.IMAGE_URL}
                          className="w-full h-52 object-cover rounded-lg"
                        />

                        <h3 className="font-bold mt-4">{item.TENSP}</h3>

                        <p className="text-red-500 font-semibold mt-2">
                          {item.GIABAN?.toLocaleString()} đ
                        </p>

                        <Link
                          href={`/product/${item.MASP}`}
                          className="inline-block mt-4 px-4 py-2 rounded-lg bg-red-500 text-white"
                        >
                          Xem sản phẩm
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <OrderList
                orders={filteredOrders}
                loading={ordersLoading}
                onDetail={handleDetail}
                onCancel={handleCancel}
                onReorder={handleReorder}
                onRepay={handleRepay}
                onInvoice={handleInvoice}
              />
            )}
          </div>
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
      <PasswordModal
        open={showPasswordModal}
        data={passwordData}
        loading={changingPassword}
        onClose={() => setShowPasswordModal(false)}
        onChange={(field, value) =>
          setPasswordData((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onSave={handleChangePassword}
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
              <div key={item.ITEM_ID} className="flex gap-4 border-b py-5">
                <img
                  src={item.IMAGE_URL || "/images/no-image.png"}
                  className="w-20 h-20 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.TENSP}</h3>

                  <p className="text-gray-500">Số lượng: {item.SOLUONG}</p>

                  <ReviewItem
                    userId={user.userId}
                    orderId={selectedOrder.ORDER_ID}
                    product={{
                      MASP: item.MASP,
                      TENSP: item.TENSP,
                      IMAGE_URL: item.IMAGE_URL,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
