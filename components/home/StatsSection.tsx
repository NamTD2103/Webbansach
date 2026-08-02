"use client";

const stats = [
  {
    value: "12K+",
    label: "Đầu sách",
    color: "text-red-500",
  },
  {
    value: "30K+",
    label: "Khách hàng",
    color: "text-blue-500",
  },
  {
    value: "4.9★",
    label: "Đánh giá",
    color: "text-yellow-500",
  },
  {
    value: "24H",
    label: "Giao hàng",
    color: "text-green-500",
  },
];

export default function StatsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {stats.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-3xl shadow-lg p-8 text-center"
        >
          <h2 className={`text-5xl font-black ${item.color}`}>
            {item.value}
          </h2>

          <p className="mt-2 text-gray-600">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}