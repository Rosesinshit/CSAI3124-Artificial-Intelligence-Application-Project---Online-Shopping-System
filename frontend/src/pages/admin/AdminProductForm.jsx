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
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <Link to="/admin/products" className="text-apple-blue text-xs hover:underline mb-4 inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Products
      </Link>
      <h1 className="section-heading mb-5">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      {error && <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-2xl mb-5 text-xs">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">SKU *</label>
              <input type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Price *</label>
              <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Sale Price</label>
              <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Stock Quantity</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="glass-input !w-auto w-full">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-medium text-apple-gray mb-1">Short Description</label>
            <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              rows={2} className="glass-input !rounded-xl" />
          </div>
          <div className="mt-4">
            <label className="block text-[11px] font-medium text-apple-gray mb-1">Full Description (HTML supported)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5} className="glass-input !rounded-xl" />
          </div>
          <div className="mt-4">
            <label className="block text-[11px] font-medium text-apple-gray mb-1">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="gaming, laptop, premium"
              className="glass-input" />
          </div>
        </div>

        {/* Product Images (B1) */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">Product Images</h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingImages.map((img) => (
                <div key={img.image_id} className="relative group">
                  <img src={img.image_url} alt={img.alt_text} className="w-20 h-20 rounded-xl object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96?text=Img'; }} />
                  <button type="button" onClick={() => deleteImage(img.image_id)}
                    className="absolute -top-1.5 -right-1.5 bg-apple-red text-white w-5 h-5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {img.is_primary && (
                    <span className="absolute bottom-0 left-0 right-0 bg-apple-blue text-white text-[9px] text-center py-0.5 rounded-b-xl">Primary</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <input type="file" multiple accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="block w-full text-xs text-apple-gray file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-apple-blue/10 file:text-apple-blue file:text-xs file:font-medium hover:file:bg-apple-blue/15 transition-colors" />
          <p className="text-[10px] text-apple-gray mt-1.5">Upload up to 10 images (JPEG, PNG, GIF, WebP). Max 5MB each.</p>
        </div>

        {/* Product Attributes (C1, C5) */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-apple-dark tracking-tight">Product Attributes</h2>
            <button type="button" onClick={addAttribute} className="text-apple-blue text-xs hover:underline">+ Add Attribute</button>
          </div>

          {attributes.length === 0 ? (
            <p className="text-apple-gray text-xs">No attributes. Click "Add Attribute" to add specifications.</p>
          ) : (
            <div className="space-y-2.5">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <input type="text" placeholder="Name (e.g. Brand)" value={attr.name}
                    onChange={(e) => updateAttribute(idx, 'name', e.target.value)}
                    className="glass-input !w-auto w-1/4 text-xs" />
                  <textarea placeholder="Value" value={attr.value}
                    onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                    rows={1} className="glass-input !rounded-xl flex-1 text-xs" />
                  <label className="flex items-center gap-1 text-[10px] text-apple-gray whitespace-nowrap pt-2">
                    <input type="checkbox" checked={attr.is_html}
                      onChange={(e) => updateAttribute(idx, 'is_html', e.target.checked)}
                      className="rounded text-apple-blue w-3 h-3" />
                    HTML
                  </label>
                  <button type="button" onClick={() => removeAttribute(idx)} className="text-apple-red hover:text-apple-red/80 pt-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">SEO</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Meta Title</label>
              <input type="text" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                className="glass-input" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Meta Description</label>
              <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                rows={2} className="glass-input !rounded-xl" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-apple-gray mb-1">Meta Keywords</label>
              <input type="text" value={form.meta_keywords} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                className="glass-input" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-apple btn-apple-primary">
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <Link to="/admin/products" className="btn-apple btn-apple-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
