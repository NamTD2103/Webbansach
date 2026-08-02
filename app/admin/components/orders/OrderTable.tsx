"use client";

import { adminAPI } from "@/lib/api";
import { Order } from "./types";

interface Props {
  orders: Order[];

  loading: boolean;

  fetchOrders: () => Promise<void>;

  showToast: (message: string, type: "success" | "error") => void;

  onViewDetail: (order: Order) => void;
}

export default function OrderTable({
  orders,
  loading,
  fetchOrders,
  showToast,
  onViewDetail,
}: Props) {
  const changeStatus = async (id: number, status: string) => {
    try {
      await adminAPI.updateOrderStatus(id, status);

      showToast("Cập nhật thành công", "success");

      fetchOrders();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";

      case "PROCESSING":
        return "bg-blue-100 text-blue-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading)
    return (
      <div
        className="
      flex
      justify-center
      items-center
      py-10
      text-gray-500
      "
      >
        Đang tải đơn hàng...
      </div>
    );

  return (
    <div
      className="
      bg-white
      rounded-xl
      shadow-sm
      border
      overflow-hidden
    "
    >
      <div
        className="
        overflow-x-auto
      "
      >
        <table
          className="
          min-w-full
          text-sm
        "
        >
          <thead>
            <tr
              className="
              bg-gray-50
              text-gray-600
              uppercase
              text-xs
            "
            >
              <th
                className="
                px-6
                py-4
                text-left
              "
              >
                Mã ĐH
              </th>

              <th
                className="
                px-6
                py-4
                text-left
              "
              >
                Khách hàng
              </th>

              <th
                className="
                px-6
                py-4
                text-right
              "
              >
                Tổng tiền
              </th>

              <th
                className="
                px-6
                py-4
                text-center
              "
              >
                Trạng thái
              </th>

              <th
                className="
                px-6
                py-4
                text-center
              "
              >
                Hành động
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="
                    text-center
                    py-10
                    text-gray-400
                    "
                >
                  Không có đơn hàng
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.ORDER_ID}
                  className="
                    border-t
                    hover:bg-gray-50
                    transition
                    "
                >
                  <td
                    className="
                      px-6
                      py-4
                      font-semibold
                      text-gray-700
                    "
                  >
                    #{order.ORDER_ID}
                  </td>

                  <td
                    className="
                      px-6
                      py-4
                    "
                  >
                    <div
                      className="
                        font-medium
                        text-gray-800
                      "
                    >
                      {order.USERNAME}
                    </div>
                  </td>

                  <td
                    className="
                      px-6
                      py-4
                      text-right
                      font-semibold
                      text-red-600
                    "
                  >
                    ₫{order.TOTAL_AMOUNT.toLocaleString("vi-VN")}
                  </td>

                  <td
                    className="
                      px-6
                      py-4
                      text-center
                    "
                  >
                    <span
                      className={`
                          px-3
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${statusStyle(order.STATUS)}
                        `}
                    >
                      {order.STATUS === "PENDING"
                        ? "Chờ xử lý"
                        : order.STATUS === "PROCESSING"
                          ? "Đang xử lý"
                          : order.STATUS === "COMPLETED"
                            ? "Hoàn thành"
                            : "Đã hủy"}
                    </span>
                  </td>

                  <td
                    className="
                      px-6
                      py-4
                    "
                  >
                    <div
                      className="
                        flex
                        justify-center
                        items-center
                        gap-2
                      "
                    >
                      <button
                        onClick={() => onViewDetail(order)}
                        className="
                            bg-blue-500
                            hover:bg-blue-600
                            text-white
                            px-4
                            py-2
                            rounded-lg
                            text-xs
                            font-medium
                            transition
                            shadow-sm
                          "
                      >
                        Chi tiết
                      </button>

                      <select
                        value={order.STATUS}
                        onChange={(e) =>
                          changeStatus(order.ORDER_ID, e.target.value)
                        }
                        className="
                            border
                            rounded-lg
                            px-3
                            py-2
                            text-xs
                            bg-white
                            cursor-pointer
                            focus:ring-2
                            focus:ring-blue-400
                            outline-none
                          "
                      >
                        <option value="PENDING">Chờ xử lý</option>

                        <option value="PROCESSING">Đang xử lý</option>

                        <option value="COMPLETED">Hoàn thành</option>

                        <option value="CANCELLED">Hủy</option>
                      </select>
                    </div>
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
