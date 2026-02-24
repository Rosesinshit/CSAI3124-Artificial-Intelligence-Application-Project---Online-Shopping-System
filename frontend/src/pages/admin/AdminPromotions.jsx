import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', type: 'percentage', discount_value: '', min_purchase: '0',
    start_date: '', end_date: '', product_ids: []
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/promotions/admin/all?page=${page}&limit=20`);
      setPromotions(res.data.data);
      setMeta(res.data.meta || {});
    } catch (err) {
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products?limit=100');
      setProducts(res.data.data);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_purchase: parseFloat(form.min_purchase) || 0,
        product_ids: form.product_ids.map(Number),
      };

      if (editingPromo) {
        await api.put(`/promotions/admin/${editingPromo.promotion_id}`, payload);
        setSuccess('Promotion updated successfully');
      } else {
        await api.post('/promotions/admin', payload);
        setSuccess('Promotion created successfully');
      }

      setShowForm(false);
      setEditingPromo(null);
      resetForm();
      fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save promotion');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      name: promo.name,
      type: promo.type,
      discount_value: promo.discount_value?.toString() || '',
      min_purchase: promo.min_purchase?.toString() || '0',
      start_date: promo.start_date?.split('T')[0] || '',
      end_date: promo.end_date?.split('T')[0] || '',
      product_ids: [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promotion?')) return;
    try {
      await api.delete(`/promotions/admin/${id}`);
      fetchPromotions();
      setSuccess('Promotion deleted');
    } catch (err) {
      setError('Failed to delete promotion');
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await api.put(`/promotions/admin/${promo.promotion_id}`, { is_active: !promo.is_active });
      fetchPromotions();
    } catch (err) {
      setError('Failed to update promotion');
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'percentage', discount_value: '', min_purchase: '0', start_date: '', end_date: '', product_ids: [] });
  };

  const toggleProductInPromo = (productId) => {
    setForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    if (!promo.is_active) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-apple-gray">
        <span className="w-1.5 h-1.5 rounded-full bg-apple-gray-3" />Inactive
      </span>
    );
    if (now < start) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-apple-orange">
        <span className="w-1.5 h-1.5 rounded-full bg-apple-orange" />Scheduled
      </span>
    );
    if (now > end) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-apple-red">
        <span className="w-1.5 h-1.5 rounded-full bg-apple-red" />Expired
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-apple-green">
        <span className="w-1.5 h-1.5 rounded-full bg-apple-green" />Active
      </span>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="shimmer w-6 h-6 rounded-full" />
    </div>
  );

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading !mb-0">Promotion Management</h1>
        <div className="flex gap-2 items-center">
          <Link to="/admin" className="text-apple-gray text-xs hover:text-apple-dark inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </Link>
          <button
            onClick={() => { setShowForm(true); setEditingPromo(null); resetForm(); }}
            className="btn-apple btn-apple-primary text-xs"
          >
            + New Promotion
          </button>
        </div>
      </div>

      {error && <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-2xl mb-4 text-xs">{error}</div>}
      {success && <div className="bg-apple-green/5 border border-apple-green/10 text-apple-green p-3 rounded-2xl mb-4 text-xs">{success}</div>}

      {/* Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-heavy rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <h2 className="text-base font-semibold text-apple-dark tracking-tight mb-4">{editingPromo ? 'Edit Promotion' : 'Create New Promotion'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-apple-gray mb-1">Promotion Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-apple-gray mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="glass-input !w-auto w-full"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                    <option value="special_price">Special Price</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-apple-gray mb-1">
                    {form.type === 'percentage' ? 'Discount (%)' : form.type === 'fixed' ? 'Discount ($)' : 'Special Price ($)'}
                  </label>
                  <input
                    type="number" step="0.01" min="0" required value={form.discount_value}
                    onChange={e => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-apple-gray mb-1">Start Date</label>
                  <input
                    type="date" required value={form.start_date}
                    onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-apple-gray mb-1">End Date</label>
                  <input
                    type="date" required value={form.end_date}
                    onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-apple-gray mb-1">Min Purchase ($)</label>
                <input
                  type="number" step="0.01" min="0" value={form.min_purchase}
                  onChange={e => setForm(prev => ({ ...prev, min_purchase: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-apple-gray mb-2">
                  Apply to Products ({form.product_ids.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto glass-light rounded-xl p-2 space-y-0.5">
                  {products.map(p => (
                    <label key={p.product_id} className="flex items-center gap-2 p-1.5 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={form.product_ids.includes(p.product_id)}
                        onChange={() => toggleProductInPromo(p.product_id)}
                        className="rounded text-apple-blue w-3 h-3"
                      />
                      <span className="text-xs text-apple-dark">{p.name} - ${parseFloat(p.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => { setShowForm(false); setEditingPromo(null); }}
                  className="btn-apple btn-apple-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-apple btn-apple-primary text-xs">
                  {editingPromo ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-apple-gray-4/50 text-left text-apple-gray">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promo => (
                <tr key={promo.promotion_id} className="border-b border-apple-gray-4/30 last:border-b-0 hover:bg-white/40 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-apple-dark">{promo.name}</td>
                  <td className="px-4 py-2.5 text-apple-gray capitalize">{promo.type.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-apple-dark">
                    {promo.type === 'percentage' ? `${promo.discount_value}%` : `$${parseFloat(promo.discount_value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-2.5 text-apple-gray">
                    {new Date(promo.start_date).toLocaleDateString()} – {new Date(promo.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-apple-gray">{promo.product_count || 0}</td>
                  <td className="px-4 py-2.5">{getStatusBadge(promo)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2.5">
                      <button onClick={() => handleEdit(promo)}
                        className="text-apple-blue hover:underline font-medium">Edit</button>
                      <button onClick={() => handleToggleActive(promo)}
                        className="text-apple-orange hover:underline font-medium">
                        {promo.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(promo.promotion_id)}
                        className="text-apple-red hover:underline font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-apple-gray">No promotions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
