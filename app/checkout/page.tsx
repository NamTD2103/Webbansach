"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI, cartAPI, orderAPI, voucherAPI } from "@/lib/api";
import CheckoutForm from "./components/CheckoutForm";
import AddressForm from "./components/AddressForm";
import PaymentMethod from "./components/PaymentMethod";
import OrderSummary from "./components/OrderSummary";
import { CartItem } from "@/lib/api";
import Footer from "@/components/Footer";

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
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Customer info
  const [customer, setCustomer] = useState({
    fullname: "",
    phone: "",
    email: "",
  });

  // Address info
  const [address, setAddress] = useState({
    province: "",
    district: "",
    ward: "",
    street: "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Discount
  const [discountCode, setDiscountCode] = useState("");

  const [discount, setDiscount] = useState(0);

  const [voucher, setVoucher] = useState<any>(null);

  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Initialize
  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Lấy user đang đăng nhập
        let currentUser = authAPI.getCurrentUser();

        // Nếu chưa đăng nhập thì dùng tài khoản guest
        if (!currentUser) {
          currentUser = {
            userId: 9999,
            username: "guest",
            fullname: "Khách vãng lai",
            email: "",
            role: "USER",
          };
        }

        setUser(currentUser);

        // Điền thông tin mặc định
        setCustomer({
          fullname: currentUser.fullname || "",
          phone: "",
          email: currentUser.email || "",
        });

        // Luôn lấy giỏ hàng từ database
        const cartResult = await cartAPI.getCart(currentUser.userId);

        console.log("[Cart]", cartResult);

        if (cartResult.success) {
          setCart(cartResult.data || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("[Checkout Init Error]", error);

        showToast("error", "Không tải được giỏ hàng");

        setLoading(false);
      }
    };

    initCheckout();
  }, []);

  // Calculate prices
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.GIABAN || 0) * item.SOLUONG,
    0,
  );
  const shippingFee = SHIPPING_FEES[address.province] || 0;
  const total = subtotal + shippingFee - discount;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Customer validation
    if (!customer.fullname.trim()) {
      newErrors.fullname = "Vui lòng nhập họ tên";
    }
    if (!customer.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9,10}$/.test(customer.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = "Email không đúng định dạng";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    // Address validation
    if (!address.province) {
      newErrors.province = "Vui lòng chọn tỉnh/thành phố";
    }
    if (!address.district) {
      newErrors.district = "Vui lòng chọn quận/huyện";
    }
    if (!address.street.trim()) {
      newErrors.street = "Vui lòng nhập địa chỉ chi tiết";
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

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      showToast("error", "Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setApplyingVoucher(true);

      const res = await voucherAPI.apply(discountCode.toUpperCase(), subtotal);

      if (!res.success) {
        showToast("error", res.message);
        return;
      }

      setVoucher(res.voucher);

      setDiscount(res.discount);

      showToast("success", `Áp dụng ${res.voucher.CODE} thành công`);
    } catch (err: any) {
      showToast("error", err.message || "Không áp dụng được voucher");
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (cart.length === 0) {
      showToast("error", "Giỏ hàng trống");
      return;
    }

    try {
      setSubmitting(true);
      const orderData = {
       userId: user?.userId ?? 9999,

        customerInfo: customer,

        shippingAddress: address,

        items: cart.map((item) => ({
          masp: item.MASP,
          soluong: item.SOLUONG,
        })),

        paymentMethod,

        voucherCode: voucher?.CODE || null,

        voucherId: voucher?.VOUCHER_ID || null,

        discount,

        subtotal,

        shippingFee,

        totalAmount: total,
      };

      console.log("[Checkout] Submitting order:", orderData);

      // Simulate payment processing for online methods
      if (paymentMethod !== "cod") {
        // In real app, redirect to payment gateway
        showToast("success", "Chuyển hướng đến cổng thanh toán...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const result = await orderAPI.createOrder(orderData);

      console.log("[Checkout] Order created:", result);

      // Lưu thông tin đơn hàng vừa tạo
      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orderId: result.orderId,

          customer,

          address,

          items: cart,

          subtotal,

          shippingFee,

          discount,

          total,

          paymentMethod,

          voucher,
        }),
      );

      // Xóa giỏ hàng
      try {
        try {
          await cartAPI.clearCart(user?.userId ?? 9999);

          setCart([]);
        } catch (error) {
          console.error("Clear cart error:", error);
        }

        setCart([]);
      } catch (error) {
        console.error("Clear cart error:", error);
      }

      showToast("success", "Đặt hàng thành công!");

      setTimeout(() => {
        router.push(`/order-success?id=${result.orderId}`);
      }, 1500);
    } catch (error) {
      console.error("[Checkout] Order error:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Lỗi đặt hàng",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  🎁 Voucher
                </h3>

                {voucher && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                    Đã áp dụng
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                  placeholder="Nhập mã giảm giá..."
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3
        focus:border-red-500 outline-none transition"
                />

                <button
                  disabled={applyingVoucher}
                  onClick={handleApplyDiscount}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300
        text-white px-6 rounded-xl font-semibold transition"
                >
                  {applyingVoucher ? "..." : "Áp dụng"}
                </button>
              </div>

              {voucher && (
                <div
                  className="
  mt-5
  rounded-2xl
  border
  border-green-200
  bg-gradient-to-r
  from-green-50
  to-emerald-100
  p-5
  shadow-sm
  "
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                          🏷
                        </div>

                        <div>
                          <p className="font-bold text-lg">{voucher.CODE}</p>

                          <p className="text-sm text-gray-500">
                            Voucher đã được áp dụng
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {voucher.DISCOUNT_TYPE === "PERCENT"
                          ? `Giảm ${voucher.DISCOUNT_VALUE}%`
                          : `Giảm ${voucher.DISCOUNT_VALUE.toLocaleString(
                              "vi-VN",
                            )}₫`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Bạn tiết kiệm</p>

                      <p className="text-xl font-bold text-red-600">
                        -{discount.toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                {submitting ? "⏳ Đang xử lý..." : "✓ Đặt hàng"}
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
              voucher={voucher}
              loading={submitting}
            />
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg animate-pulse ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
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
