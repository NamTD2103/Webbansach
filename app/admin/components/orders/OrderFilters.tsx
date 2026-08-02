"use client";

interface Props {
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;

  statusFilter: string;
  setStatusFilter: (value: string) => void;

  paymentFilter: string;
  setPaymentFilter: (value: string) => void;

  fromDate: string;
  setFromDate: (value: string) => void;

  toDate: string;
  setToDate: (value: string) => void;

  sortBy: string;
  setSortBy: (value: string) => void;

  totalAmount: number;

  onReset: () => void;
}

export default function OrderFilters({
  searchKeyword,
  setSearchKeyword,

  statusFilter,
  setStatusFilter,

  paymentFilter,
  setPaymentFilter,

  fromDate,
  setFromDate,

  toDate,
  setToDate,

  sortBy,
  setSortBy,

  totalAmount,

  onReset,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">

      {/* Tổng doanh thu */}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            Tổng doanh thu theo bộ lọc
          </p>

          <p className="text-3xl font-bold text-green-600">
            ₫{totalAmount.toLocaleString("vi-VN")}
          </p>

        </div>

        {(fromDate || toDate) && (

          <div className="text-right text-sm text-gray-500">

            <div>
              Từ: {fromDate || "--/--/----"}
            </div>

            <div>
              Đến: {toDate || "--/--/----"}
            </div>

          </div>

        )}

      </div>

      {/* Bộ lọc */}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">

        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Mã đơn hoặc khách hàng..."
          value={searchKeyword}
          onChange={(e) =>
            setSearchKeyword(e.target.value)
          }
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="ALL">Tất cả trạng thái</option>

          <option value="PENDING">
            Chờ xử lý
          </option>

          <option value="PROCESSING">
            Đang xử lý
          </option>

          <option value="COMPLETED">
            Hoàn thành
          </option>

          <option value="CANCELLED">
            Đã hủy
          </option>
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(e.target.value)
          }
        >
          <option value="ALL">
            Thanh toán
          </option>

          <option value="COD">
            COD
          </option>

          <option value="ONLINE">
            Online
          </option>
        </select>

        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
        />

        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
        >
          <option value="newest">
            Mới nhất
          </option>

          <option value="oldest">
            Cũ nhất
          </option>

          <option value="price_high">
            Giá cao → thấp
          </option>

          <option value="price_low">
            Giá thấp → cao
          </option>
        </select>

        <button
          onClick={onReset}
          className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2"
        >
          Reset
        </button>

      </div>

    </div>
  );
}