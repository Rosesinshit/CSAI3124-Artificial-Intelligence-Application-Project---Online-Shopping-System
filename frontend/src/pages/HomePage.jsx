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
        <div className="shimmer w-6 h-6 rounded-full" />
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
      <section className="bg-[#000] text-white">
        <div className="max-w-[980px] mx-auto px-4 py-20 sm:py-28 text-center">
          <h1 className="text-[40px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight mb-3 animate-fade-in">
            Shop smarter.
          </h1>
          <p className="text-lg sm:text-xl text-white/60 mb-8 animate-slide-up">
            Discover amazing products at great prices.
          </p>
          <Link
            to="/products"
            className="btn-apple btn-apple-primary !px-7 !py-2.5 !text-sm animate-slide-up"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-[980px] mx-auto px-4 py-14">
          <h2 className="section-heading mb-7">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/products?category=${cat.category_id}`}
                className="glass-card !p-4 text-center hover:scale-[1.03] transition-transform duration-200"
              >
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-apple-gray-5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-apple-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <h3 className="text-xs font-medium text-apple-dark tracking-tight">{cat.name}</h3>
                <p className="text-[10px] text-apple-gray mt-0.5">{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="max-w-[980px] mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-heading !mb-0">Latest Products</h2>
          <Link to="/products" className="text-apple-blue text-xs hover:underline inline-flex items-center gap-0.5">
            View All
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-apple-gray py-12 text-sm">No products available yet.</p>
        )}
      </section>
    </div>
  );
}
