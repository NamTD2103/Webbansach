"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productAPI, cartAPI, categoryAPI, authAPI, Product } from "@/lib/api";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";
import Footer from "@/components/Footer";

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse hover:shadow-lg transition-shadow">
      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
      <div className="p-6">
        <div className="h-5 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryAPI.getAll();
        setCategories(response.data || []);
      } catch (err) {
        console.error("[CATEGORIES ERROR]", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[HOME] Fetching page:", page, "search:", searchQuery);

      let response;
      if (searchQuery.trim()) {
        setSearching(true);
        response = await productAPI.search(searchQuery);
        let products = response.data || [];

        // Filter by price range
        products = products.filter(
          (p: Product) =>
            p.GIABAN >= priceRange.min && p.GIABAN <= priceRange.max,
        );

        setProducts(products);
        setPage(1);
        setTotalPages(1);
      } else {
        setSearching(false);
        response = await productAPI.getAll(page, 20);
        let products = response.data || [];

        // Filter by category if selected
        if (selectedCategory) {
          products = products.filter(
            (p: Product) => p.CAT_ID === selectedCategory,
          );
        }

        // Filter by price range
        products = products.filter(
          (p: Product) =>
            p.GIABAN >= priceRange.min && p.GIABAN <= priceRange.max,
        );

        setProducts(products);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err: any) {
      console.error("[HOME ERROR]", err);
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please login to add items to cart");
      router.push("/login");
      return;
    }

    if (product.SOLUONGTON <= 0) {
      alert("Product is out of stock");
      return;
    }

    try {
      console.log("[HOME] Adding to cart:", product.MASP);
      await cartAPI.addToCart(user.userId, product.MASP, 1);
      alert("✓ Added to cart successfully!");
    } catch (err: any) {
      console.error("[ADD TO CART ERROR]", err);
      alert(err.message || "Failed to add to cart");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-all"
          >
            📚 CloudyInSouth.Com
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              🛒 Giỏ hàng
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center animate-bounce">
                3
              </span>
            </Link>

            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    ⚙️ Admin
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-3 border-l-2 border-gray-200">
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 text-sm">
                      👤 {user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === "ADMIN" ? "🔧 Admin" : "👤 Customer"}
                    </p>
                  </div>
                  <Link
                    href="/account"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    📋 Account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 border-2 border-gray-200 bg-white/60 backdrop-blur-sm rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  👤 Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Search */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
            KHÁM PHÁ THẾ GIỚI SÁCH ONLINE
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Hãy tìm cuốn sách hoàn hảo trong hàng ngàn đầu sách thuộc mọi thể
            loại.
          </p>

          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto flex gap-3"
          >
            <input
              type="text"
              placeholder="🔍 Search books, authors, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-red-500 shadow-lg transition-all"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
            >
              {searching ? "Searching..." : "Tìm sách"}
            </button>
          </form>
        </div>

        {/* Filters Section */}
        <div className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Categories Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📚 Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 font-medium text-gray-700 hover:border-gray-300 transition"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.CAT_ID} value={category.CAT_ID}>
                    {category.CAT_NAME}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💰 Giá tiền
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => {
                    setPriceRange({
                      ...priceRange,
                      min: Number(e.target.value),
                    });
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 font-medium"
                />
                <span className="text-gray-600 font-medium">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange({
                      ...priceRange,
                      max: Number(e.target.value),
                    });
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end justify-center">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setPriceRange({ min: 0, max: 1000000 });
                  setPage(1);
                }}
                className="w-60 px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold rounded-xl hover:from-gray-500 hover:to-gray-600 shadow-md hover:shadow-lg transition-all duration-300"
              >
                🔄 Làm mới tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-800 text-lg mb-1">
                  Loading Lỗi
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={fetchProducts}
                className="ml-auto px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !searching && products.length === 0 && (
          <div className="text-center py-24">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Không tìm sách
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Hãy thử điều chỉnh tìm kiếm của bạn hoặc duyệt qua tất cả sách.
            </p>
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Xóa tìm kiếm
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                Duyệt qua tất cả danh mục
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        <section className="mb-16">
          <div className="relative group">
            <button className="px-4 py-2 bg-red-500 text-white rounded-xl">
              📚 Danh mục
            </button>

            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50">
              <CategoryMegaMenu />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {products.map((product) => (
              <Link
                key={product.MASP}
                href={`/product/${product.MASP}`}
                className="group h-full"
              >
                <article
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden
                   hover:shadow-2xl hover:-translate-y-2 transition-all duration-500
                   border border-white/50 hover:border-red-200
                   flex flex-col h-full"
                >
                  {/* IMAGE */}
                  <div className="relative h-56 flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.IMAGE_URL ? (
                      <img
                        src={product.IMAGE_URL}
                        alt={product.TENSP}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-book.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl group-hover:text-red-500 transition-colors">
                          📚
                        </span>
                      </div>
                    )}

                    {product.SOLUONGTON === 0 && (
                      <div className="absolute top-3 right-3 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                        Bán hết
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* TITLE */}
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[48px] group-hover:text-red-600 transition-colors">
                      {product.TENSP}
                    </h3>

                    {/* DESCRIPTION */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {product.DESCRIPTION || "No description available"}
                    </p>

                    {/* BOTTOM */}
                    <div className="mt-auto">
                      {/* PRICE */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-black text-red-600">
                          ₫{product.GIABAN.toLocaleString("vi-VN")}
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.SOLUONGTON > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.SOLUONGTON > 0 ? "Còn hàng" : "Hết hàng"}
                        </span>
                      </div>

                      {/* BUTTON */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-sm
                         shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700
                         transform hover:scale-105 transition-all duration-300
                         disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={product.SOLUONGTON === 0}
                        type="button"
                      >
                        {product.SOLUONGTON > 0
                          ? "🛒 Thêm vào giỏ"
                          : "Hết hàng"}
                      </button>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!searchQuery && totalPages > 1 && products.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ← Trang trước
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                      pageNum === page
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                        : "bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Trang tiếp theo →
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 mt-24">
        <Footer />
      </footer>
    </div>
  );
}
