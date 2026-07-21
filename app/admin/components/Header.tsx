"use client";

import { Bell, Search, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-4 z-30 w-full">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 px-8 py-5 flex items-center justify-between">

        {/* Left */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            📚 Cloudy Book
          </h1>

          <p className="text-slate-500">
            Book Management Dashboard
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">

          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-4 top-3 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="
                w-80
                rounded-2xl
                border
                border-gray-200
                pl-12
                pr-4
                py-3
                bg-slate-50
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />
          </div>

          {/* Notification */}
          <button className="relative w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition">

            <Bell className="mx-auto mt-3" />

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>

          </button>

          {/* Setting */}
          <button className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 transition">
            <Settings className="mx-auto mt-3" />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">

              A

            </div>

            <div>

              <p className="font-semibold text-slate-700">
                Administrator
              </p>

              <p className="text-sm text-green-500">
                ● Online
              </p>

            </div>

          </div>

        </div>

      </div>
    </header>
  );
}