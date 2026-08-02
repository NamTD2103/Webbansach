interface Props {
    orders: number;
    wishlist: number;
    loyaltyPoints: number;
}

export default function AccountStats({
    orders,
    wishlist,
    loyaltyPoints,
}: Props) {

    const memberLevel =
        loyaltyPoints >= 1000
            ? "Kim Cương"
            : loyaltyPoints >= 500
            ? "Vàng"
            : loyaltyPoints >= 200
            ? "Bạc"
            : "Thường";

    return (

        <div className="grid md:grid-cols-4 gap-6">

            {/* Đơn hàng */}
            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">📦</div>

                <h2 className="text-4xl font-black text-red-500 mt-3">
                    {orders}
                </h2>

                <p>Đơn hàng</p>

            </div>

            {/* Wishlist */}
            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">❤️</div>

                <h2 className="text-4xl font-black text-pink-500 mt-3">
                    {wishlist}
                </h2>

                <p>Wishlist</p>

            </div>

            {/* Điểm tích lũy */}
            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">🎁</div>

                <h2 className="text-4xl font-black text-green-500 mt-3">
                    {loyaltyPoints}
                </h2>

                <p>Điểm tích lũy</p>

            </div>

            {/* Thành viên */}
            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">👑</div>

                <h2 className="text-3xl font-black text-yellow-500 mt-3">
                    {memberLevel}
                </h2>

                <p>Hạng thành viên</p>

            </div>

        </div>

    );
}