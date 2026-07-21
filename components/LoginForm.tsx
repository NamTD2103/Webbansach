'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginForm() {
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!formData.emailOrUsername || !formData.password) {
      setError('Email/Username and password are required');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        email: formData.emailOrUsername.includes('@') ? formData.emailOrUsername : undefined,
        username: !formData.emailOrUsername.includes('@') ? formData.emailOrUsername : undefined,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (response.data.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

        // Store user info
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setMessage('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
          if (response.data.user?.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/account');
          }
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <p className="font-semibold">❌ {error}</p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <p className="font-semibold">✓ {message}</p>
        </div>
      )}

      {/* Email or Username */}
      <div>
        <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-1">
          Email or Username
        </label>
        <input
          type="text"
          id="emailOrUsername"
          name="emailOrUsername"
          value={formData.emailOrUsername}
          onChange={handleChange}
          placeholder="your@email.com or username"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 text-red-500 rounded cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-600">Remember me (30 days)</span>
        </label>
        <a href="/forgot-password" className="text-sm text-red-500 hover:text-red-700 font-medium">
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? '⏳ Signing in...' : '👤 Sign In'}
      </button>

      {/* Password Requirements Hint */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-semibold">💡 Tips:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Use your email address or username</li>
          <li>Check your inbox if you forgot your password</li>
          <li>Account will be locked after 5 failed attempts</li>
        </ul>
      </div>
    </form>
  );
}
