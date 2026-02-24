import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page')) || 1;
  const q = searchParams.get('q') || '';

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (q) params.set('q', q);

    api.get(`/admin/products?${params}`)
      .then((res) => {
        setProducts(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page, q]);

  const toggleStatus = async (productId, currentStatus) => {
    try {
      await api.put(`/admin/products/${productId}/status`, { is_active: !currentStatus });
      fetchProducts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading !mb-0">Products</h1>
        <Link to="/admin/products/new" className="btn-apple btn-apple-primary text-xs">
          + New Product
        </Link>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: e.target.q.value, page: '1' }); }}
        className="mb-6"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU..."
          className="glass-input !w-auto min-w-[280px]"
        />
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="shimmer w-6 h-6 rounded-full" />
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-apple-gray-4/50 text-left text-apple-gray">
                    <th className="px-4 py-3 font-medium">Image</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.product_id} className="border-b border-apple-gray-4/30 last:border-b-0 hover:bg-white/40 transition-colors">
                      <td className="px-4 py-2.5">
                        <img
                          src={product.primary_image || 'https://via.placeholder.com/40x40?text=No'}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=No'; }}
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-apple-dark">
                        <Link to={`/admin/products/${product.product_id}/edit`} className="text-apple-blue hover:underline">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-apple-gray">{product.sku}</td>
                      <td className="px-4 py-2.5 text-apple-dark">
                        ${parseFloat(product.price).toFixed(2)}
                        {product.sale_price && (
                          <span className="text-apple-red ml-1 text-[10px]">(${parseFloat(product.sale_price).toFixed(2)})</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 ${product.stock_quantity <= 0 ? 'text-apple-red' : product.stock_quantity < 10 ? 'text-apple-orange' : 'text-apple-green'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity <= 0 ? 'bg-apple-red' : product.stock_quantity < 10 ? 'bg-apple-orange' : 'bg-apple-green'}`} />
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => toggleStatus(product.product_id, product.is_active)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                            product.is_active ? 'bg-apple-green/10 text-apple-green' : 'bg-apple-red/10 text-apple-red'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-3">
                          <Link to={`/admin/products/${product.product_id}/edit`} className="text-apple-blue hover:underline">Edit</Link>
                          <button onClick={() => deleteProduct(product.product_id)} className="text-apple-red hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-apple-gray">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })} />
        </>
      )}
    </div>
  );
}
