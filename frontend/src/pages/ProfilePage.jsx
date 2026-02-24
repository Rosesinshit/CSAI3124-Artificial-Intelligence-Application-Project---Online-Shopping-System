import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    shipping_address: user?.shipping_address || '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="section-heading">My Profile</h1>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
        {success && <div className="bg-apple-green/5 border border-apple-green/10 text-apple-green p-3 rounded-xl text-sm">{success}</div>}
        {error && <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-xl text-sm">{error}</div>}

        <div>
          <label className="block text-xs font-medium text-apple-gray mb-1.5">Email</label>
          <input type="email" value={user?.email || ''} disabled className="glass-input !bg-apple-gray-5/50 text-apple-gray cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-medium text-apple-gray mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="glass-input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-apple-gray mb-1.5">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="glass-input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-apple-gray mb-1.5">Shipping Address</label>
          <textarea
            value={form.shipping_address}
            onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
            rows={3}
            className="glass-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-apple btn-apple-primary text-sm"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
