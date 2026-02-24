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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#000]">
      {/* Background product images */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Left phone */}
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-[320px] opacity-60 blur-[1px] -rotate-6 hidden lg:block">
          <img
            src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=640&hei=800&fmt=p-jpg"
            alt=""
            className="w-full h-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        {/* Right display */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[300px] opacity-50 blur-[1px] rotate-3 hidden lg:block">
          <img
            src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-blacktitanium?wid=640&hei=800&fmt=p-jpg"
            alt=""
            className="w-full h-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div
          className="rounded-2xl p-8 border border-[#3b82f6]/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          style={{
            background: 'rgba(30, 30, 35, 0.85)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          <h1 className="text-[26px] font-bold text-white text-center tracking-tight mb-8">Login</h1>

          {error && (
            <div className="bg-apple-red/10 border border-apple-red/20 text-apple-red p-3 rounded-xl mb-5 text-sm text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 pb-2 pr-8 text-sm focus:outline-none focus:border-white/50 transition-colors"
                  placeholder=""
                />
                <svg className="absolute right-0 top-0.5 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 pb-2 pr-8 text-sm focus:outline-none focus:border-white/50 transition-colors"
                  placeholder=""
                />
                <svg className="absolute right-0 top-0.5 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
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
              className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #4a9eff 0%, #2563eb 50%, #7c3aed 100%)',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
              }}
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
