"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  TicketPercent,
  House,
} from "lucide-react";

type Tab = "dashboard" | "products" | "accounts" | "orders" | "vouchers";

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const menus = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "products",
    title: "Sản phẩm",
    icon: Package,
  },
  {
    key: "accounts",
    title: "Khách hàng",
    icon: Users,
  },
  {
    key: "orders",
    title: "Đơn hàng",
    icon: ShoppingCart,
  },
  {
    key: "vouchers",
    title: "Mã khuyến mãi",
    icon: TicketPercent,
  },
] as const;

export default function Sidebar({ activeTab, onChange }: Props) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 shadow-xl">
      <div className="p-8 border-b">
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📚 CloudyBook
        </h1>

        <p className="text-sm text-slate-500 mt-2">Admin Dashboard</p>
      </div>

      <div className="p-4 space-y-2">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <button
              key={menu.key}
              onClick={() => onChange(menu.key)}
              className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all

              ${
                activeTab === menu.key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Icon size={22} />

              <span className="font-medium">{menu.title}</span>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-4 right-4 space-y-2">
        <Link
          href="/"
          className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 hover:bg-green-100 text-green-700 transition"
        >
          <House size={22} />
          <span className="font-medium">Quay lại trang chủ</span>
        </Link>

        <button className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 hover:bg-slate-100 transition">
          <Settings size={22} />
          <span className="font-medium">Cài đặt</span>
        </button>
      </div>
    </aside>
  );
}
