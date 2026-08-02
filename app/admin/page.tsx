"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "./components/StatsCard";
import RevenueChart from "./components/charts/RevenueChart";
import OrderStatusChart from "./components/charts/OrderStatusChart";
import { Package, Users, ShoppingCart, CircleDollarSign } from "lucide-react";
import VoucherTable from "./components/VoucherTable";
import VoucherModal from "./components/VoucherModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OrderSection from "./components/orders/OrderSection";
import { productAPI, adminAPI, Product } from "@/lib/api";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductTable from "./components/ProductTable";
import ProductModal from "./components/ProductModal";
import AccountsTable from "./components/AccountsTable";
import AccountModal from "./components/AccountModal";
import Toast from "./components/Toast";
import ReviewTable from "./components/ReviewTable";
import QuestionTable from "./components/QuestionTable";

interface User {
  USER_ID: number;
  USERNAME: string;
  EMAIL?: string;
  FULLNAME?: string;
  ROLE: string;
  CREATED_AT?: string;
}

interface ToastType {
  message: string;
  type: "success" | "error";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "products"
    | "accounts"
    | "orders"
    | "vouchers"
    | "reviews"
    | "questions"
  >("dashboard");

  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productKeyword, setProductKeyword] = useState("");

  // Account states
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [accountModalLoading, setAccountModalLoading] = useState(false);
  // Review states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Question states
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  // Order states
  const [orders, setOrders] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);

  const [voucherLoading, setVoucherLoading] = useState(false);

  const [editingVoucher, setEditingVoucher] = useState<any>(null);

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastType | null>(null);

  // Revenue chart data
  const revenueData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((order) => {
      if (!order.ORDER_DATE) return;
      const date = new Date(order.ORDER_DATE).toLocaleDateString("vi-VN");
      if (!map[date]) map[date] = 0;
      map[date] += order.TOTAL_AMOUNT || 0;
    });
    return Object.keys(map).map((date) => ({ date, total: map[date] }));
  }, [orders]);
  const filteredOrders = useMemo(() => {
    let data = [...orders];

    // Tìm kiếm
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();

      data = data.filter(
        (o) =>
          o.ORDER_ID?.toString().includes(keyword) ||
          o.USERNAME?.toLowerCase().includes(keyword) ||
          o.FULLNAME?.toLowerCase().includes(keyword),
      );
    }

    // Trạng thái
    if (statusFilter !== "ALL") {
      data = data.filter((o) => o.STATUS === statusFilter);
    }

    // Thanh toán
    if (paymentFilter !== "ALL") {
      data = data.filter((o) => o.PAYMENT_METHOD === paymentFilter);
    }

    // Ngày bắt đầu
    if (fromDate) {
      data = data.filter((o) => new Date(o.ORDER_DATE) >= new Date(fromDate));
    }

    // Ngày kết thúc
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59);

      data = data.filter((o) => new Date(o.ORDER_DATE) <= end);
    }

    switch (sortBy) {
      case "oldest":
        data.sort(
          (a, b) =>
            new Date(a.ORDER_DATE).getTime() - new Date(b.ORDER_DATE).getTime(),
        );
        break;

      case "price_high":
        data.sort((a, b) => (b.TOTAL_AMOUNT || 0) - (a.TOTAL_AMOUNT || 0));
        break;

      case "price_low":
        data.sort((a, b) => (a.TOTAL_AMOUNT || 0) - (b.TOTAL_AMOUNT || 0));
        break;

      default:
        data.sort(
          (a, b) =>
            new Date(b.ORDER_DATE).getTime() - new Date(a.ORDER_DATE).getTime(),
        );
    }

    return data;
  }, [
    orders,
    searchKeyword,
    statusFilter,
    paymentFilter,
    fromDate,
    toDate,
    sortBy,
  ]);
  const filteredProducts = useMemo(() => {
    if (!productKeyword.trim()) return products;

    const keyword = productKeyword.toLowerCase();

    return products.filter(
      (p) =>
        p.MASP?.toLowerCase().includes(keyword) ||
        p.TENSP?.toLowerCase().includes(keyword),
    );
  }, [products, productKeyword]);
  const totalFilteredAmount = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + (order.TOTAL_AMOUNT || 0),
      0,
    );
  }, [filteredOrders]);

  // Fetch functions
  useEffect(() => {
    fetchProducts();
    fetchUsers();
    fetchOrders();
    fetchVouchers();
    fetchReviews();
    fetchQuestions();
  }, []);
  useEffect(() => {
    if (activeTab === "accounts" && users.length === 0) {
      fetchUsers();
    } else if (activeTab === "orders" && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);
  const handleResetFilter = () => {
    setSearchKeyword("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setFromDate("");
    setToDate("");
    setSortBy("newest");
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productAPI.getAll(1, 100);
      setProducts(response.data || []);
      setTotalProducts(response.pagination?.total || 0);
    } catch (error) {
      showToast("Lỗi khi tải danh sách sản phẩm", "error");
      console.error(error);
    } finally {
      setProductsLoading(false);
    }
  };
  const fetchVouchers = async () => {
    try {
      setVoucherLoading(true);

      const res = await adminAPI.getAllVouchers();

      setVouchers(res.data || []);
    } finally {
      setVoucherLoading(false);
    }
  };
  const fetchReviews = async () => {
    try {
      setReviewLoading(true);

      const res = await adminAPI.getAllReviews();

      setReviews(res.data || []);
    } catch (err) {
      console.error(err);

      showToast("Lỗi tải đánh giá", "error");
    } finally {
      setReviewLoading(false);
    }
  };
  const fetchQuestions = async () => {
    try {
      setQuestionLoading(true);

      const res = await adminAPI.getAllQuestions();

      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);

      showToast("Lỗi tải hỏi đáp", "error");
    } finally {
      setQuestionLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error: any) {
      showToast(error.message || "Lỗi khi tải danh sách khách hàng", "error");
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await adminAPI.getAllOrders();
      setOrders(response.data || []);
    } catch (error: any) {
      showToast(error.message || "Lỗi khi tải danh sách đơn hàng", "error");
      console.error(error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Toast helper
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Product handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (!productData.TENSP || productData.TENSP.trim() === "") {
      showToast("Tên sản phẩm không được để trống", "error");
      return;
    }
    if (!productData.GIABAN || Number(productData.GIABAN) <= 0) {
      showToast("Giá sản phẩm phải lớn hơn 0", "error");
      return;
    }
    if (productData.SOLUONGTON == null || productData.SOLUONGTON < 0) {
      showToast("Số lượng tồn phải >= 0", "error");
      return;
    }
    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.MASP, productData);
        showToast("Cập nhật sản phẩm thành công", "success");
      } else {
        await productAPI.create(productData);
        showToast("Thêm sản phẩm thành công", "success");
      }
      setIsProductModalOpen(false);
      await fetchProducts();
    } catch (error: any) {
      showToast(error.message || "Lỗi khi lưu sản phẩm", "error");
    }
  };

  const handleDeleteProduct = async (masp: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await productAPI.delete(masp);
      showToast("Xóa sản phẩm thành công", "success");
      await fetchProducts();
    } catch (error: any) {
      showToast(error.message || "Lỗi khi xóa sản phẩm", "error");
    }
  };

  // Account handlers
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAccountModalOpen(true);
  };

  const handleSaveUser = async (userId: number, data: any) => {
    try {
      setAccountModalLoading(true);
      await adminAPI.updateUser(userId, data);
      showToast("Cập nhật tài khoản thành công", "success");
      setIsAccountModalOpen(false);
      await fetchUsers();
    } catch (error: any) {
      showToast(error.message || "Lỗi khi cập nhật tài khoản", "error");
    } finally {
      setAccountModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      await adminAPI.deleteUser(userId);
      showToast("Xóa tài khoản thành công", "success");
      await fetchUsers();
    } catch (error: any) {
      showToast(error.message || "Lỗi khi xóa tài khoản", "error");
    }
  };
  // ================= Voucher =================

  const handleAddVoucher = () => {
    setEditingVoucher(null);
    setIsVoucherModalOpen(true);
  };

  const handleEditVoucher = (voucher: any) => {
    setEditingVoucher(voucher);
    setIsVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (data: any) => {
    try {
      if (editingVoucher) {
        await adminAPI.updateVoucher(editingVoucher.VOUCHER_ID, data);

        showToast("Cập nhật mã giảm giá thành công", "success");
      } else {
        await adminAPI.createVoucher(data);

        showToast("Thêm mã giảm giá thành công", "success");
      }

      setIsVoucherModalOpen(false);
      setEditingVoucher(null);

      fetchVouchers();
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu", "error");
    }
  };

  const handleDeleteVoucher = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa mã giảm giá?")) return;

    try {
      await adminAPI.deleteVoucher(id);

      showToast("Xóa thành công", "success");

      fetchVouchers();
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa", "error");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-100">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <div className="absolute inset-0 -z-20 pointer-events-none">
        <div className="absolute left-0 top-0 w-[700px] h-[700px] bg-blue-500/20 blur-[180px] rounded-full" />
        <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-purple-500/20 blur-[180px] rounded-full" />
        <div className="absolute left-1/2 top-1/2 w-[500px] h-[500px] bg-cyan-400/10 blur-[150px] rounded-full" />
      </div>

      <div className="ml-72 min-h-screen">
        <div className="px-8 pt-6">
          <Header />
        </div>

        <main className="px-8 py-6">
          {activeTab === "dashboard" && (
            <>
              {/* KPI */}
              {/* 
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">

        ...

    </div> */}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RevenueChart orders={orders} />

                <OrderStatusChart orders={orders} />
              </div>
            </>
          )}
          {/* Toàn bộ Products / Accounts / Orders để ở đây */}

          {/* Products Tab */}
          {activeTab === "products" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Tổng sản phẩm"
                  value={totalProducts}
                  subtitle="Đồng bộ từ Oracle"
                  icon={Package}
                  color="bg-blue-600"
                />

                <StatsCard
                  title="Khách hàng"
                  value={users.length}
                  subtitle="Tài khoản hệ thống"
                  icon={Users}
                  color="bg-green-600"
                />

                <StatsCard
                  title="Đơn hàng"
                  value={orders.length}
                  subtitle="Tất cả đơn hàng"
                  icon={ShoppingCart}
                  color="bg-orange-500"
                />

                <StatsCard
                  title="Doanh thu"
                  value={`₫${orders
                    .reduce((sum, item) => sum + (item.TOTAL_AMOUNT || 0), 0)
                    .toLocaleString()}`}
                  subtitle="Theo dữ liệu backend"
                  icon={CircleDollarSign}
                  color="bg-purple-600"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã hoặc tên sản phẩm..."
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                    className="w-80 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => setProductKeyword("")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  + Thêm sản phẩm
                </button>
              </div>
              {/* Products Table */}
              {productsLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              )}
            </>
          )}

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-purple-600">
                    {users.length}
                  </div>
                  <div className="text-gray-600 mt-2">Tổng khách hàng</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-green-600">
                    {users.filter((u) => u.ROLE === "USER").length}
                  </div>
                  <div className="text-gray-600 mt-2">Khách hàng thường</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-yellow-600">
                    {users.filter((u) => u.ROLE === "ADMIN").length}
                  </div>
                  <div className="text-gray-600 mt-2">Quản trị viên</div>
                </div>
              </div>

              {/* Accounts Table */}
              {usersLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <AccountsTable
                  users={users}
                  loading={usersLoading}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <OrderSection
              orders={filteredOrders}
              loading={ordersLoading}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalFilteredAmount={totalFilteredAmount}
              handleResetFilter={handleResetFilter}
              fetchOrders={fetchOrders}
              showToast={showToast}
            />
          )}
          {activeTab === "vouchers" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Quản lý mã giảm giá</h2>

                <button
                  onClick={handleAddVoucher}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  + Thêm mã
                </button>
              </div>

              {voucherLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  Đang tải...
                </div>
              ) : (
                <VoucherTable
                  vouchers={vouchers}
                  onEdit={handleEditVoucher}
                  onDelete={handleDeleteVoucher}
                />
              )}
            </>
          )}
          {activeTab === "reviews" && (
            <>
              <h2 className="text-2xl font-bold mb-6">
                Quản lý đánh giá sản phẩm
              </h2>

              <ReviewTable
                reviews={reviews}
                onToggleStatus={(id, status) => {
                  console.log(id, status);
                }}
              />
            </>
          )}
          {activeTab === "questions" && (
            <>
              <h2 className="text-2xl font-bold mb-6">
                Quản lý hỏi đáp khách hàng
              </h2>

              <QuestionTable
                questions={questions}
                onAnswer={async (id, text) => {
                  await adminAPI.answerQuestion(id, text);

                  showToast("Đã trả lời câu hỏi", "success");

                  fetchQuestions();
                }}
              />
            </>
          )}
        </main>

        {/* Modals */}
        {isProductModalOpen && (
          <ProductModal
            product={editingProduct}
            onSave={handleSaveProduct}
            onClose={() => {
              setIsProductModalOpen(false);
              setEditingProduct(null);
            }}
          />
        )}
        {isAccountModalOpen && editingUser && (
          <AccountModal
            isOpen={isAccountModalOpen}
            user={editingUser}
            onClose={() => {
              setIsAccountModalOpen(false);
              setEditingUser(null);
            }}
            onSave={handleSaveUser}
            loading={accountModalLoading}
          />
        )}
        {isVoucherModalOpen && (
          <VoucherModal
            voucher={editingVoucher}
            onSave={handleSaveVoucher}
            onClose={() => {
              setEditingVoucher(null);
              setIsVoucherModalOpen(false);
            }}
          />
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
