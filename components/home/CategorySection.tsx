"use client";

interface Category {
  CAT_ID: string;
  CAT_NAME: string;
}

interface Props {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onClearCategory: () => void;
}

export default function CategorySection({
  categories,
  selectedCategory,
  onSelectCategory,
  onClearCategory,
}: Props) {
  if (categories.length === 0) return null;

  return (
    <section id="category" className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black text-gray-800">
          🗂️ Danh mục sách
        </h2>

        {selectedCategory && (
          <button
            onClick={onClearCategory}
            className="text-red-500 font-semibold hover:underline"
          >
            Xóa lọc danh mục ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onClearCategory}
          className={`px-5 py-2.5 rounded-xl font-semibold border-2 transition ${
            selectedCategory === ""
              ? "bg-red-500 border-red-500 text-white"
              : "bg-white border-gray-200 text-gray-700 hover:border-red-300"
          }`}
        >
          Tất cả
        </button>

        {categories.map((category) => (
          <button
            key={category.CAT_ID}
            onClick={() => onSelectCategory(category.CAT_ID)}
            className={`px-5 py-2.5 rounded-xl font-semibold border-2 transition ${
              selectedCategory === category.CAT_ID
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white border-gray-200 text-gray-700 hover:border-red-300"
            }`}
          >
            {category.CAT_NAME}
          </button>
        ))}
      </div>
    </section>
  );
}