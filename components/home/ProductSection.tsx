"use client";

import Link from "next/link";
import { Product } from "@/lib/api";
import ProductCard from "./ProductCard";

interface Category {
  CAT_ID: string;
  CAT_NAME: string;
}

interface Props {
  products: Product[];
  categories: Category[];

  selectedCategory: string;

  showGroupedByCategory: boolean;

  productsByCategory: {
    category: Category;
    items: Product[];
  }[];

  wishlistIds: string[];

  onCategoryJump: (catId: string) => void;

  onAddToCart: (
    e: React.MouseEvent,
    product: Product
  ) => void;

  onToggleWishlist: (
    e: React.MouseEvent,
    product: Product
  ) => void;
}

export default function ProductSection({
  products,
  categories,
  selectedCategory,
  showGroupedByCategory,
  productsByCategory,
  wishlistIds,
  onCategoryJump,
  onAddToCart,
  onToggleWishlist,
}: Props) {
  return (
    <section id="products" className="mb-16">

      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-4xl font-black text-gray-800">

            {selectedCategory
              ? `📚 ${
                  categories.find(
                    (c) => c.CAT_ID === selectedCategory
                  )?.CAT_NAME || "Danh mục"
                }`
              : "🔥 Sách nổi bật"}

          </h2>

          <p className="text-gray-500 mt-2">

            {showGroupedByCategory
              ? "Khám phá sách theo từng danh mục"
              : "Khám phá những đầu sách được yêu thích nhất"}

          </p>

        </div>

        <Link
          href="/products"
          className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600"
        >
          Xem tất cả →
        </Link>

      </div>

      {showGroupedByCategory ? (

        <div className="space-y-16">

          {productsByCategory.map(({ category, items }) => (

            <div key={category.CAT_ID}>

              <div className="flex items-center justify-between mb-6">

                <h3 className="text-2xl font-bold">
                  📖 {category.CAT_NAME}
                </h3>

                <button
                  onClick={() =>
                    onCategoryJump(category.CAT_ID)
                  }
                  className="text-red-500 font-semibold hover:underline"
                >
                  Xem tất cả →
                </button>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {items.slice(0, 8).map((product) => (

                  <ProductCard
                    key={product.MASP}
                    product={product}
                    wishlistIds={wishlistIds}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                  />

                ))}

              </div>

            </div>

          ))}

        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {products.map((product) => (

            <ProductCard
              key={product.MASP}
              product={product}
              wishlistIds={wishlistIds}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />

          ))}

        </div>

      )}

    </section>
  );
}