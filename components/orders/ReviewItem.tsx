"use client";

import { useEffect, useState } from "react";
import { reviewAPI } from "@/lib/api";
import ReviewModal from "@/components/review/ReviewModal";

interface Product {
  MASP: string;
  TENSP: string;
  IMAGE_URL?: string;
}

interface Props {
  userId: number;
  orderId: number;
  product: Product;
}

export default function ReviewItem({
    userId,
    orderId,
    product,
}: Props)  {
  const [review, setReview] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadReview();
  }, []);

  const loadReview = async () => {
    try {
        const result = await reviewAPI.getUserReview(
            userId,
            product.MASP
        );

        setReview(result.data);
    } catch {
        setReview(null);
    }
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
        product={product}
        userId={userId}
        orderId={orderId}
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