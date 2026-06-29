'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || 'ORD000';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-red-500">
            📚 WebBanSach
          </Link>
        </div>
      </header>

      {/* Success Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 text-6xl animate-bounce">✓</div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã mua hàng tại WebBanSach
          </p>

          {/* Order ID */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <p className="text-gray-600 mb-2">Mã đơn hàng của bạn:</p>
            <p className="text-2xl font-bold text-green-600">{orderId}</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>ℹ️</span> Thông tin đơn hàng
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Đơn hàng của bạn đã được tiếp nhận</li>
              <li>✓ Bạn sẽ nhận email xác nhận trong vòng 5 phút</li>
              <li>✓ Sản phẩm sẽ được gửi trong 1-3 ngày làm việc</li>
              <li>✓ Bạn có thể theo dõi đơn hàng trong trang Account</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/account"
              className="block w-full py-3 px-6 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
            >
              📍 Xem đơn hàng của tôi
            </Link>
            <Link
              href="/"
              className="block w-full py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <p className="mb-2">Cần hỗ trợ?</p>
            <p>📞 Liên hệ: <span className="font-semibold">support@webbansach.com</span></p>
            <p>⏰ Giờ làm việc: 08:00 - 20:00 (Hàng ngày)</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-6 mt-12">
        <p>© 2024 WebBanSach. All rights reserved.</p>
      </footer>
    </div>
  );
}
