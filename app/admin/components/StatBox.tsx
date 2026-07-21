export default function StatBox({ value, label, color }: any) {
  const colorMap: any = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className={`text-3xl font-bold ${colorMap[color]}`}>
        {Number(value).toLocaleString()}
      </div>
      <div>{label}</div>
    </div>
  );
}