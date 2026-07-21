'use client';

import { useState } from 'react';
import axios from 'axios';

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    setMessage(null);

    if (!formData.email || !formData.username || !formData.password) {
      setError('Email, username, and password are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiBaseUrl}/auth/register`, {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
      });

      if (response.data.success) {
        setMessage('Registration successful! You can now login to your account.');
        setFormData({
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          phone: '',
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      
      if (errorData?.errors) {
        setErrors(errorData.errors);
      }
      
      const errorMessage = errorData?.message || 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiBaseUrl}/auth/verify-email`, {
        userId,
        verificationCode,
      });

      if (response.data.success) {
        setMessage('Email verified successfully! You can now login.');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiBaseUrl}/auth/resend-verification`, {
        email: formData.email,
      });

      if (response.data.success) {
        setMessage('Verification code resent. Check your email.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verification') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <p className="font-semibold">📧 Check your email!</p>
          <p className="text-sm mt-1">We've sent a verification code to <strong>{formData.email}</strong></p>
        </div>

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

        <form onSubmit={handleVerifyEmail} className="space-y-3">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your email</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition"
          >
            {loading ? '⏳ Verifying...' : '✓ Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:bg-gray-100 transition"
          >
            📨 Resend Code
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Code expires in 24 hours
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <p className="font-semibold">❌ {error}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleFormChange}
          placeholder="your@email.com"
          disabled={loading}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleFormChange}
          placeholder="your_username"
          disabled={loading}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        {errors.username && <p className="text-red-600 text-xs mt-1">{errors.username}</p>}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleFormChange}
          placeholder="Your Full Name"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleFormChange}
          placeholder="0123456789"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleFormChange}
          placeholder="••••••••"
          disabled={loading}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        {errors.password && Array.isArray(errors.password) && (
          <ul className="text-red-600 text-xs mt-1 list-disc list-inside">
            {errors.password.map((err: string, idx: number) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-1">At least 8 characters with uppercase, lowercase, and numbers</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleFormChange}
          placeholder="••••••••"
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? '⏳ Creating account...' : '✓ Create Account'}
      </button>

      {/* Password Requirements */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
        <p className="font-semibold">🔒 Password Requirements:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Minimum 8 characters</li>
          <li>At least one uppercase letter (A-Z)</li>
          <li>At least one lowercase letter (a-z)</li>
          <li>At least one number (0-9)</li>
        </ul>
      </div>
    </form>
  );
}
