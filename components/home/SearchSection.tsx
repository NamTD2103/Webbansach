"use client";

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  searchSuggestions: string[];
  setSearchSuggestions: (value: string[]) => void;

  onSearch: (e: React.FormEvent) => void;
  onSuggestionClick: (value: string) => void;
}

const SUGGESTIONS = [
  "React",
  "NodeJS",
  "Java",
  "Python",
  "Kinh doanh",
  "Marketing",
  "Tiểu thuyết",
  "Tâm lý",
  "Tiếng Anh",
  "Thiếu nhi",
];

export default function SearchSection({
  searchQuery,
  setSearchQuery,
  searchSuggestions,
  setSearchSuggestions,
  onSearch,
  onSuggestionClick,
}: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
      <form
        onSubmit={onSearch}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;

              setSearchQuery(value);

              const result = SUGGESTIONS.filter((item) =>
                item.toLowerCase().includes(value.toLowerCase())
              ).slice(0, 6);

              setSearchSuggestions(value ? result : []);
            }}
            placeholder="🔍 Tìm tên sách, tác giả..."
            className="w-full h-16 rounded-2xl border-2 border-gray-200 px-6 text-lg focus:border-red-500 outline-none"
          />

          {searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
              {searchSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSuggestionClick(item)}
                  className="block w-full text-left px-6 py-4 hover:bg-red-50"
                >
                  🔍 {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="h-16 px-10 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:scale-105 duration-300"
        >
          Tìm kiếm
        </button>
      </form>
    </div>
  );
}