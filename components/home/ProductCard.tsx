"use client";

import Link from "next/link";
import { Product } from "@/lib/api";

interface Props {
  product: Product;

  wishlistIds: string[];

  onAddToCart: (
    e: React.MouseEvent,
    product: Product
  ) => void;

  onToggleWishlist: (
    e: React.MouseEvent,
    product: Product
  ) => void;
}

export default function ProductCard({
  product,
  wishlistIds,
  onAddToCart,
  onToggleWishlist,
}: Props) {
  return (
    <Link
      href={`/product/${product.MASP}`}
      className="group h-full"
    >
      <article className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col">

        {/* Wishlist */}

        <button
          onClick={(e) => onToggleWishlist(e, product)}
          className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-white shadow-lg hover:bg-red-500 hover:text-white transition"
        >
          {wishlistIds.includes(product.MASP)
            ? "❤️"
            : "🤍"}
        </button>

        {/* Badge */}

        <div className="absolute top-4 left-4 z-30 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          -20%
        </div>

        <div className="absolute top-16 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          HOT
        </div>

        {/* Image */}

        <div className="relative overflow-hidden h-72 bg-gradient-to-br from-gray-100 to-gray-200">

          <img
            src={product.IMAGE_URL || "/placeholder-book.jpg"}
            alt={product.TENSP}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 duration-500"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 duration-300" />

          <button className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-red-500 px-5 py-2 rounded-xl font-semibold">
            Xem nhanh
          </button>
        </div>

        {/* Content */}

        <div className="p-5 flex flex-col flex-1">

          <span className="text-xs font-semibold text-red-500">
            📚 Bestseller
          </span>

          <h2 className="font-bold text-lg mt-2 line-clamp-2 min-h-[56px] group-hover:text-red-500">
            {product.TENSP}
          </h2>

          <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-[40px]">
            {product.DESCRIPTION || "Chưa có mô tả"}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-yellow-400">
              ⭐⭐⭐⭐⭐
            </span>

            <span className="text-gray-500 text-sm">
              (128)
            </span>
          </div>

          <div className="text-sm text-gray-500 mt-2">
            Đã bán 356
          </div>

          <div className="mt-4 flex items-end gap-3">

            <span className="text-3xl font-black text-red-500">
              ₫{product.GIABAN.toLocaleString("vi-VN")}
            </span>

            <span className="line-through text-gray-400">
              ₫
              {Math.round(product.GIABAN * 1.2).toLocaleString(
                "vi-VN"
              )}
            </span>

          </div>

          <div className="mt-4">

            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">

              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-full"
                style={{
                  width: `${Math.min(
                    100,
                    product.SOLUONGTON
                  )}%`,
                }}
              />

            </div>

            <p className="text-xs text-gray-500 mt-2">
              Còn {product.SOLUONGTON} sản phẩm
            </p>

          </div>

          <button
            type="button"
            disabled={product.SOLUONGTON === 0}
            onClick={(e) => onAddToCart(e, product)}
            className="mt-6 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:scale-105 disabled:bg-gray-400"
          >
            {product.SOLUONGTON > 0
              ? "🛒 Thêm vào giỏ hàng"
              : "Hết hàng"}
          </button>

        </div>

      </article>
    </Link>
  );
}