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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productAPI, adminAPI, Product } from "@/lib/api";
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
    "products" | "accounts" | "orders"
  >("products");

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🔧 Admin Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </header>

      {/* Revenue Chart*/}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">📈 Doanh thu theo ngày</h2>
        {revenueData.length === 0 ? (
          <p className="text-gray-500">Không có dữ liệu</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => `₫${Number(value ?? 0).toLocaleString()}`}
              />
              <Bar
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "products"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📦 Quản lý Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "accounts"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            👥 Quản lý Khách hàng
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "orders"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📋 Quản lý Đơn hàng
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-4xl font-bold text-blue-600">
                  {totalProducts}
                </div>
                <div className="text-gray-600 mt-2">Tổng số sản phẩm</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-4xl font-bold text-green-600">
                  {products.filter((p) => p.SOLUONGTON > 0).length}
                </div>
                <div className="text-gray-600 mt-2">Sản phẩm có sẵn</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-4xl font-bold text-red-600">
                  {products.filter((p) => p.SOLUONGTON === 0).length}
                </div>
                <div className="text-gray-600 mt-2">Sản phẩm hết hàng</div>
              </div>
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
                                      err.message || "Lỗi cập nhật trạng thái",
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

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
