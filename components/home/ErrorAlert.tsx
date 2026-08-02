"use client";

interface Props {
  error: string | null;
  onRetry: () => void;
}

export default function ErrorAlert({
  error,
  onRetry,
}: Props) {
  if (!error) return null;

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>

        <div>
          <h3 className="font-bold text-red-800 text-lg mb-1">
            Loading Lỗi
          </h3>

          <p className="text-red-700">
            {error}
          </p>
        </div>

        <button
          onClick={onRetry}
          className="ml-auto px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}