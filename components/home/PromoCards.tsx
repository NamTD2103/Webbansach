"use client";

const promoCards = [
  {
    icon: "🎁",
    title: "Voucher 20%",
    description: "Cho đơn từ 500.000đ",
    bg: "from-red-500 to-pink-500",
  },
  {
    icon: "🚚",
    title: "Free Ship",
    description: "Toàn quốc",
    bg: "from-blue-500 to-cyan-500",
  },
  {
    icon: "⭐",
    title: "Best Seller",
    description: "Sách bán chạy",
    bg: "from-orange-500 to-yellow-500",
  },
  {
    icon: "💳",
    title: "Thanh toán",
    description: "PayPal • MoMo",
    bg: "from-green-500 to-emerald-500",
  },
];

export default function PromoCards() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
      {promoCards.map((card) => (
        <div
          key={card.title}
          className={`rounded-3xl bg-gradient-to-r ${card.bg} p-6 text-white`}
        >
          <h2 className="text-4xl mb-3">{card.icon}</h2>

          <h3 className="font-bold text-xl">{card.title}</h3>

          <p>{card.description}</p>
        </div>
      ))}
    </div>
  );
}