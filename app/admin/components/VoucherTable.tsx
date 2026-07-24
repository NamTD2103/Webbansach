"use client";

import {
  Pencil,
  Trash2,
  Percent,
  Wallet,
  CalendarDays,
} from "lucide-react";

interface Voucher {
  VOUCHER_ID: number;
  CODE: string;
  DISCOUNT_VALUE: number;
  DISCOUNT_TYPE: "PERCENT" | "FIXED";
  QUANTITY: number;
  START_DATE: string;
  END_DATE: string;
  STATUS: string;
}

interface Props {
  vouchers: Voucher[];
  onEdit: (voucher: Voucher) => void;
  onDelete: (id: number) => void;
}

export default function VoucherTable({
  vouchers,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">
          Danh sách mã giảm giá
        </h2>

        <p className="text-blue-100 text-sm">
          Tổng cộng {vouchers.length} mã khuyến mãi
        </p>
      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">

            <tr>

              <th className="px-6 py-4 text-left">
                Mã
              </th>

              <th className="px-6 py-4 text-center">
                Giảm giá
              </th>

              <th className="px-6 py-4 text-center">
                Số lượng
              </th>

              <th className="px-6 py-4 text-center">
                Hiệu lực
              </th>

              <th className="px-6 py-4 text-center">
                Trạng thái
              </th>

              <th className="px-6 py-4 text-center">
                Thao tác
              </th>

            </tr>

          </thead>

          <tbody>

            {vouchers.length === 0 && (

              <tr>

                <td
                  colSpan={6}
                  className="text-center py-10 text-gray-400"
                >
                  Chưa có mã giảm giá
                </td>

              </tr>

            )}

            {vouchers.map((item, index) => (

              <tr
                key={item.VOUCHER_ID}
                className={`border-b transition hover:bg-blue-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >

                {/* CODE */}
                <td className="px-6 py-4">

                  <div className="font-bold text-gray-800">
                    {item.CODE}
                  </div>

                </td>

                {/* DISCOUNT */}
                <td className="px-6 py-4 text-center">

                  {item.DISCOUNT_TYPE === "PERCENT" ? (

                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">

                      <Percent size={15} />

                      {item.DISCOUNT_VALUE}%

                    </span>

                  ) : (

                    <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">

                      <Wallet size={15} />

                      {item.DISCOUNT_VALUE.toLocaleString("vi-VN")}₫

                    </span>

                  )}

                </td>

                {/* QUANTITY */}
                <td className="px-6 py-4 text-center font-semibold">

                  {item.QUANTITY}

                </td>

                {/* DATE */}
                <td className="px-6 py-4">

                  <div className="flex flex-col text-sm">

                    <span className="flex items-center gap-2">

                      <CalendarDays size={14} />

                      {new Date(item.START_DATE).toLocaleDateString("vi-VN")}

                    </span>

                    <span className="text-gray-500 mt-1">

                      →

                      {" "}

                      {new Date(item.END_DATE).toLocaleDateString("vi-VN")}

                    </span>

                  </div>

                </td>

                {/* STATUS */}
                <td className="px-6 py-4 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.STATUS === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.STATUS === "ACTIVE"
                      ? "Hoạt động"
                      : "Ngừng"}
                  </span>

                </td>

                {/* ACTION */}
                <td className="px-6 py-4">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => onEdit(item)}
                      className="w-10 h-10 rounded-lg bg-blue-100 hover:bg-blue-600 hover:text-white transition flex items-center justify-center"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => onDelete(item.VOUCHER_ID)}
                      className="w-10 h-10 rounded-lg bg-red-100 hover:bg-red-600 hover:text-white transition flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}