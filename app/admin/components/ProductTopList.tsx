export default function ProductTopList({ title, data, color }: any) {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="font-bold mb-3">{title}</h3>

      {data.map((p: any) => (
        <div key={p.MASP} className="flex justify-between py-1">
          <span>{p.TENSP}</span>
          <span className={`font-semibold text-${color}-600`}>
            {p.sold}
          </span>
        </div>
      ))}
    </div>
  );
}