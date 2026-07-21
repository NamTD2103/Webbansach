"use client";

interface Voucher {
  VOUCHER_ID: number;
  CODE: string;
  DISCOUNT: number;
  TYPE: "PERCENT" | "FIXED";
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
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-4 text-left">Mã</th>
            <th>Giảm</th>
            <th>SL</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {vouchers.map((item) => (
            <tr key={item.VOUCHER_ID} className="border-b">
              <td className="p-4 font-semibold">{item.CODE}</td>

              <td>
                {item.TYPE === "PERCENT"
                  ? `${item.DISCOUNT}%`
                  : `${item.DISCOUNT.toLocaleString()}₫`}
              </td>

              <td>{item.QUANTITY}</td>

              <td>
                {new Date(item.START_DATE).toLocaleDateString("vi-VN")}
              </td>

              <td>
                {new Date(item.END_DATE).toLocaleDateString("vi-VN")}
              </td>

              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {item.STATUS}
                </span>
              </td>

              <td className="space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600"
                >
                  Sửa
                </button>

                <button
                  onClick={() => onDelete(item.VOUCHER_ID)}
                  className="text-red-600"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}