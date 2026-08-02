interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  let className = "";
  let text = "";

  switch (status) {
    case "COMPLETED":
      className = "bg-green-100 text-green-700";
      text = "Hoàn thành";
      break;

    case "PROCESSING":
      className = "bg-orange-100 text-orange-700";
      text = "Đang xử lý";
      break;

    case "PENDING":
      className = "bg-yellow-100 text-yellow-700";
      text = "Chờ xử lý";
      break;

    default:
      className = "bg-red-100 text-red-700";
      text = "Đã hủy";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {text}
    </span>
  );
}