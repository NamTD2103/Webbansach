"use client";

import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();

  const orderId = params?.id;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">
          Chi tiết đơn hàng
        </h1>

        <p className="text-gray-600">
          Mã đơn hàng: #{orderId}
        </p>

        <div className="mt-6 text-gray-500">
          Đang phát triển chức năng xem chi tiết đơn hàng.
        </div>
      </div>
    </div>
  );
}