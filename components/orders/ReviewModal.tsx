"use client";

import { useState } from "react";
import { Star, XCircle } from "lucide-react";

interface OrderItem {
  MASP: string;
  TENSP: string;
  IMAGE_URL: string;
}

interface Order {
  ORDER_ID: number;
  items: OrderItem[];
}

interface Props {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  order,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setLoading(true);

      // Giả lập gọi API
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log({
        orderId: order.ORDER_ID,
        rating,
        comment,
        products: order.items,
      });

      alert("Đánh giá thành công");

      setComment("");
      setRating(5);

      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Không thể gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            Đánh giá đơn #{order.ORDER_ID}
          </h2>

          <button onClick={onClose}>
            <XCircle />
          </button>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="space-y-3 max-h-56 overflow-y-auto mb-5">
          {order.items.map((item) => (
            <div
              key={item.MASP}
              className="flex items-center gap-3 border rounded-lg p-2"
            >
              <img
                src={item.IMAGE_URL}
                alt={item.TENSP}
                className="w-14 h-14 rounded object-cover"
              />

              <p className="font-medium flex-1">
                {item.TENSP}
              </p>
            </div>
          ))}
        </div>

        {/* Chọn sao */}
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <button
              key={item}
              onClick={() => setRating(item)}
            >
              <Star
                size={34}
                className={
                  item <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          {rating}/5 sao
        </p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          className="w-full border rounded-lg p-3 h-28 resize-none"
        />

        <button
          onClick={submitReview}
          disabled={loading}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? "Đang gửi đánh giá..." : "Gửi đánh giá"}
        </button>
      </div>
    </div>
  );
}