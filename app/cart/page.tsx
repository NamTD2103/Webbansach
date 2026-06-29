'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartAPI, orderAPI, authAPI, CartItem } from '@/lib/api';
import Footer from '@/components/Footer';

function CartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    fetchCart(currentUser.userId);
  }, [router]);

  const fetchCart = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[CART] Fetching cart for user:', userId);
      const response = await cartAPI.getCart(userId);
      setCartItems(response.data || []);
    } catch (err) {
      console.error('[CART ERROR]', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (masp: string) => {
    if (!user) return;
    
    try {
      console.log('[CART] Removing item:', masp);
      await cartAPI.removeFromCart(user.userId, masp);
      await fetchCart(user.userId);
    } catch (err) {
      console.error('[CART ERROR]', err);
      alert('Failed to remove item');
    }
  };

 const handleCheckout = () => {
  if (!user || cartItems.length === 0) return;

  // lưu cart để dùng bên checkout
  localStorage.setItem('cart', JSON.stringify(cartItems));

  // chuyển sang trang thanh toán
  router.push('/checkout');
};
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.TOTAL_PRICE || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-red-500">
            📚 CloudyInSouth.com
          </Link>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
            >
              Tiếp tục mua sắm
            </Link>
            <button
              onClick={() => authAPI.logout()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-gray-600">
          <Link href="/" className="hover:text-red-500">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span>Giỏ hàng</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                ❌ {error}
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <CartSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && cartItems.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-2xl text-gray-500 mb-4">🛒</p>
                <p className="text-gray-500 text-lg mb-6">Giỏ hàng của bạn đang trống</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            )}

            {!loading && cartItems.length > 0 && (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.MASP}
                    className="bg-white rounded-lg shadow-md p-4 flex gap-4 hover:shadow-lg transition"
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {item.IMAGE_URL ? (
                        <img
                          src={item.IMAGE_URL}
                          alt={item.TENSP}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-2xl">📖</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.TENSP}</h3>
                      <p className="text-gray-600 text-sm mb-2">ID: {item.MASP}</p>
                      <p className="text-red-500 font-bold">
                        ₫{item.GIABAN?.toLocaleString('vi-VN') || '0'}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <p className="text-gray-600 text-sm">Qty: {item.SOLUONG}</p>
                        <p className="font-bold text-lg">
                          ₫{item.TOTAL_PRICE?.toLocaleString('vi-VN') || '0'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.MASP)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {!loading && cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-2xl font-bold mb-6">Tóm tắt đơn hàng</h2>

                <div className="space-y-4 mb-6 pb-6 border-b">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-semibold">
                      ₫{totalAmount.toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vận chuyển</span>
                    <span className="font-semibold text-green-600">Miễn phí</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thuế</span>
                    <span className="font-semibold">₫0</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold">Tổng cộng</span>
                  <span className="text-3xl font-bold text-red-500">
                    ₫{totalAmount.toLocaleString('vi-VN')}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || cartItems.length === 0}
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 text-lg"
                >
                  {checkingOut ? '⏳ Processing...' : '💳 Thanh toán'}
                </button>

                <Link
                  href="/"
                  className="block text-center mt-4 py-2 text-blue-500 hover:text-blue-700 font-semibold"
                >
                  Tiếp tục mua sắm
                </Link>

                {/* Promo Code (mock) */}
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm text-gray-600 block mb-2">
                    Mã khuyến mãi
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold transition">
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
       <Footer />
      </footer>
    </div>
  );
}
