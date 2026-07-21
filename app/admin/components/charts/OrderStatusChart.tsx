    "use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  orders: any[];
}

const COLORS = [
  "#f59e0b", // Pending
  "#3b82f6", // Processing
  "#22c55e", // Completed
  "#ef4444", // Cancelled
];

export default function OrderStatusChart({ orders }: Props) {
  const data = useMemo(() => {
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
        name: "Đã hủy",
        value: orders.filter((o) => o.STATUS === "CANCELLED").length,
      },
    ].filter((item) => item.value > 0);
  }, [orders]);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          🥧 Trạng thái đơn hàng
        </h2>

        <p className="text-sm text-slate-500">
          Thống kê theo dữ liệu Oracle
        </p>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            label={({ name, percent }) =>
              `${name} ${(percent! * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: any) => [`${value} đơn`, "Số lượng"]}
          />

          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}