"use client";

import { useState } from "react";
import { Star, XCircle } from "lucide-react";
import { reviewAPI } from "@/lib/api";



interface Props {
    userId: number;
    masp: string;
    productName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReviewModal({
    userId,
    masp,
    productName,
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

    await reviewAPI.createReview({
      userId,
      masp,
      rating,
      comment,
    });

    alert("Đánh giá thành công");

    onSuccess();
    onClose();
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
  Đánh giá sản phẩm
</h2>

<p className="text-gray-600 mb-4">
  {productName}
</p>

          <button onClick={onClose}>
            <XCircle />
          </button>
        </div>

        {/* Danh sách sản phẩm */}
        
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