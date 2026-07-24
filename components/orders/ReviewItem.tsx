"use client";

import { useEffect, useState } from "react";
import { reviewAPI } from "@/lib/api";
import ReviewModal from "@/components/orders/ReviewModal";

interface Props {
  userId: number;
  masp: string;
  productName: string;
}

export default function ReviewItem({
  userId,
  masp,
  productName,
}: Props) {

  const [review, setReview] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadReview();
  }, []);

  const loadReview = async () => {
    try {
      const result = await reviewAPI.getUserReview(userId, masp);
      setReview(result.data);
    } catch {}
  };

  return (
    <>
      {review ? (
        <div className="mt-3">

          <div className="text-yellow-500 text-xl">
            {"★".repeat(review.RATING)}
          </div>

          <p>{review.COMMENT_TEXT}</p>

          <span className="text-green-600 font-medium">
            ✓ Đã đánh giá
          </span>

        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
        >
          ⭐ Đánh giá
        </button>
      )}

      {open && (
    <ReviewModal
        userId={userId}
        masp={masp}
        productName={productName}
        onClose={() => setOpen(false)}
        onSuccess={() => {
            setOpen(false);
            loadReview();
        }}
    />
)}
    </>
  );
}