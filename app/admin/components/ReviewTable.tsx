"use client";

interface Props {
  reviews: any[];
  onToggleStatus: (id: number, status: string) => void;
}

export default function ReviewTable({
  reviews,
  onToggleStatus,
}: Props) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= rating
                ? "text-yellow-400 text-lg"
                : "text-gray-300 text-lg"
            }
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const statusBadge = (status: string) => {
    if (status === "VISIBLE") {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          Hiển thị
        </span>
      );
    }

    return (
      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
        Đã ẩn
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Người dùng
              </th>

              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Sản phẩm
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-700">
                Đánh giá
              </th>

              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Nội dung
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-700">
                Trạng thái
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-700">
                Ngày
              </th>

              <th className="px-6 py-4 text-center font-semibold text-gray-700">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-gray-500"
                >
                  Chưa có đánh giá nào
                </td>
              </tr>
            ) : (
              reviews.map((item) => (
                <tr
                  key={item.REVIEW_ID}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {/* USER */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                        {item.USERNAME?.charAt(0)?.toUpperCase()}
                      </div>

                      <span className="font-medium text-gray-800">
                        {item.USERNAME}
                      </span>
                    </div>
                  </td>

                  {/* PRODUCT */}
                  <td className="px-6 py-4 font-medium">
                    {item.TENSP}
                  </td>

                  {/* STAR */}
                  <td className="px-6 py-4 text-center">
                    {renderStars(item.RATING)}
                  </td>

                  {/* COMMENT */}
                  <td className="px-6 py-4 max-w-xs">
                    <p className="line-clamp-2 text-gray-600">
                      {item.COMMENT_TEXT || "-"}
                    </p>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4 text-center">
                    {statusBadge(item.STATUS)}
                  </td>

                  {/* DATE */}
                  <td className="px-6 py-4 text-center text-gray-500">
                    {item.CREATED_AT
                      ? new Date(item.CREATED_AT).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-center">
                    {item.STATUS === "VISIBLE" ? (
                      <button
                        onClick={() =>
                          onToggleStatus(item.REVIEW_ID, "HIDDEN")
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        Ẩn
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onToggleStatus(item.REVIEW_ID, "VISIBLE")
                        }
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        Hiện
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}