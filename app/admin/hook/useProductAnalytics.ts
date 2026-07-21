import { useMemo } from "react";

export const useProductAnalytics = (
  products: any[],
  orderItems: any[],
  orders: any[]
) => {
  return useMemo(() => {
    const productSales: Record<string, number> = {};

    orderItems.forEach((item) => {
      const order = orders.find(o => o.ORDER_ID === item.ORDER_ID);

      if (!order || order.STATUS !== "COMPLETED") return;

      productSales[item.MASP] =
        (productSales[item.MASP] || 0) + item.SOLUONG;
    });

    const sortedProducts = products.map(p => ({
      ...p,
      sold: productSales[p.MASP] || 0
    }));

    const bestSelling = [...sortedProducts]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const slowSelling = [...sortedProducts]
      .sort((a, b) => a.sold - b.sold)
      .slice(0, 5);

    return {
      bestSelling,
      slowSelling,
      total: products.length
    };
  }, [products, orderItems, orders]);
};