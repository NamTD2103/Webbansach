"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  XCircle,
  Package,
  Search,
} from "lucide-react";

import { authAPI, orderAPI } from "@/lib/api";

import OrderCard from "@/components/orders/OrderCard";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ReviewModal from "@/components/orders/ReviewModal";
import OrderTimeline from "@/components/orders/OrderTimeline";
import LoadingSkeleton from "@/components/orders/LoadingSkeleton";
import EmptyOrders from "@/components/orders/EmptyOrders";

interface OrderItem {
  ITEM_ID: number;
  MASP: string;
  TENSP: string;
  IMAGE_URL: string;
  PRICE: number;
  SOLUONG: number;
  TOTAL: number;
}

interface Order {
  ORDER_ID: number;
  USER_ID: number;
  STATUS: string;
  TOTAL_AMOUNT: number;
  ORDER_DATE: string;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [trackingOpen, setTrackingOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      if (!currentUser) return;

      const res = await orderAPI.getUserOrders(currentUser.userId);

      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(orderId: number) {
    try {
      const res = await orderAPI.getOrderDetail(orderId);

      setSelectedOrder(res.data);

      setTrackingOpen(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCancel(reason: string) {
    if (!selectedOrder) return;

    try {
      await orderAPI.cancelOrder(selectedOrder.ORDER_ID, reason);

      setCancelOpen(false);

      await loadOrders();

      alert("Đơn hàng đã được hủy.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReorder(orderId: number) {
    try {
      await orderAPI.reorder(orderId);

      alert("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRepay(orderId: number) {
    try {
      await orderAPI.repay(orderId);

      alert("Chuyển sang thanh toán.");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function downloadInvoice(orderId: number) {
    try {
      const blob = await orderAPI.downloadInvoice(orderId);

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `Invoice_${orderId}.pdf`;

      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Không tải được hóa đơn");
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "ALL" || o.STATUS === statusFilter;

      const matchSearch = o.ORDER_ID.toString().includes(search);

      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-10">
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>

            <p className="text-gray-500 mt-2">
              Theo dõi tất cả đơn hàng của bạn
            </p>
          </div>

          <div className="p-6 flex gap-4 flex-wrap">
            <div className="flex items-center border rounded-lg px-4 py-2 flex-1">
              <Search size={18} />

              <input
                className="ml-2 outline-none w-full"
                placeholder="Tìm theo mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border rounded-lg px-4"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả</option>

              <option value="PENDING">Chờ xác nhận</option>

              <option value="PROCESSING">Đang xử lý</option>

              <option value="SHIPPING">Đang giao</option>

              <option value="DELIVERED">Đã giao</option>

              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="p-6 space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package size={60} className="mx-auto text-gray-400" />

                <h3 className="text-xl font-semibold mt-4">
                  Không tìm thấy đơn hàng
                </h3>

                <p className="text-gray-500 mt-2">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.ORDER_ID}
                  order={order}
                  onDetail={() => openDetail(order.ORDER_ID)}
                  onCancel={() => {
                    setSelectedOrder(order);
                    setCancelOpen(true);
                  }}
                  onReorder={() => handleReorder(order.ORDER_ID)}
                  onRepay={() => handleRepay(order.ORDER_ID)}
                  onInvoice={() => downloadInvoice(order.ORDER_ID)}
                  onReview={() => {
                    setSelectedOrder(order);
                    setReviewOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* CANCEL MODAL */}

      {cancelOpen && selectedOrder && (
        <CancelOrderModal
          order={selectedOrder}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
        />
      )}

      {/* REVIEW MODAL */}

      {/* {reviewOpen && selectedOrder && (
        <ReviewModal
          order={selectedOrder}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => {
            setReviewOpen(false);

            loadOrders();
          }}
        />
      )} */}

      {/* ORDER DETAIL / TRACKING */}

      {trackingOpen && selectedOrder && (
        <div
          className="
          fixed inset-0 
          bg-black/40 
          flex 
          items-center 
          justify-center
          z-50
        "
        >
          <div
            className="
            bg-white
            rounded-xl
            shadow-xl
            w-full
            max-w-3xl
            p-6
            relative
          "
          >
            <button
              className="
                absolute
                right-5
                top-5
                text-gray-500
                hover:text-black
              "
              onClick={() => setTrackingOpen(false)}
            >
              <XCircle size={26} />
            </button>

            <h2
              className="
              text-2xl
              font-bold
              mb-6
            "
            >
              Chi tiết đơn hàng #{selectedOrder.ORDER_ID}
            </h2>

            <OrderTimeline status={selectedOrder.STATUS} />

            <div className="mt-8 space-y-4">
              {selectedOrder.items?.map((item) => (
                <div
                  key={item.ITEM_ID}
                  className="
                    flex
                    items-center
                    gap-4
                    border-b
                    pb-4
                  "
                >
                  <img
                    src={item.IMAGE_URL}
                    className="
                      w-20
                      h-20
                      rounded-lg
                      object-cover
                    "
                  />

                  <div className="flex-1">
                    <h4
                      className="
                      font-semibold
                    "
                    >
                      {item.TENSP}
                    </h4>

                    <p
                      className="
                      text-gray-500
                    "
                    >
                      Số lượng:
                      {item.SOLUONG}
                    </p>

                    <p
                      className="
                      text-red-500
                      font-semibold
                    "
                    >
                      {item.PRICE.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="
              mt-6
              flex
              justify-between
              border-t
              pt-5
            "
            >
              <span
                className="
                font-semibold
              "
              >
                Tổng tiền
              </span>

              <span
                className="
                text-xl
                font-bold
                text-red-600
              "
              >
                {selectedOrder.TOTAL_AMOUNT.toLocaleString()}đ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

