import StatBox from "./StatBox";
export default function ProductStats({ total, best, slow }: any) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatBox value={total} label="Tổng sản phẩm" color="blue" />
      <StatBox value={best?.sold || 0} label="Bán chạy nhất" color="green" />
      <StatBox value={slow?.sold || 0} label="Bán chậm nhất" color="red" />
    </div>
  );
}