"use client";

interface Category {
  CAT_ID: string;
  CAT_NAME: string;
}

interface Props {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;

  selectedType: string;
  setSelectedType: (value: string) => void;

  priceRange: {
    min: number;
    max: number;
  };

  setPriceRange: (value: {
    min: number;
    max: number;
  }) => void;

  onReset: () => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
  onReset,
}: Props) {
  return (
    <section className="
      w-full
      mb-8
      p-5 md:p-6
      bg-white/80
      backdrop-blur-sm
      rounded-2xl
      shadow-lg
      border border-gray-100
    ">

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-5
        items-end
      ">

        {/* CATEGORY */}
        <div className="min-w-0">

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📚 Danh mục
          </label>

          <select
            value={selectedCategory}
            onChange={(e)=>setSelectedCategory(e.target.value)}
            className="
              w-full
              h-11
              px-3
              rounded-xl
              border-2
              border-gray-200
              bg-white
              outline-none
              focus:border-red-400
            "
          >

            <option value="">
              Tất cả danh mục
            </option>

            {categories.map((category)=>(
              <option
                key={category.CAT_ID}
                value={category.CAT_ID}
              >
                {category.CAT_NAME}
              </option>
            ))}

          </select>

        </div>


        {/* TYPE */}
        <div className="min-w-0">

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📖 Loại sách
          </label>

          <select
            value={selectedType}
            onChange={(e)=>setSelectedType(e.target.value)}
            className="
              w-full
              h-11
              px-3
              rounded-xl
              border-2
              border-gray-200
              bg-white
              outline-none
              focus:border-red-400
            "
          >

            <option value="">
              Tất cả
            </option>

            <option value="BESTSELLER">
              Best Seller
            </option>

            <option value="NEW">
              Sách mới
            </option>

            <option value="SALE">
              Khuyến mãi
            </option>

          </select>

        </div>


        {/* PRICE */}
        <div className="min-w-0">

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💰 Khoảng giá
          </label>


          <div className="
            flex
            items-center
            gap-2
            w-full
          ">

            <input
              type="number"
              value={priceRange.min}
              onChange={(e)=>
                setPriceRange({
                  ...priceRange,
                  min:Number(e.target.value)
                })
              }
              className="
                w-full
                min-w-0
                h-11
                px-3
                rounded-xl
                border-2
                border-gray-200
              "
              placeholder="Từ"
            />


            <span className="text-gray-500">
              -
            </span>


            <input
              type="number"
              value={priceRange.max}
              onChange={(e)=>
                setPriceRange({
                  ...priceRange,
                  max:Number(e.target.value)
                })
              }
              className="
                w-full
                min-w-0
                h-11
                px-3
                rounded-xl
                border-2
                border-gray-200
              "
              placeholder="Đến"
            />

          </div>

        </div>


        {/* RESET */}
        <div className="
          flex
          justify-end
          sm:justify-start
          xl:justify-end
        ">

          <button
            onClick={onReset}
            className="
              w-full
              h-11
              px-5
              bg-gradient-to-r
              from-gray-500
              to-gray-600
              text-white
              rounded-xl
              font-semibold
              hover:scale-105
              transition
            "
          >
            🔄 Làm mới
          </button>

        </div>


      </div>

    </section>
  );
}