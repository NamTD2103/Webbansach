import ProductStats from "./ProductStats";
import ProductTopList from "./ProductTopList";
import { useProductAnalytics } from "@/app/admin/hook/useProductAnalytics";

export default function ProductSection({
  products,
  orders,
  orderItems,
  onAdd,
  onEdit,
  onDelete,
}: any) {
  const { bestSelling, slowSelling, total } =
    useProductAnalytics(products, orderItems, orders);

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📦 Quản lý sản phẩm</h2>

        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {/* STATS */}
      <ProductStats
        total={total}
        best={bestSelling[0]}
        slow={slowSelling[0]}
      />

      {/* LIST */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProductTopList
          title="🔥 Top bán chạy"
          data={bestSelling}
          color="green"
        />

        <ProductTopList
          title="🐢 Bán chậm"
          data={slowSelling}
          color="red"
        />
      </div>
    </>
  );
}