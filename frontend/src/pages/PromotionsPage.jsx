import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await api.get('/promotions');
        setPromotions(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedPromo(res.data.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch promotions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (!selectedPromo) {
      setProducts([]);
      return;
    }
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/promotions/${selectedPromo.promotion_id}/products?limit=50`);
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to fetch promotion products:', err);
      }
    };
    fetchProducts();
  }, [selectedPromo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="shimmer w-6 h-6 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <SEOHead
        title="Promotions & Deals | ShopOnline"
        description="Discover amazing deals and promotional offers at ShopOnline"
        canonical={`${window.location.origin}/promotions`}
      />

      <h1 className="section-heading">Promotions & Deals</h1>

      {promotions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-apple-gray text-sm mb-5">No active promotions right now.</p>
          <Link to="/products" className="text-apple-blue text-sm hover:underline inline-flex items-center gap-1">
            Browse All Products
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      ) : (
        <>
          {/* Promotion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {promotions.map(promo => (
              <button
                key={promo.promotion_id}
                onClick={() => setSelectedPromo(promo)}
                className={`glass-card !p-4 text-left transition-all ${
                  selectedPromo?.promotion_id === promo.promotion_id
                    ? '!border-apple-blue/30 ring-1 ring-apple-blue/20'
                    : ''
                }`}
              >
                <h3 className="text-sm font-semibold text-apple-dark tracking-tight">{promo.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-apple-red/10 text-apple-red text-[11px] px-2 py-0.5 rounded-full font-medium">
                    {promo.type === 'percentage' ? `${promo.discount_value}% OFF` :
                     promo.type === 'fixed' ? `$${parseFloat(promo.discount_value).toFixed(2)} OFF` :
                     `From $${parseFloat(promo.discount_value).toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-apple-gray">{promo.product_count} products</span>
                </div>
                <p className="text-[10px] text-apple-gray mt-2">
                  Ends {new Date(promo.end_date).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>

          {/* Products */}
          {selectedPromo && (
            <div>
              <div className="flex items-baseline gap-2 mb-6">
                <h2 className="text-lg font-semibold text-apple-dark tracking-tight">{selectedPromo.name}</h2>
                <span className="text-xs text-apple-gray">{products.length} products</span>
              </div>
              {products.length === 0 ? (
                <p className="text-apple-gray text-sm text-center py-12">No products in this promotion.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map(product => (
                    <ProductCard 
                      key={product.product_id}
                      product={{
                        ...product,
                        sale_price: product.promotional_price || product.sale_price,
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
