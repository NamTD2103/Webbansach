"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  orders: any[];
}

export default function RevenueChart({ orders }: Props) {
  const revenueData = useMemo(() => {
    const map: Record<string, number> = {};

    orders.forEach((order) => {
      if (!order.ORDER_DATE) return;

      const key = new Date(order.ORDER_DATE)
        .toISOString()
        .split("T")[0];

      if (!map[key]) map[key] = 0;

      map[key] += Number(order.TOTAL_AMOUNT || 0);
    });

    return Object.keys(map)
      .sort()
      .map((date) => ({
        date: new Date(date).toLocaleDateString("vi-VN"),
        revenue: map[date],
      }));
  }, [orders]);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            📈 Doanh thu theo ngày
          </h2>

          <p className="text-slate-500 text-sm">
            Dữ liệu đồng bộ từ Oracle Database
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={revenueData}>

          <defs>

            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">

              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />

              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />

            </linearGradient>

          </defs>

          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="date" />

          <YAxis
            tickFormatter={(v) => `₫${(v / 1000000).toFixed(0)}M`}
          />

          <Tooltip
            formatter={(value: any) =>
              `₫${Number(value).toLocaleString()}`
            }
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={3}
            fill="url(#colorRevenue)"
          />

        </AreaChart>
      </ResponsiveContainer>

    </div>
  );
}