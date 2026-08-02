"use client";

import { useMemo, useState } from "react";

import OrderStats from "./OrderStats";
import OrderFilters from "./OrderFilters";
import OrderTable from "./OrderTable";
import OrderDetailModal from "./OrderDetailModal";
import { adminAPI } from "@/lib/api";

import { Order } from "./types";

interface OrderSectionProps {
  orders: Order[];

  loading: boolean;

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

  totalFilteredAmount: number;

  handleResetFilter: () => void;

  fetchOrders: () => Promise<void>;

  showToast: (message: string, type: "success" | "error") => void;
}

export default function OrderSection(props: OrderSectionProps) {
  const {
    orders,
    loading,

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

    totalFilteredAmount,

    handleResetFilter,

    fetchOrders,

    showToast,
  } = props;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleViewDetail = async (order: Order) => {
    try {
      const detail = await adminAPI.getOrderDetail(order.ORDER_ID);

      setSelectedOrder({
        ...order,

        ITEMS: detail.items || [],
      });
    } catch (error) {
      console.error("DETAIL ORDER ERROR", error);
    }
  };

  const filteredOrders = useMemo(() => {
    let data = [...orders];

    if (searchKeyword) {
      const key = searchKeyword.toLowerCase();

      data = data.filter(
        (o) =>
          o.ORDER_ID.toString().includes(key) ||
          o.USERNAME?.toLowerCase().includes(key) ||
          o.FULLNAME?.toLowerCase().includes(key),
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((o) => o.STATUS === statusFilter);
    }

    if (paymentFilter !== "ALL") {
      data = data.filter((o) => o.PAYMENT_METHOD === paymentFilter);
    }

    return data;
  }, [orders, searchKeyword, statusFilter, paymentFilter]);

  return (
    <>
      <OrderStats orders={filteredOrders} />

      <OrderFilters
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalAmount={totalFilteredAmount}
        onReset={handleResetFilter}
      />

      <OrderTable
        orders={filteredOrders}
        loading={loading}
        fetchOrders={fetchOrders}
        showToast={showToast}
        onViewDetail={handleViewDetail}
      />

      <OrderDetailModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}
