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
import { productAPI, adminAPI, Product } from "@/lib/api";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductTable from "./components/ProductTable";
import ProductModal from "./components/ProductModal";
import AccountsTable from "./components/AccountsTable";
import AccountModal from "./components/AccountModal";
import Toast from "./components/Toast";

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
    "dashboard" | "products" | "accounts" | "orders" | "vouchers"
  >("dashboard");

  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  // Account states
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [accountModalLoading, setAccountModalLoading] = useState(false);

  // Order states
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);

const [voucherLoading, setVoucherLoading] = useState(false);

const [editingVoucher, setEditingVoucher] = useState<any>(null);

const [isVoucherModalOpen, setIsVoucherModalOpen] =useState(false);

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

  // Fetch functions
  useEffect(() => {
    fetchProducts();
    fetchUsers();
    fetchOrders();
    fetchVouchers();
  }, []);
  useEffect(() => {
    if (activeTab === "accounts" && users.length === 0) {
      fetchUsers();
    } else if (activeTab === "orders" && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);

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
    try{
        setVoucherLoading(true);

        const res = await adminAPI.getAllVouchers();

        setVouchers(res.data || []);

    }finally{
        setVoucherLoading(false);
    }
}


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
    if (!productData.GIA || productData.GIA <= 0) {
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
              <div className="mb-6">
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
                  products={products}
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
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-blue-600">
                    {orders.length}
                  </div>
                  <div className="text-gray-600 mt-2">Tổng đơn hàng</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-yellow-600">
                    {orders.filter((o) => o.STATUS === "PENDING").length}
                  </div>
                  <div className="text-gray-600 mt-2">Chờ xử lý</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-orange-600">
                    {orders.filter((o) => o.STATUS === "PROCESSING").length}
                  </div>
                  <div className="text-gray-600 mt-2">Đang xử lý</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-green-600">
                    {orders.filter((o) => o.STATUS === "COMPLETED").length}
                  </div>
                  <div className="text-gray-600 mt-2">Hoàn thành</div>
                </div>
              </div>

              {/* Orders Table */}
              {ordersLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Mã ĐH
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Khách hàng
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Số SP
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Tổng tiền
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-8 text-gray-500"
                          >
                            Không có đơn hàng
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr
                            key={order.ORDER_ID}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-3 text-sm text-gray-900">
                              #{order.ORDER_ID}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">
                              {order.USERNAME}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">
                              {order.ITEM_COUNT || 0}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                              ₫{order.TOTAL_AMOUNT?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.STATUS === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : order.STATUS === "PROCESSING"
                                      ? "bg-orange-100 text-orange-800"
                                      : order.STATUS === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.STATUS === "COMPLETED"
                                  ? "Hoàn thành"
                                  : order.STATUS === "PROCESSING"
                                    ? "Đang xử lý"
                                    : order.STATUS === "PENDING"
                                      ? "Chờ xử lý"
                                      : "Hủy"}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {order.ORDER_DATE
                                ? new Date(order.ORDER_DATE).toLocaleDateString(
                                    "vi-VN",
                                  )
                                : "-"}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <select
                                value={order.STATUS}
                                onChange={(e) =>
                                  adminAPI
                                    .updateOrderStatus(
                                      order.ORDER_ID,
                                      e.target.value,
                                    )
                                    .then(() => {
                                      showToast(
                                        "Cập nhật trạng thái thành công",
                                        "success",
                                      );
                                      fetchOrders();
                                    })
                                    .catch((err) =>
                                      showToast(
                                        err.message ||
                                          "Lỗi cập nhật trạng thái",
                                        "error",
                                      ),
                                    )
                                }
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="PENDING">Chờ xử lý</option>
                                <option value="PROCESSING">Đang xử lý</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELLED">Hủy</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {activeTab === "vouchers" && (
  <>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">
        Quản lý mã giảm giá
      </h2>

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
