"use client";

import {
  Eye,
  RotateCcw,
  XCircle,
  FileText,
  Star,
  CreditCard,
} from "lucide-react";

interface OrderItem {
  TENSP: string;

  IMAGE_URL: string;

  PRICE: number;

  SOLUONG: number;
}

interface Order {
  ORDER_ID: number;

  STATUS: string;

  TOTAL_AMOUNT: number;

  ORDER_DATE: string;

  items?: OrderItem[];
}

interface Props {
  order: Order;

  onDetail: () => void;

  onCancel: () => void;

  onReorder: () => void;

  onRepay: () => void;

  onInvoice: () => void;

  onReview: () => void;
}

export default function OrderCard({
  order,

  onDetail,

  onCancel,

  onReorder,

  onRepay,

  onInvoice,

  onReview,
}: Props) {
  return (
    <div
      className="
bg-white
border
rounded-xl
shadow-sm
p-5
"
    >
      <div
        className="
flex
justify-between
items-center
border-b
pb-4
"
      >
        <div>
          <h3
            className="
font-bold
text-lg
"
          >
            Đơn hàng #{order.ORDER_ID}
          </h3>

          <p
            className="
text-sm
text-gray-500
"
          >
            {new Date(order.ORDER_DATE).toLocaleDateString("vi-VN")}
          </p>
        </div>

        <span
          className="
px-3
py-1
rounded-full
bg-blue-100
text-blue-700
text-sm
"
        >
          {order.STATUS}
        </span>
      </div>

      <div className="mt-4">
        {order.items?.slice(0, 2).map((item, index) => (
          <div
            key={index}
            className="
flex
gap-3
mb-3
"
          >
            <img
              src={item.IMAGE_URL || "/images/no-image.png"}
              className="
w-16
h-16
rounded-lg
object-cover
"
            />

            <div>
              <p
                className="
font-medium
"
              >
                {item.TENSP}
              </p>

              <p
                className="
text-gray-500
"
              >
                x{item.SOLUONG}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="
flex
justify-between
items-center
mt-5
border-t
pt-4
"
      >
        <strong>{order.TOTAL_AMOUNT.toLocaleString()} đ</strong>

        <div
          className="
flex
gap-2
flex-wrap
"
        >
          <button
            onClick={onDetail}
            className="
btn-action
"
          >
            <Eye size={16} />
            Chi tiết
          </button>

          <button
            onClick={onInvoice}
            className="
btn-action
"
          >
            <FileText size={16} />
            Hóa đơn
          </button>

          <button
            onClick={onCancel}
            className="
btn-action
text-red-600
"
          >
            <XCircle size={16} />
            Hủy
          </button>

          <button
            onClick={onReorder}
            className="
btn-action
"
          >
            <RotateCcw size={16} />
            Mua lại
          </button>

          <button
            onClick={onRepay}
            className="
btn-action
"
          >
            <CreditCard size={16} />
            Thanh toán
          </button>

          <button
            onClick={onReview}
            className="
btn-action
"
          >
            <Star size={16} />
            Đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}
