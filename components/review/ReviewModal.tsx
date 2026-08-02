"use client";

import { useState } from "react";
import { reviewAPI } from "@/lib/api";

interface Product {
  MASP: string;
  TENSP: string;
  IMAGE_URL?: string;
}

interface Props {
  product: Product;
  userId: number;
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  product,
  userId,
  orderId,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    try {
      setLoading(true);

console.log("Review payload", {
  userId,
  orderId,
  masp: product.MASP,
  rating,
  comment,
});

await reviewAPI.createReview({
  userId,
  orderId,
  masp: product.MASP,
  rating,
  comment,
});

      alert("Đánh giá thành công");

      onSuccess();
    } catch (err: any) {
      alert(err.message || "Lỗi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0
        bg-black/50
        flex
        items-center
        justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-6
          w-[450px]
        "
      >
        <h2
          className="
            text-xl
            font-bold
            mb-4
          "
        >
          ⭐ Đánh giá sản phẩm
        </h2>

        <div
          className="
            mb-5
            border
            rounded-lg
            p-3
          "
        >
          <p className="font-semibold">{product.TENSP}</p>

          <p className="text-gray-500 text-sm">
            Mã sản phẩm: {product.MASP}
          </p>
        </div>

        <div
          className="
            flex
            gap-2
            text-3xl
            mb-4
          "
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={
                star <= rating
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="
            border
            w-full
            rounded-lg
            p-3
            h-28
          "
          placeholder="Nhập nhận xét..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div
          className="
            flex
            justify-end
            gap-3
            mt-5
          "
        >
          <button
            onClick={onClose}
            className="
              border
              px-4
              py-2
              rounded-lg
            "
          >
            Hủy
          </button>

          <button
            disabled={loading}
            onClick={submitReview}
            className="
              bg-yellow-500
              hover:bg-yellow-600
              text-white
              px-4
              py-2
              rounded-lg
              disabled:bg-gray-400
            "
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}