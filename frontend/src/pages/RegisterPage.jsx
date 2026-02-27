import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
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
      {/* Register card */}
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

          <h1 className="text-[28px] font-bold text-white text-center tracking-tight mb-8 relative z-10">Register</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-5 text-sm text-center relative z-10">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-transparent border-b border-blue-500/30 px-2 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 transition-all duration-300 pr-10"
                  placeholder="Enter your full name"
                />
                <div className="absolute right-3 top-3.5 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-transparent border-b border-blue-500/30 px-2 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 transition-all duration-300 pr-10"
                  placeholder="At least 6 characters"
                />
                <div className="absolute right-3 top-3.5 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Phone <span className="text-blue-200/50 font-normal">(optional)</span></label>
              <div className="relative group">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-transparent border-b border-blue-500/30 px-2 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 transition-all duration-300 pr-10"
                  placeholder="Enter your phone number"
                />
                <div className="absolute right-3 top-3.5 text-blue-400 group-focus-within:text-blue-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 disabled:opacity-60 mt-4 shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/50 mt-6 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
