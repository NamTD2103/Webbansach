'use client';

import { Product, cartAPI } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

/**
 * Reusable Product Card Component
 * Handles product display with stock status and add-to-cart functionality
 */
export default function ProductCard({ product }: ProductCardProps) {
  const isAvailable = product.SOLUONGTON > 0;
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAvailable) return;

    try {
      setIsAddingToCart(true);
      
      // Get current user
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!userStr) {
        setToastMessage('❌ Vui lòng đăng nhập để thêm vào giỏ');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      const user = JSON.parse(userStr);
      await cartAPI.addToCart(user.userId, product.MASP, 1);
      
      setToastMessage('✅ Đã thêm vào giỏ hàng');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error: any) {
      setToastMessage(`❌ ${error.message || 'Lỗi khi thêm vào giỏ'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <Link href={`/product/${product.MASP}`}>
        <div
          className={`group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
            !isAvailable ? 'opacity-75' : ''
          }`}
        >
          {/* Image Container */}
          <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            <img
              src={product.IMAGE_URL || '/placeholder.jpg'}
              alt={product.TENSP}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                !isAvailable ? 'grayscale' : ''
              }`}
            />

            {/* Out of Stock Overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-lg shadow-lg">
                  HẾT HÀNG
                </div>
              </div>
            )}

            {/* Stock Badge (top-right) */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              {isAvailable ? (
                <span className="bg-green-100 text-green-800">
                  ✅ Còn {product.SOLUONGTON}
                </span>
              ) : (
                <span className="bg-red-100 text-red-800">
                  ❌ Hết hàng
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Product Name */}
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 mb-1 h-10">
              {product.TENSP}
            </h3>

            {/* Description */}
            <p className="line-clamp-2 text-xs text-gray-500 mb-3 h-8">
              {product.DESCRIPTION || 'Không có mô tả'}
            </p>

            {/* Price */}
            <div className="text-lg font-bold text-orange-600 mb-3">
              {product.GIABAN.toLocaleString('vi-VN')} ₫
            </div>

            {/* Stock Info */}
            <div className="text-xs text-gray-400 mb-3">
              {isAvailable ? (
                <span>📦 Kho: {product.SOLUONGTON} cái</span>
              ) : (
                <span>⚠️ Tạm hết hàng</span>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || isAddingToCart}
              className={`w-full py-2 rounded-lg font-semibold transition-all text-sm ${
                isAvailable
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAddingToCart ? (
                '⏳ Đang thêm...'
              ) : isAvailable ? (
                '🛒 Thêm vào giỏ'
              ) : (
                '❌ Hết hàng'
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toastMessage}
        </div>
      )}
    </>
  );
}
