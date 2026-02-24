import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=8&sort=newest'),
      api.get('/categories'),
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <SEOHead
        title="ShopOnline - Discover Amazing Products at Great Prices"
        description="Shop the latest electronics, clothing, home goods, books and more at competitive prices. Free shipping on orders over $50."
        keywords="online shopping, electronics, clothing, home goods, books, deals"
        ogType="website"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Welcome to ShopOnline</h1>
            <p className="text-xl text-blue-100 mb-8">Discover amazing products at great prices</p>
            <Link
              to="/products"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/products?category=${cat.category_id}`}
                className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">📦</div>
                <h3 className="font-medium text-gray-700 text-sm">{cat.name}</h3>
                <p className="text-xs text-gray-400">{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Latest Products</h2>
          <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium">View All →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-gray-500 py-12">No products available yet.</p>
        )}
      </section>
    </div>
  );
}
