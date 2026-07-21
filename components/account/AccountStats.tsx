interface Props {
    orders: number;
    wishlist: number;
}

export default function AccountStats({
    orders,
    wishlist,
}: Props) {

    return (

        <div className="grid md:grid-cols-4 gap-6">

            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">
                    📦
                </div>

                <h2 className="text-4xl font-black text-red-500 mt-3">
                    {orders}
                </h2>

                <p>Đơn hàng</p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">
                    ❤️
                </div>

                <h2 className="text-4xl font-black text-pink-500 mt-3">
                    {wishlist}
                </h2>

                <p>Wishlist</p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">
                    💰
                </div>

                <h2 className="text-4xl font-black text-green-500 mt-3">
                    VIP
                </h2>

                <p>Thành viên</p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-7 text-center hover:-translate-y-2 transition">

                <div className="text-4xl">
                    ⭐
                </div>

                <h2 className="text-4xl font-black text-yellow-500 mt-3">
                    4.9
                </h2>

                <p>Đánh giá</p>

            </div>

        </div>

    );
}