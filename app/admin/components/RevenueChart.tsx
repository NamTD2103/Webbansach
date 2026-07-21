"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DashboardCharts({ orders }: { orders: any[] }) {
  // ===== DATA =====
  const revenueData = useMemo(() => {
    const map: Record<string, number> = {};

    orders.forEach((o) => {
      if (!o.ORDER_DATE) return;

      // ⚠️ dùng ISO date để sort chuẩn
      const dateKey = new Date(o.ORDER_DATE).toISOString().split("T")[0];

      if (!map[dateKey]) map[dateKey] = 0;
      map[dateKey] += Number(o.TOTAL_AMOUNT || 0);
    });

    return Object.keys(map)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // 🔥 SORT ĐÚNG
      .map((date) => ({
        date: new Date(date).toLocaleDateString("vi-VN"), // hiển thị đẹp
        total: map[date],
      }));
  }, [orders]);
  const orderCountData = useMemo(() => {
    const map: Record<string, number> = {};

    orders.forEach((o) => {
      if (!o.ORDER_DATE) return;

      const dateKey = new Date(o.ORDER_DATE).toISOString().split("T")[0];

      if (!map[dateKey]) map[dateKey] = 0;

      // ✅ convert string to number safely
      let amount = 0;
      if (typeof o.TOTAL_AMOUNT === "string") {
        // loại bỏ dấu ',' hoặc '.'
        amount = parseFloat(o.TOTAL_AMOUNT.replace(/[,\.]/g, ""));
      } else {
        amount = Number(o.TOTAL_AMOUNT || 0);
      }

      map[dateKey] += amount;
    });

    return Object.keys(map)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date: new Date(date).toLocaleDateString("vi-VN"),
        count: map[date],
      }));
  }, [orders]);

  const statusData = useMemo(() => {
    return [
      {
        name: "Chờ xử lý",
        value: orders.filter((o) => o.STATUS === "PENDING").length,
      },
      {
        name: "Đang xử lý",
        value: orders.filter((o) => o.STATUS === "PROCESSING").length,
      },
      {
        name: "Hoàn thành",
        value: orders.filter((o) => o.STATUS === "COMPLETED").length,
      },
      {
        name: "Hủy",
        value: orders.filter((o) => o.STATUS === "CANCELLED").length,
      },
    ];
  }, [orders]);

  const COLORS = ["#facc15", "#fb923c", "#4ade80", "#f87171"];

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== BAR FULL WIDTH ===== */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={revenueData}>
          <CartesianGrid stroke="#eee" />

          <XAxis dataKey="date" />

          <YAxis
            tickFormatter={(v) => `₫${(v / 1000).toFixed(0)}k`}
            width={70}
          />

          <Tooltip formatter={(v) => `₫${Number(v).toLocaleString()}`} />

          <Bar dataKey="total" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

      {/* ===== 2 COLUMN ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold mb-4">📈 Số đơn theo ngày</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderCountData}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PIE */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold mb-4 text-center">🥧 Trạng thái đơn hàng</h3>

          <div className="flex justify-center">
            <PieChart width={300} height={300}>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
}
