"use client";

import Link from "next/link";

import {
  Package,
  Heart,
  User,
  Lock,
  LogOut,
  ChevronRight,
  House,
} from "lucide-react";

interface Props {
  onEdit: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  onEdit,
  onLogout,
}: Props) {
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

        {/* Menu */}
        <div className="p-4 space-y-2">

          <button
            className="group flex items-center justify-between w-full rounded-2xl px-4 py-3 hover:bg-red-50 transition"
          >
            <div className="flex items-center gap-3">
              <Package size={20} className="text-red-500" />
              <span className="font-medium">
                Đơn hàng
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          <button
            className="group flex items-center justify-between w-full rounded-2xl px-4 py-3 hover:bg-pink-50 transition"
          >
            <div className="flex items-center gap-3">
              <Heart size={20} className="text-pink-500" />
              <span className="font-medium">
                Wishlist
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          <button
            onClick={onEdit}
            className="group flex items-center justify-between w-full rounded-2xl px-4 py-3 hover:bg-blue-50 transition"
          >
            <div className="flex items-center gap-3">
              <User size={20} className="text-blue-500" />
              <span className="font-medium">
                Hồ sơ cá nhân
              </span>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </button>

          <button
            className="group flex items-center justify-between w-full rounded-2xl px-4 py-3 hover:bg-yellow-50 transition"
          >
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-yellow-500" />
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

        {/* Footer */}
        <div className="border-t p-4">

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white py-3 font-semibold transition"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>

        </div>

      </div>

    </aside>
  );
}