"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productAPI, cartAPI, categoryAPI, authAPI, Product } from "@/lib/api";
import {
  addGuestCartItem,
  getGuestCart,
  getWishlistItems,
  toggleWishlistItem,
  isWishlisted,
  saveSearchHistory,
  getSearchHistory,
} from "@/lib/userExperience";
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
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showTop, setShowTop] = useState(false);
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  // Check if user is logged in
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    setWishlistIds(getWishlistItems().map((item) => item.MASP));
    setSearchHistory(getSearchHistory());
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
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextQuery = searchQuery.trim();
    if (!nextQuery) return;
    saveSearchHistory(nextQuery);
    setSearchHistory(getSearchHistory());
    fetchProducts();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.SOLUONGTON <= 0) {
      alert("Sản phẩm đã hết hàng");
      return;
    }

    try {
      if (!user) {
        addGuestCartItem(product, 1);
        alert("✓ Đã thêm vào giỏ hàng tạm");
        return;
      }

      console.log("[HOME] Adding to cart:", product.MASP);
      await cartAPI.addToCart(user.userId, product.MASP, 1);
      alert("✓ Đã thêm vào giỏ hàng thành công!");
    } catch (err: any) {
      console.error("[ADD TO CART ERROR]", err);
      alert(err.message || "Failed to add to cart");
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleWishlistItem(product);
    setWishlistIds(result.items.map((item) => item.MASP));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    saveSearchHistory(suggestion);
    setSearchHistory(getSearchHistory());
    setSearchSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-20 flex items-center justify-between">
            {/* Logo */}

            <Link href="/" className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-2xl shadow-lg">
                📚
              </div>

              <div>
                <h1 className="font-black text-2xl bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  Cloudy Book
                </h1>

                <p className="text-xs text-gray-500">Read • Learn • Grow</p>
              </div>
            </Link>

            {/* Menu */}

            <div className="hidden lg:flex items-center gap-8">
              <Link
                href="/"
                className="font-semibold hover:text-red-500 duration-300"
              >
                Trang chủ
              </Link>

              <Link
                href="#products"
                className="font-semibold hover:text-red-500 duration-300"
              >
                Sách
              </Link>

              <Link
                href="#sale"
                className="font-semibold hover:text-red-500 duration-300"
              >
                Flash Sale
              </Link>

              <Link
                href="#category"
                className="font-semibold hover:text-red-500 duration-300"
              >
                Danh mục
              </Link>
            </div>

            {/* Right */}

            <div className="flex items-center gap-3">
              <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-red-500 hover:text-white duration-300">
                ❤️
              </button>

              <Link
                href="/cart"
                className="relative w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center duration-300"
              >
                🛒
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-xs flex items-center justify-center">
                  {getGuestCart().length}
                </span>
              </Link>

              {user ? (
                <Link
                  href="/account"
                  className="px-5 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center font-semibold hover:scale-105 duration-300"
                >
                  👤 {user.username}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 h-12 rounded-xl border flex items-center font-semibold hover:bg-red-500 hover:text-white duration-300"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Search */}
        {/* ================= HERO ================= */}

        <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-14 mb-14 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-72 h-72 bg-white rounded-full blur-3xl -top-20 -left-20" />

            <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl bottom-0 right-0" />
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
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
                Kho sách lớn nhất với hàng nghìn đầu sách từ Công nghệ, Kinh
                doanh, Tiểu thuyết, Giáo dục...
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

            <div className="hidden lg:flex justify-center">
              <img
                src="/banner-book.png"
                className="w-[520px] drop-shadow-2xl hover:scale-105 duration-500"
                alt=""
              />
            </div>
          </div>
        </section>
        {/* ================= SEARCH ================= */}

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
          <form
            onSubmit={handleSearch}
            className="flex flex-col lg:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;

                  setSearchQuery(value);

                  const suggestions = [
                    "React",
                    "NodeJS",
                    "Java",
                    "Python",
                    "Kinh doanh",
                    "Marketing",
                    "Tiểu thuyết",
                    "Tâm lý",
                    "Tiếng Anh",
                    "Thiếu nhi",
                  ]
                    .filter((item) =>
                      item.toLowerCase().includes(value.toLowerCase()),
                    )
                    .slice(0, 6);

                  setSearchSuggestions(value ? suggestions : []);
                }}
                placeholder="🔍 Tìm tên sách, tác giả..."
                className="w-full h-16 rounded-2xl border-2 border-gray-200 px-6 text-lg focus:border-red-500 outline-none"
              />

              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="block w-full text-left px-6 py-4 hover:bg-red-50"
                    >
                      🔍 {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="h-16 px-10 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:scale-105 duration-300"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
          <div className="rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
            <h2 className="text-4xl mb-3">🎁</h2>

            <h3 className="font-bold text-xl">Voucher 20%</h3>

            <p>Cho đơn từ 500.000đ</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <h2 className="text-4xl mb-3">🚚</h2>

            <h3 className="font-bold text-xl">Free Ship</h3>

            <p>Toàn quốc</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
            <h2 className="text-4xl mb-3">⭐</h2>

            <h3 className="font-bold text-xl">Best Seller</h3>

            <p>Sách bán chạy</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
            <h2 className="text-4xl mb-3">💳</h2>

            <h3 className="font-bold text-xl">Thanh toán</h3>

            <p>PayPal • MoMo</p>
          </div>
        </div>
        {/* Filters Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-black text-red-500">⚡ FLASH SALE</h2>

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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-3xl p-6 text-white bg-gradient-to-r from-red-500 to-orange-500"
              >
                <h2 className="text-2xl font-bold">Giảm 50%</h2>

                <p className="mt-3">Áp dụng hôm nay</p>
              </div>
            ))}
          </div>
        </section>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-black text-red-500">12K+</h2>

            <p>Đầu sách</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-black text-blue-500">30K+</h2>

            <p>Khách hàng</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-black text-yellow-500">4.9★</h2>

            <p>Đánh giá</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <h2 className="text-5xl font-black text-green-500">24H</h2>

            <p>Giao hàng</p>
          </div>
        </div>
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black text-gray-800">
                🔥 Sách nổi bật
              </h2>

              <p className="text-gray-500 mt-2">
                Khám phá những đầu sách được yêu thích nhất
              </p>
            </div>

            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
            >
              Xem tất cả →
            </Link>
          </div>
          {/* <div className="relative group">
            <button className="px-4 py-2 bg-red-500 text-white rounded-xl">
              📚 Danh mục
            </button>

            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50">
              <CategoryMegaMenu />
            </div>
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {products.map((product) => (
              <Link
                key={product.MASP}
                href={`/product/${product.MASP}`}
                className="group h-full"
              >
                <article className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col">
                  {/* Wishlist */}

                  <button
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className="absolute top-4 right-4 z-30 w-11 h-11 rounded-full bg-white shadow-lg hover:bg-red-500 hover:text-white transition"
                  >
                    {wishlistIds.includes(product.MASP) ? "❤️" : "🤍"}
                  </button>

                  {/* Discount */}

                  <div className="absolute top-4 left-4 z-30 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    -20%
                  </div>
                  <div className="absolute top-16 left-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                    HOT
                  </div>

                  {/* Image */}

                  <div className="relative overflow-hidden h-72 bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      loading="lazy"
                      src={product.IMAGE_URL || "/placeholder-book.jpg"}
                      alt={product.TENSP}
                      className="w-full h-full object-cover group-hover:scale-110 duration-500"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 duration-300" />

                    <button className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-red-500 px-5 py-2 rounded-xl font-semibold duration-300">
                      Xem nhanh
                    </button>
                  </div>

                  {/* Content */}

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-red-500">
                      📚 Bestseller
                    </span>

                    <h2 className="font-bold text-lg mt-2 line-clamp-2 min-h-[56px] group-hover:text-red-500 duration-300">
                      {product.TENSP}
                    </h2>

                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-[40px]">
                      {product.DESCRIPTION || "Chưa có mô tả"}
                    </p>

                    {/* Rating */}

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>

                      <span className="text-gray-500 text-sm">(128)</span>
                    </div>

                    {/* Sold */}

                    <div className="text-sm text-gray-500 mt-2">Đã bán 356</div>

                    {/* Price */}

                    <div className="mt-4 flex items-end gap-3">
                      <span className="text-3xl font-black text-red-500">
                        ₫{product.GIABAN.toLocaleString("vi-VN")}
                      </span>

                      <span className="line-through text-gray-400">
                        ₫
                        {Math.round(product.GIABAN * 1.2).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>

                    {/* Stock */}

                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (product.SOLUONGTON / 100) * 100,
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Còn {product.SOLUONGTON} sản phẩm
                      </p>
                    </div>

                    {/* Button */}

                    <button
                      type="button"
                      disabled={product.SOLUONGTON === 0}
                      onClick={(e) => handleAddToCart(e, product)}
                      className="mt-6 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:scale-105 duration-300 disabled:bg-gray-400"
                    >
                      {product.SOLUONGTON > 0
                        ? "🛒 Thêm vào giỏ hàng"
                        : "Hết hàng"}
                    </button>
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
              {Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i,
              ).map((pageNum) => (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-xl ${
                    pageNum === page
                      ? "bg-red-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
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
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-red-500 text-white shadow-xl hover:bg-red-600 z-50"
        >
          ↑
        </button>
      )}
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 mt-24">
        <Footer />
      </footer>
    </div>
  );
}
