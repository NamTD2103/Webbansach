"use client";

interface LoyaltyCardProps {
  points: number;
  onRedeem: (point: number) => void;
}

export default function LoyaltyCard({
  points,
  onRedeem,
}: LoyaltyCardProps) {
  const getRank = (point: number) => {
    if (point >= 1000) {
      return {
        name: "💎 Kim Cương",
        color: "text-cyan-600",
      };
    }

    if (point >= 500) {
      return {
        name: "🥇 Vàng",
        color: "text-yellow-600",
      };
    }

    if (point >= 200) {
      return {
        name: "🥈 Bạc",
        color: "text-gray-600",
      };
    }

    return {
      name: "🥉 Đồng",
      color: "text-orange-600",
    };
  };

  const rank = getRank(points);

  return (
    <div className="mt-6 rounded-2xl border bg-gradient-to-r from-yellow-50 to-orange-50 p-6 shadow">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h3 className="text-lg font-bold">
            ⭐ Điểm tích lũy
          </h3>

          <p className="mt-2 text-4xl font-bold text-orange-600">
            {points}
          </p>

          <p className="text-gray-500">
            điểm
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            Hạng thành viên
          </p>

          <p className={`text-xl font-bold ${rank.color}`}>
            {rank.name}
          </p>
        </div>

      </div>

      {/* Progress */}
      <div className="mt-6">

        <div className="flex justify-between text-sm">
          <span>Tiến trình lên hạng</span>
          <span>{points}/1000</span>
        </div>

        <div className="mt-2 h-3 rounded-full bg-gray-200">

          <div
            className="h-3 rounded-full bg-orange-500 transition-all"
            style={{
              width: `${Math.min(points / 10, 100)}%`,
            }}
          />

        </div>

      </div>

      {/* Redeem */}
      <div className="mt-8 border-t pt-6">

        <h3 className="text-lg font-bold mb-4">
          🎁 Đổi điểm lấy Voucher
        </h3>

        <div className="grid grid-cols-2 gap-4">

          <button
            onClick={() => onRedeem(100)}
            disabled={points < 100}
            className="rounded-lg bg-orange-500 py-3 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            100 điểm
            <br />
            ↓
            <br />
            Voucher 10.000đ
          </button>

          <button
            onClick={() => onRedeem(200)}
            disabled={points < 200}
            className="rounded-lg bg-orange-500 py-3 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            200 điểm
            <br />
            ↓
            <br />
            Voucher 20.000đ
          </button>

          <button
            onClick={() => onRedeem(500)}
            disabled={points < 500}
            className="rounded-lg bg-orange-500 py-3 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            500 điểm
            <br />
            ↓
            <br />
            Voucher 50.000đ
          </button>

          <button
            onClick={() => onRedeem(1000)}
            disabled={points < 1000}
            className="rounded-lg bg-red-600 py-3 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            1000 điểm
            <br />
            ↓
            <br />
            Voucher 100.000đ
          </button>

        </div>

      </div>

    </div>
  );
}