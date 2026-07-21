interface Props {
  open: boolean;
  editData: {
    fullname: string;
    email: string;
  };
  editing: boolean;
  onClose: () => void;
  onChange: (field: "fullname" | "email", value: string) => void;
  onSave: () => void;
}

export default function EditProfileModal({
  open,
  editData,
  editing,
  onClose,
  onChange,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">

          <h2 className="text-2xl font-bold">
            ✏️ Chỉnh sửa hồ sơ
          </h2>

          <p className="text-red-100 mt-1">
            Cập nhật thông tin tài khoản của bạn
          </p>

        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          <div>

            <label className="block mb-2 font-semibold">
              Họ và tên
            </label>

            <input
              value={editData.fullname}
              onChange={(e) =>
                onChange("fullname", e.target.value)
              }
              className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-400 outline-none"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Email
            </label>

            <input
              value={editData.email}
              onChange={(e) =>
                onChange("email", e.target.value)
              }
              className="w-full rounded-xl border p-3 focus:ring-2 focus:ring-red-400 outline-none"
            />

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border hover:bg-gray-100"
          >
            Hủy
          </button>

          <button
            onClick={onSave}
            disabled={editing}
            className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {editing ? "Đang lưu..." : "Lưu thay đổi"}
          </button>

        </div>

      </div>

    </div>
  );
}