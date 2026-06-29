'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI, cartAPI, orderAPI } from '@/lib/api';
import CheckoutForm from './components/CheckoutForm';
import AddressForm from './components/AddressForm';
import PaymentMethod from './components/PaymentMethod';
import OrderSummary from './components/OrderSummary';
import { CartItem } from '@/lib/api';
import Footer from '@/components/Footer';
// Shipping fees
const SHIPPING_FEES: { [key: string]: number } = {
  HN: 0,
  HCM: 0,
  DN: 15000,
  HP: 20000,
  OTHER: 30000,
};

interface ValidationErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Customer info
  const [customer, setCustomer] = useState({
    fullname: '',
    phone: '',
    email: '',
  });

  // Address info
  const [address, setAddress] = useState({
    province: '',
    district: '',
    ward: '',
    street: '',
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Discount
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Initialize
  useEffect(() => {
    const initCheckout = async () => {
      try {
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        setCustomer({
          fullname: currentUser.fullname || '',
          phone: '',
          email: currentUser.email || '',
        });

        // Fetch cart
        const cartResult = await cartAPI.getCart(currentUser.userId);
        console.log('[Checkout] Cart:', cartResult);
        
        if (cartResult.data && cartResult.data.length > 0) {
          setCart(cartResult.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('[Checkout] Init error:', error);
        showToast('error', 'Lỗi tải giỏ hàng');
        setLoading(false);
      }
    };

    initCheckout();
  }, [router]);

  // Calculate prices
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.GIABAN || 0) * item.SOLUONG,
    0
  );
  const shippingFee = SHIPPING_FEES[address.province] || 0;
  const total = subtotal + shippingFee - discount;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Customer validation
    if (!customer.fullname.trim()) {
      newErrors.fullname = 'Vui lòng nhập họ tên';
    }
    if (!customer.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9,10}$/.test(customer.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!customer.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    // Address validation
    if (!address.province) {
      newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
    }
    if (!address.district) {
      newErrors.district = 'Vui lòng chọn quận/huyện';
    }
    if (!address.street.trim()) {
      newErrors.street = 'Vui lòng nhập địa chỉ chi tiết';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleCustomerChange = (field: string, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Apply discount (demo)
  const handleApplyDiscount = () => {
    if (discountCode === 'DEMO50') {
      setDiscount(Math.floor(subtotal * 0.1)); // 10% discount
      showToast('success', 'Áp dụng mã giảm giá thành công!');
    } else if (discountCode) {
      showToast('error', 'Mã giảm giá không hợp lệ');
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      showToast('error', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (cart.length === 0) {
      showToast('error', 'Giỏ hàng trống');
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        userId: user.userId,
        customerInfo: customer,
        shippingAddress: address,
        items: cart.map((item) => ({
          masp: item.MASP,
          tensp: item.TENSP,
          giaban: item.GIABAN,
          soluong: item.SOLUONG,
          imageUrl: item.IMAGE_URL,
        })),
        paymentMethod,
        subtotal,
        shippingFee,
        discount,
        totalAmount: total,
      };

      console.log('[Checkout] Submitting order:', orderData);

      // Simulate payment processing for online methods
      if (paymentMethod !== 'cod') {
        // In real app, redirect to payment gateway
        showToast('success', 'Chuyển hướng đến cổng thanh toán...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const result = await orderAPI.createOrder(
        user.userId,
        paymentMethod
      );

      console.log('[Checkout] Order created:', result);

      showToast('success', 'Đặt hàng thành công!');

      // Clear cart after successful order
      setTimeout(() => {
        router.push(`/order-success?id=${result.data.orderId}`);
      }, 1500);
    } catch (error) {
      console.error('[Checkout] Order error:', error);
      showToast(
        'error',
        error instanceof Error ? error.message : 'Lỗi đặt hàng'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">⏳ Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Vui lòng đăng nhập để tiếp tục</p>
          <Link href="/login" className="text-red-500 hover:text-red-700 font-semibold">
            Đi đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-red-500">
              📚 CloudyInSouth.com
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-lg text-gray-600 mb-4">Giỏ hàng của bạn trống</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-red-500">
            📚 CloudyInSouth.com
          </Link>
          <nav className="text-sm text-gray-600">
            <span className="text-gray-400 mx-2">›</span>
            <span className="font-semibold text-gray-800">Thanh toán</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <CheckoutForm
                customer={customer}
                onChange={handleCustomerChange}
                errors={errors}
              />
            </div>

            {/* Address Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <AddressForm
                address={address}
                onChange={handleAddressChange}
                errors={errors}
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <PaymentMethod
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {/* Discount Code */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎁</span> Mã giảm giá
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá (Ví dụ: DEMO50)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleApplyDiscount}
                  className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Mẹo: Thử mã "DEMO50" để có 10% giảm giá
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/cart"
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-center"
              >
                ← Quay lại giỏ hàng
              </Link>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
              >
                {submitting ? '⏳ Đang xử lý...' : '✓ Đặt hàng'}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart}
              subtotal={subtotal}
              shippingFee={shippingFee}
              discount={discount}
              total={total}
              loading={submitting}
            />
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg animate-pulse ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-6 mt-12">
        <Footer />
      </footer>
    </div>
  );
}
