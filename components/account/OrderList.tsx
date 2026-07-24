"use client";

import Loading from "./Loading";
import EmptyOrders from "./EmptyOrders";
import OrderCard from "./OrderCard";

interface Order {
  ORDER_ID: number;
  USER_ID: number;
  STATUS: string;
  TOTAL_AMOUNT: number;
  ORDER_DATE: string;
  items?: any[];
}

interface Props {
  orders: Order[];
  loading: boolean;

  onDetail?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onReorder?: (order: Order) => void;
  onRepay?: (order: Order) => void;
  onInvoice?: (order: Order) => void;
}

export default function OrderList({
  orders,
  loading,
  onDetail,
  onCancel,
  onReorder,
  onRepay,
  onInvoice,
}: Props) {
  if (loading) {
    return (
      <section className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              📦 Lịch sử đơn hàng
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Theo dõi tất cả đơn hàng của bạn
            </p>
          </div>

          <div className="bg-white shadow px-5 py-2 rounded-full font-bold text-red-500">
            ...
          </div>
        </div>

        <div className="p-8">
          <Loading />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            📦 Lịch sử đơn hàng
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tất cả đơn hàng của bạn
          </p>
        </div>

        <div className="bg-white shadow px-5 py-2 rounded-full font-bold text-red-500">
          {orders.length} đơn
        </div>
      </div>

      {/* Body */}
      <div className="p-8">
        {orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.ORDER_ID}
                order={order}
                onDetail={onDetail}
                onCancel={onCancel}
                onReorder={onReorder}
                onRepay={onRepay}
                onInvoice={onInvoice}

              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
