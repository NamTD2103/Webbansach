'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productAPI, cartAPI, Product, authAPI } from '@/lib/api';

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-96 rounded-lg mb-6"></div>
      <div className="space-y-3">
        <div className="bg-gray-200 h-6 rounded w-3/4"></div>
        <div className="bg-gray-200 h-4 rounded w-full"></div>
        <div className="bg-gray-200 h-4 rounded w-full"></div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    if (productId) fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PRODUCT DETAIL] Fetching:', productId);

      const response = await productAPI.getById(productId);
      setProduct(response.data || null);
    } catch (err: any) {
      console.error('[PRODUCT DETAIL ERROR]', err);
      setError(err.message || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const user = authAPI.getCurrentUser();
      if (!user) {
        alert('Please login first!');
        router.push('/login');
        return;
      }

      if (!product || product.SOLUONGTON === 0) return;

      if (quantity > product.SOLUONGTON) {
        alert(`Only ${product.SOLUONGTON} available!`);
        return;
      }

      setAddingCart(true);
      await cartAPI.addToCart(user.userId, product.MASP, quantity);

      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
      setQuantity(1);
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-red-600">
              📚 WebBanSach
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ProductSkeleton />
            <ProductSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-red-600">
              📚 WebBanSach
            </Link>
            <Link href="/" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              ← Back to Home
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 border-2 border-red-200 p-12 rounded-2xl max-w-2xl mx-auto">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              href="/"
              className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
            >
              ← Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-red-600 hover:text-red-700">
            📚 WebBanSach
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium transition-all"
            >
              🛒 Cart
            </Link>
            <Link
              href="/"
              className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8 max-w-4xl mx-auto">
          <Link href="/" className="hover:text-red-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">{product.TENSP}</span>
        </nav>

        {/* Product Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          
          {/* Image */}
          <div className="flex flex-col items-center">
            {product.IMAGE_URL ? (
              <img
                src={product.IMAGE_URL}
                alt={product.TENSP}
                className="w-full max-w-md h-96 object-cover rounded-2xl shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-book.jpg';
                }}
              />
            ) : (
              <div className="w-full max-w-md h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="text-6xl">📚</div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {product.TENSP}
              </h1>
              <div className="text-4xl md:text-5xl font-bold text-red-600 mb-6">
                ₫{product.GIABAN.toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-2xl border">
              <h3 className="font-semibold text-lg mb-3">📝 Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.DESCRIPTION || 'No description available.'}
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-2xl border">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-green-800">
                  📦 In Stock: {product.SOLUONGTON}
                </span>
                {product.SOLUONGTON === 0 && (
                  <span className="px-4 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="p-6 bg-gray-50 rounded-2xl">
              <label className="block text-lg font-semibold mb-4">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-all"
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={product.SOLUONGTON}
                  className="w-24 h-12 text-2xl text-center border-2 border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-orange-200"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= product.SOLUONGTON) {
                      setQuantity(val);
                    }
                  }}
                />

                <button
                  onClick={() => setQuantity(Math.min(product.SOLUONGTON, quantity + 1))}
                  className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-all"
                  disabled={quantity >= product.SOLUONGTON}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingCart || product.SOLUONGTON === 0 || quantity === 0}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {addingCart ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </span>
              ) : (
                '🛒 Add to Cart'
              )}
            </button>

            {cartSuccess && (
              <div className="p-4 bg-green-100 border-2 border-green-400 rounded-2xl text-green-800 font-semibold flex items-center justify-center gap-2 animate-pulse">
                ✓ Added to cart successfully!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}