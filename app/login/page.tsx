'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Footer from '@/components/Footer';


export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (isLogin) {
        console.log('[LOGIN] Logging in...');
        const response = await authAPI.login(username, password);
        alert('✓ Login successful!');
        
        // Role-based redirect
        const userRole = response.user?.role || 'USER';
        console.log('[AUTH] User role:', userRole);
        
        if (userRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/account');
        }
      } else {
        console.log('[REGISTER] Registering...');
        const response = await authAPI.register(username, password, email, role);
        alert('✓ Registration successful! Logging you in...');
        
        // Auto-login after registration and redirect based on role
        const userRole = response.user?.role || 'USER';
        console.log('[AUTH] New user role:', userRole);
        
        if (userRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/account');
        }
      }
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-red-500">
            📚 THƯ VIỆN SÁCH
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/80">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 font-semibold text-center transition ${
                isLogin
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👤 Đăng nhập
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 font-semibold text-center transition ${
                !isLogin
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✏️ Đăng ký
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-semibold">❌ {error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Email Field (Register only) */}
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {/* Role Selection (Register only) */}
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn vai trò
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition" 
                         style={{ borderColor: role === 'USER' ? '#ef4444' : '#d1d5db' }}>
                    <input
                      type="radio"
                      name="role"
                      value="USER"
                      checked={role === 'USER'}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3">
                      <span className="font-semibold text-gray-700">👤 Khách hàng</span>
                      <p className="text-xs text-gray-500">Duyệt sản phẩm và thực hiện mua sắm</p>
                    </span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                         style={{ borderColor: role === 'ADMIN' ? '#ef4444' : '#d1d5db' }}>
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={role === 'ADMIN'}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3">
                      <span className="font-semibold text-gray-700">🔧 Admin</span>
                      <p className="text-xs text-gray-500">Quản lý sản phẩm và đơn hàng</p>
                    </span>
                  </label>
                </div>
                {role === 'ADMIN' && (
                  <p className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ Tài khoản quản trị viên cần được xác minh trong quá trình đăng ký.
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-orange-600 transition disabled:bg-gray-400 text-lg shadow-lg"
            >
              {loading ? '⏳ Processing...' : isLogin ? 'Login' : 'Register'}
            </button>

            {/* Forgot Password Link (Login only) */}
            {isLogin && (
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-red-500 hover:text-red-700">
                  Quên mật khẩu?
                </a>
              </div>
            )}
          </form>

          {/* Footer Message */}
          <div className="bg-gray-50 px-8 py-6 text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                Bạn chưa có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Đăng ký ở đây
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Đăng nhập ở đây
                </button>
              </>
            )}
          </div>
        </div>


        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-red-500 hover:text-red-700 font-semibold"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
     {/* Footer */}
           <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 mt-24">
             <Footer />
           </footer>
    </div>
  );
}
