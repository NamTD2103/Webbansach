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
  USER_ID: number;
  STATUS: string;
  TOTAL_AMOUNT: number;
  ORDER_DATE: string;
  items?: OrderItem[];
}

interface Props {
  order: Order;

  onDetail?: (order: Order) => void;

  onCancel?: (order: Order) => void;

  onReorder?: (order: Order) => void;

  onRepay?: (order: Order) => void;

  onInvoice?: (order: Order) => void;

  onReview?: (order: Order) => void;
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
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN");

  const statusConfig: Record<string, any> = {
    PENDING: {
      text: "Chờ xác nhận",
      color: "bg-yellow-100 text-yellow-700",
      icon: "🕒",
    },

    PROCESSING: {
      text: "Đang xử lý",
      color: "bg-blue-100 text-blue-700",
      icon: "📦",
    },

    SHIPPING: {
      text: "Đang giao",
      color: "bg-purple-100 text-purple-700",
      icon: "🚚",
    },

    DELIVERED: {
      text: "Đã giao",
      color: "bg-green-100 text-green-700",
      icon: "✅",
    },

    CANCELLED: {
      text: "Đã hủy",
      color: "bg-red-100 text-red-700",
      icon: "❌",
    },
  };

  const status = statusConfig[order.STATUS] || {
    text: order.STATUS,
    color: "bg-gray-100 text-gray-700",
    icon: "📄",
  };

  return (
    <div
      className="
rounded-3xl
border
bg-white
p-5
transition
hover:-translate-y-1
hover:shadow-xl
"
    >
      <div
        className="
flex
justify-between
items-start
"
      >
        <div>
          <h3
            className="
font-bold
text-lg
"
          >
            📦 Đơn #{order.ORDER_ID}
          </h3>

          <p
            className="
text-sm
text-gray-500
mt-1
"
          >
            {formatDate(order.ORDER_DATE)}
          </p>
        </div>

        <span
          className={`
px-4
py-2
rounded-full
text-sm
font-semibold
${status.color}
`}
        >
          {status.icon} {status.text}
        </span>
      </div>

      <div
        className="
mt-5
space-y-3
"
      >
        {order.items?.slice(0, 2).map((item, index) => (
          <div
            key={index}
            className="
flex
gap-3
items-center
"
          >
            <img
              src={item.IMAGE_URL || "/images/no-image.png"}
              className="
w-14
h-14
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
text-sm
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
mt-6
border-t
pt-5
"
      >
        <div>
          <p
            className="
text-gray-400
text-sm
"
          >
            Tổng thanh toán
          </p>

          <p
            className="
text-2xl
font-black
text-red-500
"
          >
            {formatPrice(order.TOTAL_AMOUNT)}
          </p>
        </div>

        <div
          className="
flex
gap-2
flex-wrap
"
        >
          <button
            onClick={() => onDetail?.(order)}
            className="
rounded-xl
border
px-3
py-2
hover:bg-gray-100
flex
items-center
gap-1
"
          >
            <Eye size={16} />
            Chi tiết
          </button>

          <button
           onClick={() => onInvoice?.(order)}
            className="
rounded-xl
border
px-3
py-2
hover:bg-gray-100
flex
items-center
gap-1
"
          >
            <FileText size={16} />
            PDF
          </button>

          {order.STATUS === "PENDING" && (
            <button
              onClick={() => onCancel?.(order)}
              className="
rounded-xl
bg-red-500
px-3
py-2
text-white
flex
items-center
gap-1
"
            >
              <XCircle size={16} />
              Hủy
            </button>
          )}

          {order.STATUS === "DELIVERED" && (
            <button
              onClick={() => onReorder?.(order)}
              className="
rounded-xl
bg-red-500
px-3
py-2
text-white
flex
items-center
gap-1
"
            >
              <RotateCcw size={16} />
              Mua lại
            </button>
          )}

          {order.STATUS === "DELIVERED" && (
            <button
              onClick={() => onReview?.(order)}
              className="
rounded-xl
bg-yellow-500
px-3
py-2
text-white
flex
items-center
gap-1
"
            >
              <Star size={16} />
              Đánh giá
            </button>
          )}

          {order.STATUS === "PENDING" && (
            <button
              onClick={() => onRepay?.(order)}
              className="
rounded-xl
bg-blue-600
px-3
py-2
text-white
flex
items-center
gap-1
"
            >
              <CreditCard size={16} />
              Thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
