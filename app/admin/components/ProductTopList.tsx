interface ProductTop {
  MASP: string;
  TENSP: string;
  sold: number;
}

type Color = "red" | "green" | "blue" | "orange";

interface ProductTopListProps {
  title: string;
  data: ProductTop[];
  color: Color;
}

const colorMap: Record<Color, string> = {
  red: "text-red-600",
  green: "text-green-600",
  blue: "text-blue-600",
  orange: "text-orange-600",
};

export default function ProductTopList({
  title,
  data,
  color,
}: ProductTopListProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="font-bold text-lg mb-4">{title}</h3>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Không có dữ liệu
        </p>
      ) : (
        data.map((p) => (
          <div
            key={p.MASP}
            className="flex justify-between items-center py-2 border-b last:border-b-0"
          >
            <span className="text-gray-700">{p.TENSP}</span>

            <span className={`font-semibold ${colorMap[color]}`}>
              {p.sold}
            </span>
          </div>
        ))
      )}
    </div>
  );
}