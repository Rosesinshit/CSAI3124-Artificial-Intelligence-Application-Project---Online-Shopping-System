import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', sku: '', price: '', sale_price: '', stock_quantity: '0',
    short_description: '', description: '', category_id: '',
    meta_title: '', meta_description: '', meta_keywords: '',
  });
  const [tags, setTags] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/categories').then(res => setCategories(res.data.data)).catch(() => {});

    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name || '', sku: p.sku || '', price: p.price || '',
          sale_price: p.sale_price || '', stock_quantity: p.stock_quantity || '0',
          short_description: p.short_description || '', description: p.description || '',
          category_id: p.category_id || '',
          meta_title: p.meta_title || '', meta_description: p.meta_description || '',
          meta_keywords: p.meta_keywords || '',
        });
        setTags(p.tags?.map(t => t.name).join(', ') || '');
        setAttributes(p.attributes?.map(a => ({
          name: a.attribute_name, value: a.attribute_value, is_html: a.is_html
        })) || []);
        setExistingImages(p.images || []);
      }).catch(() => setError('Product not found'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: parseInt(form.stock_quantity),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        attributes: attributes.filter(a => a.name && a.value),
      };

      let productId;
      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
        productId = id;
      } else {
        const res = await api.post('/admin/products', payload);
        productId = res.data.data.product_id;
      }

      // Upload new images (B1)
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        await api.post(`/admin/products/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = () => setAttributes([...attributes, { name: '', value: '', is_html: false }]);
  const removeAttribute = (idx) => setAttributes(attributes.filter((_, i) => i !== idx));
  const updateAttribute = (idx, field, val) => {
    const updated = [...attributes];
    updated[idx][field] = val;
    setAttributes(updated);
  };

  const deleteImage = async (imageId) => {
    try {
      await api.delete(`/admin/products/${id}/images/${imageId}`);
      setExistingImages(existingImages.filter(img => img.image_id !== imageId));
    } catch (err) {
      alert('Failed to delete image');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin/products" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to Products</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
              <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description (HTML supported)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="gaming, laptop, premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Product Images (B1) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Product Images</h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {existingImages.map((img) => (
                <div key={img.image_id} className="relative">
                  <img src={img.image_url} alt={img.alt_text} className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96?text=Img'; }} />
                  <button type="button" onClick={() => deleteImage(img.image_id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600">
                    ×
                  </button>
                  {img.is_primary && (
                    <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5 rounded-b-lg">Primary</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <input type="file" multiple accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <p className="text-xs text-gray-400 mt-1">Upload up to 10 images (JPEG, PNG, GIF, WebP). Max 5MB each.</p>
        </div>

        {/* Product Attributes (C1, C5) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Product Attributes</h2>
            <button type="button" onClick={addAttribute} className="text-blue-600 hover:underline text-sm">+ Add Attribute</button>
          </div>

          {attributes.length === 0 ? (
            <p className="text-gray-400 text-sm">No attributes. Click "Add Attribute" to add specifications.</p>
          ) : (
            <div className="space-y-3">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <input type="text" placeholder="Name (e.g. Brand)" value={attr.name}
                    onChange={(e) => updateAttribute(idx, 'name', e.target.value)}
                    className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <textarea placeholder="Value" value={attr.value}
                    onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                    rows={1} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input type="checkbox" checked={attr.is_html}
                      onChange={(e) => updateAttribute(idx, 'is_html', e.target.checked)} />
                    HTML
                  </label>
                  <button type="button" onClick={() => removeAttribute(idx)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input type="text" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
              <input type="text" value={form.meta_keywords} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <Link to="/admin/products" className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
