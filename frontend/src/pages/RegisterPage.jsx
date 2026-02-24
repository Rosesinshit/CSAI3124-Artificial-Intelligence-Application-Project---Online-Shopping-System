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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="glass rounded-2xl w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-apple-dark text-center tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-apple-gray text-center mb-7">Join ShopOnline today</p>

        {error && (
          <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apple-gray mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apple-gray mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apple-gray mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apple-gray mb-1.5">Phone (optional)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="glass-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-apple btn-apple-primary mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-apple-gray mt-5 text-xs">
          Already have an account?{' '}
          <Link to="/login" className="text-apple-blue hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
