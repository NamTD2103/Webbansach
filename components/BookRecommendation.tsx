import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RecommendationBook {
  masp?: string;
  recId?: string | number;
  tensp?: string;
  author?: string;
  rating?: number;
  difficulty?: string;
  giaban?: number;
  price?: number;
  reason?: string;
  hinhanh?: string;
}

interface BookRecommendationCardProps {
  book: RecommendationBook;
  onFeedback?: (recId: string | number | undefined, feedbackType: string) => void;
  onViewDetails?: (book: RecommendationBook) => void;
}

/**
 * BookRecommendationCard
 * Displays individual book recommendation with feedback option
 */
const BookRecommendationCard = ({ book, onFeedback, onViewDetails }: BookRecommendationCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Book Image */}
        <div className="flex-shrink-0 w-20 h-28">
          <img
            src={book.hinhanh || '/placeholder-book.jpg'}
            alt={book.tensp}
            className="w-full h-full object-cover rounded"
          />
        </div>

        {/* Book Info */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2">
            {book.tensp}
          </h3>

          <p className="text-sm text-gray-600">
            {book.author || 'Tác giả chưa xác định'}
          </p>

          {/* Rating */}
          {book.rating && (
            <div className="flex items-center gap-1 my-2">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm font-semibold">{book.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">/5</span>
            </div>
          )}

          {/* Difficulty Badge */}
          {book.difficulty && (
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              book.difficulty === 'DỄ' ? 'bg-green-100 text-green-800' :
              book.difficulty === 'TRUNG_BÌNH' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {book.difficulty === 'DỄ' ? '📘 Dễ' :
               book.difficulty === 'TRUNG_BÌNH' ? '📙 Trung bình' :
               '📕 Nâng cao'}
            </span>
          )}

          {/* Price & Reason */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {(book.giaban || book.price)?.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-xs text-gray-500 italic">
              {book.reason || 'Được đề xuất cho bạn'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onViewDetails?.(book)}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => onFeedback?.(book.recId, 'HELPFUL')}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition"
              title="Hữu ích"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback?.(book.recId, 'NOT_HELPFUL')}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition"
              title="Không hữu ích"
            >
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * BookRecommendationWidget
 * Complete recommendation widget for chatbot UI
 */
export const BookRecommendationWidget = ({ userId, onSelectBook }: { userId?: string | number; onSelectBook?: (book: RecommendationBook) => void }) => {
  const [recommendations, setRecommendations] = useState<RecommendationBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL'); // ALL, TRENDING, SIMILAR, CATEGORY

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/recommendations/${userId}`, {
        params: { limit: 5 }
      });

      if (response.data.success) {
        setRecommendations(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Không thể tải gợi ý sách');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recId: string | number | undefined, feedbackType: string) => {
    if (!userId) return;

    try {
      await axios.post(`/api/recommendations/${userId}/feedback`, {
        recId,
        feedbackType,
      });

      // Reload recommendations
      loadRecommendations();
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleViewDetails = (book: RecommendationBook) => {
    // Track interaction
    if (userId) {
      axios.post(`/api/recommendations/${userId}/track-interaction`, {
        masp: book.masp,
        interactionType: 'VIEWED',
      }).catch(err => console.error('Error tracking interaction:', err));
    }

    // Callback
    onSelectBook?.(book);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-2 text-gray-600">Đang tải gợi ý...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600">Không có gợi ý nào lúc này</p>
        <button
          onClick={loadRecommendations}
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-4">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <span className="text-2xl">📚</span>
        Gợi ý sách cho bạn
      </h3>

      {/* Recommendations List */}
      <div className="space-y-2">
        {recommendations.map((book) => (
          <BookRecommendationCard
            key={book.masp}
            book={book}
            onFeedback={handleFeedback}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadRecommendations}
        className="w-full mt-4 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded transition"
      >
        🔄 Tải gợi ý khác
      </button>
    </div>
  );
};

/**
 * InlineRecommendation
 * Compact recommendation for inline display in chat
 */
export const InlineRecommendation = ({ book, onSelect }: { book: RecommendationBook; onSelect?: (book: RecommendationBook) => void }) => {
  return (
    <div
      onClick={() => onSelect?.(book)}
      className="inline-block bg-blue-50 border-l-4 border-blue-500 p-3 rounded cursor-pointer hover:bg-blue-100 transition"
    >
      <div className="flex items-center gap-2">
        <img
          src={book.hinhanh || '/placeholder-book.jpg'}
          alt={book.tensp}
          className="w-12 h-16 object-cover rounded"
        />
        <div className="flex-grow">
          <p className="font-bold text-sm line-clamp-1">{book.tensp}</p>
          <p className="text-xs text-gray-600">{book.author}</p>
          <p className="text-sm font-bold text-blue-600 mt-1">
            {book.giaban?.toLocaleString('vi-VN')}₫
          </p>
        </div>
        <span className="text-xl">➜</span>
      </div>
    </div>
  );
};

/**
 * RecommendationPreferences
 * Component for user to set preferences
 */
export const RecommendationPreferences = ({ userId, onSave }: { userId?: string | number; onSave?: () => void }) => {
  const [preferences, setPreferences] = useState<{
    favoriteCategories: Array<{ category: string; weight: number }>;
    favoriteAuthors: string[];
    preferredDifficulty: string;
    readingMotivation: string;
    priceRange: { min: number; max: number };
  }>({
    favoriteCategories: [],
    favoriteAuthors: [],
    preferredDifficulty: 'TRUNG_BÌNH',
    readingMotivation: 'LEARNING',
    priceRange: { min: 0, max: 500000 },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`/api/recommendations/${userId}/preferences`);
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await axios.put(`/api/recommendations/${userId}/preferences`, preferences);
      onSave?.();
      alert('Sở thích đã được cập nhật!');
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Lỗi khi lưu sở thích');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Kinh doanh',
    'Kĩ năng',
    'Công nghệ',
    'Self-help',
    'Tiểu thuyết',
    'Tâm lý',
    'Lịch sử',
    'Giáo dục',
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md">
      <h2 className="text-2xl font-bold mb-6">Sở thích đọc sách của bạn</h2>

      {/* Categories */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Thể loại yêu thích</label>
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                const cats = preferences.favoriteCategories;
                if (cats.some(c => c.category === cat)) {
                  setPreferences({
                    ...preferences,
                    favoriteCategories: cats.filter(c => c.category !== cat),
                  });
                } else {
                  setPreferences({
                    ...preferences,
                    favoriteCategories: [...cats, { category: cat, weight: 1 }],
                  });
                }
              }}
              className={`px-3 py-2 rounded text-sm font-semibold transition ${
                preferences.favoriteCategories.some(c => c.category === cat)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Độ khó</label>
        <select
          value={preferences.preferredDifficulty}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              preferredDifficulty: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="DỄ">Dễ</option>
          <option value="TRUNG_BÌNH">Trung bình</option>
          <option value="NÂNG_CAO">Nâng cao</option>
          <option value="MIXED">Hỗn hợp</option>
        </select>
      </div>

      {/* Motivation */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Mục đích đọc</label>
        <select
          value={preferences.readingMotivation}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              readingMotivation: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="LEARNING">Học tập</option>
          <option value="ENTERTAINMENT">Giải trí</option>
          <option value="PERSONAL_GROWTH">Phát triển bản thân</option>
          <option value="MIXED">Hỗn hợp</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Khoảng giá</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={preferences.priceRange.min}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                priceRange: {
                  ...preferences.priceRange,
                  min: parseInt(e.target.value),
                },
              })
            }
            placeholder="Tối thiểu"
            className="flex-1 px-3 py-2 border rounded"
          />
          <span className="self-center">-</span>
          <input
            type="number"
            value={preferences.priceRange.max}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                priceRange: {
                  ...preferences.priceRange,
                  max: parseInt(e.target.value),
                },
              })
            }
            placeholder="Tối đa"
            className="flex-1 px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold rounded transition"
      >
        {loading ? '🔄 Đang lưu...' : '💾 Lưu sở thích'}
      </button>
    </div>
  );
};

export default BookRecommendationWidget;
