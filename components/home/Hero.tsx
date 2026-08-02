"use client";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-14 mb-14 shadow-2xl">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-72 h-72 bg-white rounded-full blur-3xl -top-20 -left-20" />
        <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl bottom-0 right-0" />
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
        {/* Left */}
        <div>
          <span className="px-5 py-2 rounded-full bg-white/20 text-white">
            🔥 Summer Sale 2026
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white drop-shadow-2xl">
            Khám phá
            <br />
            <span className="text-yellow-300">hàng nghìn</span>
            <br />
            đầu sách
          </h1>

          <p className="text-white/90 text-xl mt-6 max-w-xl">
            Kho sách lớn nhất với hàng nghìn đầu sách từ Công nghệ, Kinh doanh,
            Tiểu thuyết, Giáo dục...
          </p>

          <div className="flex gap-4 mt-8">
            <button className="px-8 py-4 rounded-2xl bg-white text-red-500 font-bold hover:scale-105 duration-300">
              📚 Mua ngay
            </button>

            <button className="px-8 py-4 rounded-2xl border-2 border-white text-white font-bold hover:bg-white hover:text-red-500 duration-300">
              Xem thêm
            </button>
          </div>

          <div className="flex gap-10 mt-12">
            <div>
              <h2 className="text-4xl font-black text-white">12K+</h2>
              <p className="text-white">Đầu sách</p>
            </div>

            <div>
              <h2 className="text-4xl font-black text-white">30K+</h2>
              <p className="text-white">Khách hàng</p>
            </div>

            <div>
              <h2 className="text-4xl font-black text-white">4.9★</h2>
              <p className="text-white">Đánh giá</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="hidden lg:flex justify-center">
          <img
            src="/banner-book.png"
            alt="Banner Book"
            className="w-[520px] drop-shadow-2xl hover:scale-105 duration-500"
          />
        </div>
      </div>
    </section>
  );
}