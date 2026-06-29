"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div>
          <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            CloudyInSouth.com
          </h4>
          <p className="text-gray-400 leading-relaxed">
            Nhà sách trực tuyến hàng đầu Việt Nam với hàng triệu đầu sách.
          </p>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-lg">Dịch vụ khách hàng</h5>
          <ul className="space-y-3 text-gray-400">
            <li>📞 0971721305</li>
            <li>📧 HoTro@cloudyinsouth.com</li>
            <li>🕒 Hỗ trợ 24/7</li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-lg">Liên kết nhanh</h5>
          <ul className="space-y-3 text-gray-400">
            <li>
              <Link href="/about" className="hover:text-white transition">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/policy" className="hover:text-white transition">
                Policy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6 text-lg">Theo dõi chúng tôi</h5>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 transition"
            >
              📘
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500 transition"
            >
              🐦
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 transition"
            >
              📷
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
        <p>
          &copy; 2026 CloudyInSouth.com. Bản quyền đã được bảo lưu. Sản xuất
          bằng ❤️ tại Việt Nam
        </p>
      </div>
    </div>
  );
}
