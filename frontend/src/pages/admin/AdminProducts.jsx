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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
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
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={product.primary_image || 'https://via.placeholder.com/40x40?text=No'}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=No'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/admin/products/${product.product_id}/edit`} className="text-blue-600 hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3">
                      ${parseFloat(product.price).toFixed(2)}
                      {product.sale_price && (
                        <span className="text-red-500 ml-1 text-xs">(Sale: ${parseFloat(product.sale_price).toFixed(2)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock_quantity <= 0 ? 'text-red-600' : product.stock_quantity < 10 ? 'text-yellow-600' : 'text-green-600'}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(product.product_id, product.is_active)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/products/${product.product_id}/edit`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                        <button onClick={() => deleteProduct(product.product_id)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={(p) => setSearchParams({ ...Object.fromEntries(searchParams), page: p.toString() })} />
        </>
      )}
    </div>
  );
}
