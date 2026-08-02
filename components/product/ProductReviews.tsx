"use client";

import { useEffect, useState } from "react";
import { reviewAPI } from "@/lib/api";

interface Props {
  masp: string;

  userId?: number;
}

export default function ProductReviews({ masp, userId }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);

  const [hasReviewed, setHasReviewed] = useState(false);

  // ==========================
  // LOAD REVIEWS
  // ==========================

  const loadReviews = async () => {
    try {
      const result = await reviewAPI.getProductReviews(masp);

      setReviews(result.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================
  // CHECK USER REVIEW
  // ==========================

  const checkReview = async () => {
    if (!userId) return;

    try {
      const result = await reviewAPI.getUserReview(userId, masp);

      if (result.data) {
        setHasReviewed(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

 useEffect(() => {

  loadReviews();

  checkReview();

}, [masp, userId]);

  // ==========================
  // SUBMIT REVIEW
  // ==========================

  const submitReview = async () => {
  try {
    setLoading(true);

    await reviewAPI.createReview({
      userId: userId!,
      masp,
      rating,
      comment,
    });


    alert("Đánh giá thành công");


    setComment("");

    setRating(5);

    setHasReviewed(true);


    await loadReviews();


  } catch (err: any) {

    alert(
      err.message || "Đánh giá thất bại"
    );

  } finally {

    setLoading(false);

  }
};

  return (
    <div
      className="
mt-10
space-y-6
"
    >
      <h2
        className="
text-2xl
font-bold
"
      >
        Đánh giá sản phẩm
      </h2>

      {/* REVIEW LIST */}

      <div
        className="
space-y-4
"
      >
        {reviews.length === 0 ? (
          <p
            className="
text-gray-500
"
          >
            Chưa có đánh giá
          </p>
        ) : (
          reviews.map((item) => (
            <div
              key={item.REVIEW_ID}
              className="
border
rounded-xl
p-5
bg-white
"
            >
              <div
                className="
flex
justify-between
"
              >
                <strong>{item.USERNAME}</strong>

                <span
                  className="
text-yellow-500
"
                >
                  {"★".repeat(item.RATING)}
                </span>
              </div>

              <p
                className="
mt-2
text-gray-600
"
              >
                {item.COMMENT_TEXT}
              </p>
            </div>
          ))
        )}
      </div>

      {/* FORM */}

      {userId && !hasReviewed && (
        <div
          className="
bg-gray-50
p-5
rounded-xl
"
        >
          <h3
            className="
font-bold
mb-3
"
          >
            Viết đánh giá
          </h3>

          <div
            className="
flex
gap-2
mb-3
"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`
text-2xl
${star <= rating ? "text-yellow-400" : "text-gray-300"}
`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="
Nhập nhận xét của bạn...
"
            className="
w-full
border
rounded-lg
p-3
"
            rows={4}
          />

          <button
            disabled={loading}
            onClick={submitReview}
            className="
mt-3
bg-blue-600
text-white
px-5
py-2
rounded-lg
"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      )}

      {hasReviewed && (
        <div
          className="
bg-green-50
text-green-700
p-4
rounded-lg
"
        >
          Bạn đã đánh giá sản phẩm này
        </div>
      )}
    </div>
  );
}
