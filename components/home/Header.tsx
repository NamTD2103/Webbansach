"use client";

import Link from "next/link";
import { getGuestCart } from "@/lib/userExperience";

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-2xl shadow-lg">
              📚
            </div>

            <div>
              <h1 className="font-black text-2xl bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Cloudy Book
              </h1>

              <p className="text-xs text-gray-500">
                Read • Learn • Grow
              </p>
            </div>
          </Link>

          {/* Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className="font-semibold hover:text-red-500 duration-300"
            >
              Trang chủ
            </Link>

            <Link
              href="#products"
              className="font-semibold hover:text-red-500 duration-300"
            >
              Sách
            </Link>

            <Link
              href="#sale"
              className="font-semibold hover:text-red-500 duration-300"
            >
              Flash Sale
            </Link>

            <Link
              href="#category"
              className="font-semibold hover:text-red-500 duration-300"
            >
              Danh mục
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-red-500 hover:text-white duration-300">
              ❤️
            </button>

            <Link
              href="/cart"
              className="relative w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center duration-300"
            >
              🛒

              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-xs flex items-center justify-center">
                {getGuestCart().length}
              </span>
            </Link>

            {user ? (
              <Link
                href="/account"
                className="px-5 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center font-semibold hover:scale-105 duration-300"
              >
                👤 {user.username}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-6 h-12 rounded-xl border flex items-center font-semibold hover:bg-red-500 hover:text-white duration-300"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}