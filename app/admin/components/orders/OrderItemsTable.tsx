"use client";

import { OrderItem } from "./types";

interface Props {
  items: OrderItem[];
}

export default function OrderItemsTable({
  items
}: Props) {

  return (
    <div className="border rounded-xl overflow-hidden">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-4 py-3 text-left">
              Mã SP
            </th>

            <th className="px-4 py-3 text-left">
              Tên sản phẩm
            </th>

            <th className="px-4 py-3 text-left">
              Số lượng
            </th>

            <th className="px-4 py-3 text-left">
              Đơn giá
            </th>

            <th className="px-4 py-3 text-left">
              Thành tiền
            </th>

          </tr>

        </thead>


        <tbody>

        {
          items.length === 0 ? (

            <tr>

              <td
                colSpan={5}
                className="text-center py-5 text-gray-500"
              >
                Không có sản phẩm
              </td>

            </tr>

          ) : (

            items.map(item => (

              <tr
                key={item.ITEM_ID}
                className="border-t"
              >

                <td className="px-4 py-3">
                  {item.MASP}
                </td>


                <td className="px-4 py-3">
                  {item.TENSP}
                </td>


                <td className="px-4 py-3">
                  {item.SOLUONG}
                </td>


                <td className="px-4 py-3">

                  ₫
                  {item.PRICE.toLocaleString(
                    "vi-VN"
                  )}

                </td>


                <td className="px-4 py-3 font-semibold">

                  ₫
                  {/* {item.TOTAL.toLocaleString(
                    "vi-VN"
                  )} */}

                </td>


              </tr>

            ))

          )
        }

        </tbody>


      </table>

    </div>
  );
}