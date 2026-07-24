"use client";

import { useState } from "react";
import { TicketPercent } from "lucide-react";

export default function VoucherModal({ voucher, onClose, onSave }: any) {
  const [form, setForm] = useState(
    voucher || {
      CODE: "",
      DISCOUNT_VALUE: 10,
      DISCOUNT_TYPE: "PERCENT",
      QUANTITY: 100,
      START_DATE: "",
      END_DATE: "",
      STATUS: "ACTIVE",
    }
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5">

      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">

        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-3">
          <TicketPercent size={26} />
          <div>
            <h2 className="text-xl font-bold">
              {voucher ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá"}
            </h2>
            <p className="text-blue-100 text-sm">
              Quản lý chương trình khuyến mãi
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-5">

          <div>
            <label className="block mb-2 font-medium">
              Mã giảm giá
            </label>

            <input
              className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
              value={form.CODE}
              onChange={(e) =>
                setForm({
                  ...form,
                  CODE: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Loại giảm
            </label>

            <select
              className="w-full border rounded-xl p-3"
              value={form.DISCOUNT_TYPE}
              onChange={(e) =>
                setForm({
                  ...form,
                  DISCOUNT_TYPE: e.target.value,
                })
              }
            >
              <option value="PERCENT">Giảm theo %</option>
              <option value="FIXED">Giảm tiền (VNĐ)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Giá trị giảm
            </label>

            <input
              type="number"
              className="w-full border rounded-xl p-3"
              value={form.DISCOUNT_VALUE}
              onChange={(e) =>
                setForm({
                  ...form,
                  DISCOUNT_VALUE: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Số lượng
            </label>

            <input
              type="number"
              className="w-full border rounded-xl p-3"
              value={form.QUANTITY}
              onChange={(e) =>
                setForm({
                  ...form,
                  QUANTITY: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Ngày bắt đầu
            </label>

            <input
              type="date"
              className="w-full border rounded-xl p-3"
              value={form.START_DATE}
              onChange={(e) =>
                setForm({
                  ...form,
                  START_DATE: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Ngày kết thúc
            </label>

            <input
              type="date"
              className="w-full border rounded-xl p-3"
              value={form.END_DATE}
              onChange={(e) =>
                setForm({
                  ...form,
                  END_DATE: e.target.value,
                })
              }
            />
          </div>

          <div className="col-span-2">
            <label className="block mb-2 font-medium">
              Trạng thái
            </label>

            <select
              className="w-full border rounded-xl p-3"
              value={form.STATUS}
              onChange={(e) =>
                setForm({
                  ...form,
                  STATUS: e.target.value,
                })
              }
            >
              <option value="ACTIVE">🟢 Hoạt động</option>
              <option value="INACTIVE">🔴 Ngừng hoạt động</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border hover:bg-gray-100 transition"
          >
            Hủy
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-8 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg"
          >
            💾 Lưu
          </button>

        </div>

      </div>

    </div>
  );
}