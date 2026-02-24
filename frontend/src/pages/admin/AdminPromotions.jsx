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
    if (!promo.is_active) return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Inactive</span>;
    if (now < start) return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Scheduled</span>;
    if (now > end) return <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Expired</span>;
    return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</span>;
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Promotion Management</h1>
        <div className="flex gap-3">
          <Link to="/admin" className="text-gray-600 hover:text-gray-800 font-medium">← Back to Dashboard</Link>
          <button
            onClick={() => { setShowForm(true); setEditingPromo(null); resetForm(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Promotion
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">{success}</div>}

      {/* Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingPromo ? 'Edit Promotion' : 'Create New Promotion'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                    <option value="special_price">Special Price</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === 'percentage' ? 'Discount (%)' : form.type === 'fixed' ? 'Discount ($)' : 'Special Price ($)'}
                  </label>
                  <input
                    type="number" step="0.01" min="0" required value={form.discount_value}
                    onChange={e => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date" required value={form.start_date}
                    onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date" required value={form.end_date}
                    onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase ($)</label>
                <input
                  type="number" step="0.01" min="0" value={form.min_purchase}
                  onChange={e => setForm(prev => ({ ...prev, min_purchase: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply to Products ({form.product_ids.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {products.map(p => (
                    <label key={p.product_id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.product_ids.includes(p.product_id)}
                        onChange={() => toggleProductInPromo(p.product_id)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">{p.name} - ${parseFloat(p.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingPromo(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingPromo ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Discount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Products</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {promotions.map(promo => (
              <tr key={promo.promotion_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{promo.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{promo.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {promo.type === 'percentage' ? `${promo.discount_value}%` : `$${parseFloat(promo.discount_value).toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{promo.product_count || 0}</td>
                <td className="px-4 py-3">{getStatusBadge(promo)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleToggleActive(promo)}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                      {promo.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleDelete(promo.promotion_id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No promotions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
