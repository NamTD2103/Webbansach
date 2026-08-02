"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import PromoCards from "@/components/home/PromoCards";
import CategorySection from "@/components/home/CategorySection";
import ProductFilters from "@/components/home/ProductFilters";
import ProductCard from "@/components/home/ProductCard";
import ProductSection from "@/components/home/ProductSection";
import FlashSaleSection from "@/components/home/FlashSaleSection";
import Pagination from "@/components/home/Pagination";
import SearchSection from "@/components/home/SearchSection";
import StatsSection from "@/components/home/StatsSection";
import ErrorAlert from "@/components/home/ErrorAlert";
import useProducts from "@/lib/hooks/useProducts";
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
  const [selectedType, setSelectedType] = useState("");
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
        if (selectedType) {
          products = products.filter((p: any) => p.TYPE === selectedType);
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
  }, [page, searchQuery, selectedCategory, selectedType, priceRange]);

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

  const handleCategoryJump = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedType("");
    setSearchQuery("");
    setPage(1);
  };

  // Group the currently loaded products by category so we can render a
  // "shelf" per category instead of one flat grid. Only used when the user
  // hasn't drilled into a single category or run a search.
  const productsByCategory = categories
    .map((category) => ({
      category,
      items: products.filter((p) => p.CAT_ID === category.CAT_ID),
    }))
    .filter((group) => group.items.length > 0);

  const showGroupedByCategory =
    !searchQuery.trim() && !selectedCategory && productsByCategory.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      {/* ================= HEADER ================= */}
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Search */}
        {/* ================= HERO ================= */}

        <Hero />

        <SearchSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSuggestions={searchSuggestions}
          setSearchSuggestions={setSearchSuggestions}
          onSearch={handleSearch}
          onSuggestionClick={handleSuggestionClick}
        />

       

        <PromoCards />

        <FlashSaleSection />
        <ProductFilters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={(value) => {
            setSelectedCategory(value);
            setPage(1);
          }}
          selectedType={selectedType}
          setSelectedType={(value) => {
            setSelectedType(value);
            setPage(1);
          }}
          priceRange={priceRange}
          setPriceRange={(value) => {
            setPriceRange(value);
            setPage(1);
          }}
          onReset={() => {
            setSelectedCategory("");
            setSelectedType("");
            setPriceRange({
              min: 0,
              max: 1000000,
            });
            setPage(1);
          }}
        />

        {/* Error Alert */}
        <ErrorAlert error={error} onRetry={fetchProducts} />

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
        <StatsSection />
 <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryJump}
          onClearCategory={() => {
            setSelectedCategory("");
            setPage(1);
          }}
        />
        <ProductSection
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          showGroupedByCategory={showGroupedByCategory}
          productsByCategory={productsByCategory}
          wishlistIds={wishlistIds}
          onCategoryJump={handleCategoryJump}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleWishlistToggle}
        />

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!searchQuery && !showGroupedByCategory && products.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPageChange={setPage}
          />
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
