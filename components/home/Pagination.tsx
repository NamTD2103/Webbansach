"use client";

interface Props {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  loading,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || loading}
        className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
      >
        ← Trang trước
      </button>

      <div className="flex gap-1">
        {Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        ).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-4 py-2 rounded-xl ${
              pageNum === page
                ? "bg-red-500 text-white"
                : "bg-white border"
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || loading}
        className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
      >
        Trang tiếp →
      </button>
    </div>
  );
}