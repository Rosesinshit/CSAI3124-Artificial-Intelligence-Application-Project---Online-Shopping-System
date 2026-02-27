import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      navigate(userData.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-24"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1772207771810-41df65a4d4f4?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Login card */}
      <div className="w-full max-w-[420px]">
        <div
          className="rounded-3xl p-8 border border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)] relative overflow-hidden"
          style={{
            background: 'rgba(10, 10, 15, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Glass sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <h1 className="text-[28px] font-bold text-white text-center tracking-tight mb-8 relative z-10">Login</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-5 text-sm text-center relative z-10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-transparent border-b border-blue-500/30 px-2 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 transition-all duration-300 pr-10"
                  placeholder="Enter your email"
                />
                <div className="absolute right-3 top-3.5 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-transparent border-b border-blue-500/30 px-2 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 transition-all duration-300 pr-10"
                  placeholder="Enter your password"
                />
                <div className="absolute right-3 top-3.5 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-3 h-3 rounded border-white/30 bg-transparent accent-apple-blue"
                />
                Remember me
              </label>
              <button type="button" className="text-white/60 hover:text-white/90 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-white bg-apple-blue hover:bg-apple-blue/90 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-white/50 mt-6 text-xs">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
