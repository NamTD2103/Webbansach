"use client";

import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/api";

import ReviewTable from "./ReviewTable";

interface Props {
  showToast: (message: string, type: "success" | "error") => void;
}

export default function ReviewSection({ showToast }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD REVIEWS
  // =========================

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const result = await adminAPI.getAllReviews();

      setReviews(result.data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // =========================
  // HIDE REVIEW
  // =========================

  const handleToggleStatus = async (
  id: number,
  status: string
) => {
  try {
    await adminAPI.toggleReviewStatus(id, status);

    showToast(
      status === "VISIBLE"
        ? "Đã hiển thị đánh giá"
        : "Đã ẩn đánh giá",
      "success"
    );

    fetchReviews();
  } catch (err: any) {
    showToast(err.message, "error");
  }
};
  if (loading) {
    return (
      <div
        className="
bg-white
rounded-xl
shadow
p-8
text-center
"
      >
        Đang tải đánh giá...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="
flex
justify-between
items-center
"
      >
        <h2
          className="
text-2xl
font-bold
text-gray-800
"
        >
          Quản lý đánh giá sản phẩm
        </h2>

        <div
          className="
bg-blue-100
text-blue-700
px-4
py-2
rounded-lg
font-medium
"
        >
          Tổng: {reviews.length}
        </div>
      </div>

      <ReviewTable
    reviews={reviews}
    onToggleStatus={handleToggleStatus}
/>
    </div>
  );
}
