'use client';

import { useState, useEffect } from 'react';

interface User {
  USER_ID: number;
  USERNAME: string;
  EMAIL?: string;
  FULLNAME?: string;
  ROLE: string;
}

interface AccountModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: number, data: { email?: string; fullname?: string; role?: string }) => void;
  loading: boolean;
}

export default function AccountModal({ isOpen, user, onClose, onSave, loading }: AccountModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    fullname: '',
    role: 'USER',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.EMAIL || '',
        fullname: user.FULLNAME || '',
        role: user.ROLE || 'USER',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.USER_ID, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          ✏️ Edit Account: {user.USERNAME}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Type
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USER">👤 Customer</option>
              <option value="ADMIN">🔧 Admin</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
            >
              {loading ? '💾 Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">User ID:</span> {user.USER_ID}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            <span className="font-semibold">Username:</span> {user.USERNAME} (cannot be changed)
          </p>
        </div>
      </div>
    </div>
  );
}
