import { Product } from "@/lib/api";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (masp: string) => void;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Ảnh</th>
              <th className="px-4 py-3 text-left">Mã SP</th>
              <th className="px-4 py-3 text-left">Tên sản phẩm</th>
              <th className="px-4 py-3 text-left">Giá</th>
              <th className="px-4 py-3 text-left">Tồn kho</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Không có sản phẩm nào
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.MASP}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <img
                      src={product.IMAGE_URL || "/images/no-image.png"}
                      alt={product.TENSP}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {product.MASP}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {product.TENSP}
                    </div>

                    <div className="text-sm text-gray-500 line-clamp-2">
                      {product.DESCRIPTION || "Không có mô tả"}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-bold text-red-600">
                    {product.GIABAN.toLocaleString("vi-VN")} ₫
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.SOLUONGTON > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.SOLUONGTON}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => onDelete(product.MASP)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Xóa
                      </button>
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