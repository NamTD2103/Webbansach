"use client";

import { useState } from "react";

export default function VoucherModal({
  voucher,
  onClose,
  onSave,
}: any) {
  const [form, setForm] = useState(
    voucher || {
      CODE: "",
      DISCOUNT: 10,
      TYPE: "PERCENT",
      QUANTITY: 100,
      START_DATE: "",
      END_DATE: "",
    }
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-[500px]">

        <h2 className="text-xl font-bold mb-5">
          {voucher ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá"}
        </h2>

        <input
          placeholder="Mã giảm giá"
          className="border w-full p-2 rounded mb-3"
          value={form.CODE}
          onChange={(e) =>
            setForm({ ...form, CODE: e.target.value })
          }
        />

        <input
          type="number"
          className="border w-full p-2 rounded mb-3"
          value={form.DISCOUNT}
          onChange={(e) =>
            setForm({
              ...form,
              DISCOUNT: Number(e.target.value),
            })
          }
        />

        <select
          className="border w-full p-2 rounded mb-3"
          value={form.TYPE}
          onChange={(e) =>
            setForm({ ...form, TYPE: e.target.value })
          }
        >
          <option value="PERCENT">%</option>
          <option value="FIXED">VNĐ</option>
        </select>

        <input
          type="number"
          className="border w-full p-2 rounded mb-3"
          value={form.QUANTITY}
          onChange={(e) =>
            setForm({
              ...form,
              QUANTITY: Number(e.target.value),
            })
          }
        />

        <input
          type="date"
          className="border w-full p-2 rounded mb-3"
          value={form.START_DATE}
          onChange={(e) =>
            setForm({
              ...form,
              START_DATE: e.target.value,
            })
          }
        />

        <input
          type="date"
          className="border w-full p-2 rounded mb-4"
          value={form.END_DATE}
          onChange={(e) =>
            setForm({
              ...form,
              END_DATE: e.target.value,
            })
          }
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Hủy
          </button>

          <button
            onClick={() => onSave(form)}
            className="bg-blue-600 text-white px-5 py-2 rounded"
          >
            Lưu
          </button>
        </div>

      </div>
    </div>
  );
}