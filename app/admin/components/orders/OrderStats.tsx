"use client";

import { Order } from "./types";

interface Props {
  orders: Order[];
}

export default function OrderStats({ orders }: Props) {
  const total = orders.length;

  const pending = orders.filter(
    (o) => o.STATUS === "PENDING"
  ).length;

  const processing = orders.filter(
    (o) => o.STATUS === "PROCESSING"
  ).length;

  const completed = orders.filter(
    (o) => o.STATUS === "COMPLETED"
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-4xl font-bold text-blue-600">
          {total}
        </div>

        <div className="text-gray-500 mt-2">
          Tổng đơn hàng
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-4xl font-bold text-yellow-600">
          {pending}
        </div>

        <div className="text-gray-500 mt-2">
          Chờ xử lý
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-4xl font-bold text-orange-600">
          {processing}
        </div>

        <div className="text-gray-500 mt-2">
          Đang xử lý
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-4xl font-bold text-green-600">
          {completed}
        </div>

        <div className="text-gray-500 mt-2">
          Hoàn thành
        </div>
      </div>

    </div>
  );
}