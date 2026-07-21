'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiBaseUrl}/auth/forgot-password`, {
        email,
      });

      if (response.data.success) {
        setMessage('Password reset link sent to your email. Check your inbox.');
        setStep('reset');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to request password reset';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    setMessage(null);

    if (!resetToken || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiBaseUrl}/auth/reset-password`, {
        resetToken,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        setMessage('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          // Redirect to login
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      
      if (errorData?.errors) {
        setErrors(errorData.errors);
      }
      
      const errorMessage = errorData?.message || 'Password reset failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="bg-white rounded-lg shadow-xl p-6">
        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Reset Password</h2>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <p className="font-semibold">❌ {error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                <p className="font-semibold">✓ {message}</p>
              </div>
            )}

            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the email address associated with your account
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-red-500 hover:text-red-700 font-medium">
                  Back to Login
                </Link>
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mt-4">
              <p className="font-semibold">💡 What happens next:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check your email for a reset link</li>
                <li>The link expires in 15 minutes</li>
                <li>Click the link to create a new password</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Password</h2>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <p className="font-semibold">❌ {error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                <p className="font-semibold">✓ {message}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Token (from email)
                </label>
                <input
                  type="text"
                  id="resetToken"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token from email"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Resetting...' : '✓ Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setMessage(null);
                }}
                className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                ← Back
              </button>
            </form>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 mt-4">
              <p className="font-semibold">🔒 Password Requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Minimum 8 characters</li>
                <li>Uppercase and lowercase letters</li>
                <li>At least one number</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
