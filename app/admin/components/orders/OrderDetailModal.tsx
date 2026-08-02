"use client";

import { X } from "lucide-react";
import OrderItemsTable from "./OrderItemsTable";
import { Order } from "./types";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailModal({ open, order, onClose }: Props) {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}

        <div className="flex justify-between items-center border-b px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold">
              Chi tiết đơn hàng #{order.ORDER_ID}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              {order.ORDER_DATE
                ? new Date(order.ORDER_DATE).toLocaleString("vi-VN")
                : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}

        <div className="p-6 space-y-8">
          {/* Khách hàng */}

          <div className="grid grid-cols-2 gap-8">
            <div className="border rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Thông tin khách hàng</h3>

              <div className="space-y-2">
                <p>
                  <b>Tên:</b> {order.FULLNAME}
                </p>

                <p>
                  <b>Tài khoản:</b> {order.USERNAME}
                </p>

                <p>
                  <b>Email:</b> {order.EMAIL}
                </p>

                <p>
                  <b>SĐT:</b> {order.PHONE}
                </p>
              </div>
            </div>

            {/* Giao hàng */}

            <div className="border rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Giao hàng</h3>

              <div className="space-y-2">
                <p>
                  <b>Địa chỉ:</b>
                </p>

                <p className="text-gray-700">{order.ADDRESS}</p>

                <p>
                  <b>Thanh toán:</b> {order.PAYMENT_METHOD}
                </p>

                <p>
                  <b>Trạng thái:</b> {order.STATUS}
                </p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}

          <div>
            <h3 className="font-bold text-lg mb-4">Danh sách sản phẩm</h3>

            <OrderItemsTable items={order.ITEMS || []} />
          </div>

          {/* Tổng tiền */}

          <div className="border-t pt-5">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính</span>

                  <b>₫{order.SUBTOTAL?.toLocaleString("vi-VN")}</b>
                </div>

                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>

                  <b>₫{order.SHIPPING_FEE?.toLocaleString("vi-VN")}</b>
                </div>

                <div className="flex justify-between">
                  <span>Giảm giá</span>

                  <b className="text-red-600">
                    -₫
                    {order.DISCOUNT?.toLocaleString("vi-VN")}
                  </b>
                </div>

                <hr />

                <div className="flex justify-between text-xl">
                  <span className="font-bold">Tổng cộng</span>

                  <span className="font-bold text-green-600">
                    ₫{order.TOTAL_AMOUNT?.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
