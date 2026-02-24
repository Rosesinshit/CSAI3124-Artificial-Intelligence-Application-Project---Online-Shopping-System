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
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead
        title="Promotions & Deals | ShopOnline"
        description="Discover amazing deals and promotional offers at ShopOnline"
        canonical={`${window.location.origin}/promotions`}
      />

      <h1 className="text-3xl font-bold text-gray-800 mb-6">🏷️ Promotions & Deals</h1>

      {promotions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No active promotions right now</p>
          <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium">
            Browse All Products →
          </Link>
        </div>
      ) : (
        <>
          {/* Promotion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {promotions.map(promo => (
              <button
                key={promo.promotion_id}
                onClick={() => setSelectedPromo(promo)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedPromo?.promotion_id === promo.promotion_id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
                }`}
              >
                <h3 className="font-semibold text-gray-800">{promo.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-0.5 rounded-full font-medium">
                    {promo.type === 'percentage' ? `${promo.discount_value}% OFF` :
                     promo.type === 'fixed' ? `$${parseFloat(promo.discount_value).toFixed(2)} OFF` :
                     `From $${parseFloat(promo.discount_value).toFixed(2)}`}
                  </span>
                  <span className="text-xs text-gray-500">{promo.product_count} products</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Ends: {new Date(promo.end_date).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>

          {/* Products in Selected Promotion */}
          {selectedPromo && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {selectedPromo.name}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({products.length} products)
                </span>
              </h2>
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products in this promotion</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map(product => (
                    <div key={product.product_id} className="relative">
                      {product.promotional_price && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          {product.promotion_name || 'PROMO'}
                        </div>
                      )}
                      <ProductCard 
                        product={{
                          ...product,
                          sale_price: product.promotional_price || product.sale_price,
                        }} 
                      />
                    </div>
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
