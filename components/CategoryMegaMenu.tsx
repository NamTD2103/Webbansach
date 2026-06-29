'use client';

export default function CategoryMegaMenu() {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-5xl mx-auto">
      
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center text-white font-bold">
          📚
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Sách Giáo Khoa 2025
        </h2>
      </div>

      {/* Grid 3 cột */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Column 1 */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">
            SÁCH GIÁO KHOA
          </h3>
          <ul className="space-y-2 text-gray-600">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i}>
                <a href="#" className="hover:text-blue-500 transition">
                  Lớp {i + 1}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" className="text-blue-500 mt-2 inline-block hover:underline">
            Xem tất cả
          </a>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">
            SÁCH THAM KHẢO
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#" className="hover:text-blue-500">Mẫu Giáo</a></li>
            {Array.from({ length: 11 }, (_, i) => (
              <li key={i}>
                <a href="#" className="hover:text-blue-500">
                  Lớp {i + 1}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" className="text-blue-500 mt-2 inline-block hover:underline">
            Xem tất cả
          </a>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">
            LUYỆN THI THPTQG - LỚP 12
          </h3>
          <ul className="space-y-2 text-gray-600">
            {[
              'Toán',
              'Ngữ Văn',
              'Tiếng Anh',
              'Vật Lý',
              'Hóa Học',
              'Sinh Học',
              'Địa Lý',
              'Lịch Sử'
            ].map((subject) => (
              <li key={subject}>
                <a href="#" className="hover:text-blue-500">
                  Luyện Thi Môn {subject}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" className="text-blue-500 mt-2 inline-block hover:underline">
            Xem tất cả
          </a>
        </div>

      </div>
    </div>
  );
}