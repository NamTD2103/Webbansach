"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cartAPI, authAPI, CartItem } from "@/lib/api";

import Footer from "@/components/Footer";

import {
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
  saveGuestCart,
} from "@/lib/userExperience";

function CartSkeleton() {
  return (
    <div
      className="
bg-white
rounded-lg
shadow
p-4
animate-pulse
"
    >
      <div
        className="
flex
gap-4
"
      >
        <div
          className="
w-20
h-20
bg-gray-200
rounded
"
        />

        <div
          className="
flex-1
space-y-2
"
        >
          <div
            className="
h-4
bg-gray-200
rounded
w-3/4
"
          />

          <div
            className="
h-4
bg-gray-200
rounded
w-1/2
"
          />
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [user, setUser] = useState<any>(null);

  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();

    setUser(currentUser);

    if (currentUser) {
      loadUserCart(currentUser.userId);
    } else {
      const guest = getGuestCart();

      setCartItems(guest as CartItem[]);

      setLoading(false);
    }
  }, []);

  // =============================
  // LOAD USER CART
  // =============================

  const loadUserCart = async (userId: number) => {
    try {
      setLoading(true);

      const res = await cartAPI.getCart(userId);

      setCartItems(res.data || []);
    } catch (err) {
      console.error(err);

      setError("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // REMOVE ITEM
  // =============================

  const handleRemoveItem = async (masp: string) => {
    try {
      if (user) {
        await cartAPI.removeFromCart(user.userId, masp);

        await loadUserCart(user.userId);
      } else {
        const updated = removeGuestCartItem(masp);

        setCartItems(updated as CartItem[]);
      }
    } catch (err) {
      alert("Xóa sản phẩm thất bại");
    }
  };

  // =============================
  // UPDATE QUANTITY
  // =============================

  const handleQuantityChange = async (item: CartItem, quantity: number) => {
    if (quantity < 1) return;

    const max = item.SOLUONGTON;

    if (quantity > max) {
      alert(`Chỉ còn ${max} sản phẩm`);
      return;
    }

    if (user) {
      try {
        await cartAPI.updateQuantity(user.userId, item.MASP, quantity);

        await loadUserCart(user.userId);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      const updated = updateGuestCartItem(item.MASP, quantity);

      setCartItems(updated as CartItem[]);
    }
  };

  // =============================
  // CHECKOUT
  // =============================

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Giỏ hàng trống");

      return;
    }

    localStorage.setItem("guestCart", JSON.stringify(cartItems));

    router.push("/checkout");
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.GIABAN * (item.SOLUONG || 1),

    0,
  );

  return (
    <div
      className="
min-h-screen
bg-gray-100
"
    >
      <header
        className="
bg-white
shadow
"
      >
        <div
          className="
max-w-7xl
mx-auto
px-4
py-4
flex
justify-between
"
        >
          <Link
            href="/"
            className="
text-2xl
font-bold
text-red-500
"
          >
            📚 Cloudy Book
          </Link>

          <div
            className="
flex
gap-3
"
          >
            <Link
              href="/"
              className="
px-4
py-2
border
rounded
"
            >
              Tiếp tục mua
            </Link>
          </div>
        </div>
      </header>

      <main
        className="
max-w-7xl
mx-auto
px-4
py-8
"
      >
        <h1
          className="
text-3xl
font-bold
mb-6
"
        >
          🛒 Giỏ hàng
        </h1>
        {error && (
          <div
            className="
bg-red-100
border
border-red-400
text-red-700
p-4
rounded
mb-6
"
          >
            ❌ {error}
          </div>
        )}

        {loading && (
          <div
            className="
space-y-4
"
          >
            {[1, 2, 3].map((i) => (
              <CartSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && cartItems.length === 0 && (
          <div
            className="
bg-white
rounded-xl
shadow
p-12
text-center
"
          >
            <div
              className="
text-6xl
mb-4
"
            >
              🛒
            </div>

            <h2
              className="
text-xl
font-bold
mb-4
"
            >
              Giỏ hàng đang trống
            </h2>

            <Link
              href="/"
              className="
inline-block
bg-orange-500
text-white
px-6
py-3
rounded-lg
"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}

        {!loading && cartItems.length > 0 && (
          <div
            className="
grid
grid-cols-1
lg:grid-cols-3
gap-8
"
          >
            {/* ======================
     PRODUCT LIST
====================== */}

            <div
              className="
lg:col-span-2
space-y-4
"
            >
              {cartItems.map((item) => (
                <div
                  key={item.MASP}
                  className="
bg-white
rounded-xl
shadow
p-4
flex
gap-4
"
                >
                  {/* IMAGE */}

                  <div
                    className="
w-24
h-24
rounded
overflow-hidden
bg-gray-200
flex-shrink-0
"
                  >
                    {item.IMAGE_URL ? (
                      <img
                        src={item.IMAGE_URL}
                        alt={item.TENSP}
                        className="
w-full
h-full
object-cover
"
                      />
                    ) : (
                      <div
                        className="
flex
items-center
justify-center
h-full
text-3xl
"
                      >
                        📖
                      </div>
                    )}
                  </div>

                  {/* INFO */}

                  <div
                    className="
flex-1
"
                  >
                    <h3
                      className="
font-bold
text-lg
"
                    >
                      {item.TENSP}
                    </h3>

                    <p
                      className="
text-gray-500
text-sm
"
                    >
                      Mã:
                      {item.MASP}
                    </p>

                    <p
                      className="
text-red-500
font-bold
mt-2
"
                    >
                      ₫{item.GIABAN?.toLocaleString("vi-VN")}
                    </p>
                  </div>

                  {/* QUANTITY */}

                  <div
                    className="
flex
flex-col
items-end
justify-between
"
                  >
                    <div
                      className="
flex
items-center
gap-3
"
                    >
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item,

                            item.SOLUONG - 1,
                          )
                        }
                        className="
w-8
h-8
border
rounded-full
"
                      >
                        -
                      </button>

                      <span
                        className="
font-bold
"
                      >
                        {item.SOLUONG}
                      </span>

                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item,

                            item.SOLUONG + 1,
                          )
                        }
                        className="
w-8
h-8
border
rounded-full
"
                      >
                        +
                      </button>
                    </div>

                    <p
                      className="
font-bold
text-lg
"
                    >
                      ₫{(item.GIABAN * item.SOLUONG).toLocaleString("vi-VN")}
                    </p>

                    <button
                      onClick={() => handleRemoveItem(item.MASP)}
                      className="
text-red-500
font-semibold
text-sm
"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ======================
     SUMMARY
====================== */}

            <div>
              <div
                className="
bg-white
rounded-xl
shadow
p-6
sticky
top-5
"
              >
                <h2
                  className="
text-2xl
font-bold
mb-6
"
                >
                  Thanh toán
                </h2>

                <div
                  className="
space-y-4
border-b
pb-5
"
                >
                  <div
                    className="
flex
justify-between
"
                  >
                    <span>Tạm tính</span>

                    <b>₫{totalAmount.toLocaleString("vi-VN")}</b>
                  </div>

                  <div
                    className="
flex
justify-between
"
                  >
                    <span>Phí vận chuyển</span>

                    <span
                      className="
text-green-600
font-bold
"
                    >
                      Miễn phí
                    </span>
                  </div>
                </div>

                <div
                  className="
flex
justify-between
items-center
my-6
"
                >
                  <span
                    className="
text-xl
font-bold
"
                  >
                    Tổng
                  </span>

                  <span
                    className="
text-3xl
font-bold
text-red-500
"
                  >
                    ₫{totalAmount.toLocaleString("vi-VN")}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="
w-full
bg-orange-500
hover:bg-orange-600
text-white
py-3
rounded-xl
font-bold
text-lg
disabled:bg-gray-400
"
                >
                  {checkingOut ? "Đang xử lý..." : "💳 Thanh toán"}
                </button>

                <Link
                  href="/"
                  className="
block
text-center
mt-5
text-blue-500
"
                >
                  ← Tiếp tục mua hàng
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer
        className="
bg-gray-800
text-white
mt-12
py-8
"
      >
        <Footer />
      </footer>
    </div>
  );
}
