interface Props {
  user: any;
  totalOrders: number;
  wishlistCount: number;
  onWishlist: () => void;
}

export default function AccountHero({
  user,
  totalOrders,
  wishlistCount,
  onWishlist,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-10 shadow-2xl">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/20 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-white text-6xl flex items-center justify-center shadow-2xl">
            👤
          </div>

          <div>
            <p className="uppercase tracking-[0.4em] text-white/80 text-xs">
              CLOUDY BOOK
            </p>

            <h1 className="text-4xl font-black text-white mt-2">
              {user.fullname || user.username}
            </h1>

            <p className="text-white/90 mt-2">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 text-center text-white">
            <h2 className="text-3xl font-black">{totalOrders}</h2>

            <p>Đơn hàng</p>
          </div>

          <button
            onClick={onWishlist}
            className="
        bg-white/15
        backdrop-blur-lg
        rounded-2xl
        p-5
        text-center
        text-white
        hover:bg-white/25
        transition
        cursor-pointer
    "
          >
            <h2 className="text-3xl font-black">{wishlistCount}</h2>

            <p>Wishlist ❤️</p>
          </button>
        </div>
      </div>
    </section>
  );
}
