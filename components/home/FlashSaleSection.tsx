"use client";

export default function FlashSaleSection() {
  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-red-500">
          ⚡ FLASH SALE
        </h2>

        <div className="flex gap-3">
          <div className="bg-red-500 text-white px-4 py-2 rounded-xl">
            02
          </div>

          <div className="bg-red-500 text-white px-4 py-2 rounded-xl">
            35
          </div>

          <div className="bg-red-500 text-white px-4 py-2 rounded-xl">
            59
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-3xl p-6 text-white bg-gradient-to-r from-red-500 to-orange-500"
          >
            <h2 className="text-2xl font-bold">
              Giảm 50%
            </h2>

            <p className="mt-3">
              Áp dụng hôm nay
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}