"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Heart,
  User,
  Lock,
  LogOut,
  ChevronRight,
  Gift,
} from "lucide-react";

import { authAPI } from "@/lib/api";

interface Props {
  userId: number;
  onEdit: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onWishlist: () => void;
}

export default function Sidebar({
  userId,
  onEdit,
  onChangePassword,
  onLogout,
  onWishlist,
}: Props) {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (userId) {
      loadPoint();
    }
  }, [userId]);

  const loadPoint = async () => {
    try {
      const res = await authAPI.getUser(userId);

      if (res.success) {
        setPoints(res.data.LOYALTY_POINTS || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="sticky top-24">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            Quản lý tài khoản
          </h2>

          <p className="text-red-100 text-sm mt-1">
            Cloudy Book Store
          </p>
        </div>

        {/* Loyalty */}
        <div className="p-5 bg-yellow-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
              <Gift className="text-white" size={24} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Điểm tích lũy
              </p>

              <h2 className="text-3xl font-bold text-orange-600">
                {points}
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            1 điểm = 10.000 VNĐ doanh thu
          </p>
        </div>

        {/* Menu */}
        <div className="p-4 space-y-2">

          {/* Đơn hàng */}
          <button
            className="
              group flex items-center justify-between
              w-full rounded-2xl px-4 py-3
              hover:bg-red-50 transition
            "
          >
            <div className="flex items-center gap-3">
              <Package
                size={20}
                className="text-red-500"
              />

              <span className="font-medium">
                Đơn hàng
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          {/* Wishlist */}
          <button
            onClick={onWishlist}
            className="
              group flex items-center justify-between
              w-full rounded-2xl px-4 py-3
              hover:bg-pink-50 transition
            "
          >
            <div className="flex items-center gap-3">
              <Heart
                size={20}
                className="text-pink-500"
              />

              <span className="font-medium">
                Wishlist
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          {/* Hồ sơ */}
          <button
            onClick={onEdit}
            className="
              group flex items-center justify-between
              w-full rounded-2xl px-4 py-3
              hover:bg-blue-50 transition
            "
          >
            <div className="flex items-center gap-3">
              <User
                size={20}
                className="text-blue-500"
              />

              <span className="font-medium">
                Hồ sơ cá nhân
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          {/* Đổi mật khẩu */}
          <button
            onClick={onChangePassword}
            className="
              group flex items-center justify-between
              w-full rounded-2xl px-4 py-3
              hover:bg-yellow-50 transition
            "
          >
            <div className="flex items-center gap-3">
              <Lock
                size={20}
                className="text-yellow-500"
              />

              <span className="font-medium">
                Đổi mật khẩu
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>
        </div>

        {/* Logout */}
        <div className="border-t p-4">
          <button
            onClick={onLogout}
            className="
              flex items-center justify-center gap-2
              w-full rounded-2xl
              bg-red-500 hover:bg-red-600
              text-white py-3
              font-semibold transition
            "
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}