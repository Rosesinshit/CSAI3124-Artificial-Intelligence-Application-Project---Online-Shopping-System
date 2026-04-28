import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import DOMPurify from 'dompurify';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, getWishlistItemId, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [seoData, setSeoData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [priceAlertSet, setPriceAlertSet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');
    setSeoData(null);
    setRecommendedProducts([]);
    setSelectedImage(0);
    setQuantity(1);
    setAddedToCart(false);

    async function loadProductPage() {
      try {
        const productResponse = await api.get(`/products/${id}`);
        const nextProduct = productResponse.data.data;

        if (cancelled) {
          return;
        }

        setProduct(nextProduct);

        const [recommendationResponse, seoResponse] = await Promise.allSettled([
          api.get(`/recommendations/similar/${nextProduct.product_id}?limit=4`),
          api.get(`/seo/product/${nextProduct.product_id}`),
        ]);

        if (cancelled) {
          return;
        }

        if (recommendationResponse.status === 'fulfilled') {
          setRecommendedProducts(recommendationResponse.value.data.data || []);
        } else {
          setRecommendedProducts([]);
        }

        if (seoResponse.status === 'fulfilled') {
          setSeoData(seoResponse.value.data.data);
        } else {
          setSeoData(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError('Product not found');
          setProduct(null);
          setRecommendedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProductPage();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await addToCart(product.product_id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add to cart');
    }
  };

  // Block U: Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setWishlistLoading(true);
    try {
      if (isInWishlist(product.product_id)) {
        const itemId = getWishlistItemId(product.product_id);
        if (itemId) await removeFromWishlist(itemId);
      } else {
        await addToWishlist(product.product_id);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update wish list');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Block U: Set price alert
  const handleSetPriceAlert = async () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) return;
    try {
      await api.post('/wishlist/price-alerts', {
        product_id: product.product_id,
        target_price: parseFloat(targetPrice),
      });
      setPriceAlertSet(true);
      setShowPriceAlert(false);
      setTimeout(() => setPriceAlertSet(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to set price alert');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="shimmer w-6 h-6 rounded-full" /></div>;
  if (error && !product) return <div className="text-center py-20 text-apple-red text-sm">{error}</div>;
  if (!product) return null;

  const images = product.images || [];
  const primaryImage = images[selectedImage]?.image_url || 'https://via.placeholder.com/600x600?text=No+Image';
  const promoPrice = product.promotional_price;
  const displayPrice = promoPrice || product.sale_price || product.price;
  const hasDiscount = parseFloat(displayPrice) < parseFloat(product.price);
  const inWishlist = user && isInWishlist(product.product_id);

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      {/* Block Y: SEO Head with meta tags, Open Graph, and JSON-LD */}
      {seoData && (
        <SEOHead
          title={seoData.metaTags.title}
          description={seoData.metaTags.description}
          keywords={seoData.metaTags.keywords}
          canonical={seoData.metaTags.canonical}
          ogTitle={seoData.metaTags.ogTitle}
          ogDescription={seoData.metaTags.ogDescription}
          ogImage={seoData.metaTags.ogImage}
          ogUrl={seoData.metaTags.ogUrl}
          ogType={seoData.metaTags.ogType}
          ogSiteName={seoData.metaTags.ogSiteName}
          twitterCard={seoData.metaTags.twitterCard}
          twitterTitle={seoData.metaTags.twitterTitle}
          twitterDescription={seoData.metaTags.twitterDescription}
          twitterImage={seoData.metaTags.twitterImage}
          jsonLd={[seoData.jsonLd, seoData.breadcrumbLd]}
        />
      )}
      {!seoData && product && (
        <SEOHead
          title={`${product.name} | ShopOnline`}
          description={product.short_description || ''}
        />
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-apple-gray mb-8">
        <Link to="/" className="hover:text-apple-blue transition-colors">Home</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <Link to="/products" className="hover:text-apple-blue transition-colors">Products</Link>
        {product.category_name && (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to={`/products?category=${product.category_id}`} className="hover:text-apple-blue transition-colors">
              {product.category_name}
            </Link>
          </>
        )}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-apple-dark">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        {/* Image Gallery */}
        <div>
          <div className="glass rounded-3xl overflow-hidden mb-3">
            <img
              src={primaryImage}
              alt={images[selectedImage]?.alt_text || product.name}
              className="w-full aspect-square object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-1">
              {images.map((img, idx) => (
                <button
                  key={img.image_id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                    idx === selectedImage ? 'opacity-100 ring-2 ring-apple-blue ring-offset-2' : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Img'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-[28px] font-semibold text-apple-dark tracking-tight leading-tight mb-1">{product.name}</h1>
          <p className="text-xs text-apple-gray mb-5">SKU: {product.sku}</p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {product.tags.map((tag) => (
                <Link
                  key={tag.tag_id}
                  to={`/search?tags=${tag.slug}`}
                  className="glass !px-2.5 !py-0.5 !rounded-full text-[10px] text-apple-gray hover:text-apple-blue transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[28px] font-semibold text-apple-dark tracking-tight">${parseFloat(displayPrice).toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-apple-gray line-through">${parseFloat(product.price).toFixed(2)}</span>
                <span className="bg-apple-red/10 text-apple-red px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  {Math.round((1 - parseFloat(displayPrice) / parseFloat(product.price)) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Promotional pricing badge */}
          {product.promotional_price && product.promotion_name && (
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 bg-apple-orange/10 text-apple-orange px-3 py-1 rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                {product.promotion_name}
                {product.promotion_end_date && (
                  <span className="text-[10px] text-apple-orange/70 ml-0.5">
                    (ends {new Date(product.promotion_end_date).toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Stock */}
          <div className="mb-5">
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-apple-green text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-apple-green" />
                In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-apple-red text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-apple-red" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-apple-gray mb-6 leading-relaxed">{product.short_description}</p>
          )}

          {/* Add to Cart */}
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center glass !rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-apple-gray hover:text-apple-dark transition-colors text-sm"
                >
                  −
                </button>
                <span className="px-3 py-2 text-sm font-medium text-apple-dark">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-2 text-apple-gray hover:text-apple-dark transition-colors text-sm"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 btn-apple ${
                  addedToCart ? '!bg-apple-green !text-white' : 'btn-apple-primary'
                } !py-2.5 text-sm`}
              >
                {addedToCart ? (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Added to Bag
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Add to Bag
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Wishlist & Price Alert buttons */}
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`flex items-center gap-1.5 btn-apple ${
                inWishlist
                  ? '!bg-apple-red/10 !text-apple-red !border-apple-red/20'
                  : 'btn-apple-secondary'
              } !py-2 !text-xs`}
            >
              <svg className="w-4 h-4" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              {inWishlist ? 'In Wish List' : 'Add to Wish List'}
            </button>
            <button
              onClick={() => setShowPriceAlert(!showPriceAlert)}
              className="flex items-center gap-1.5 btn-apple btn-apple-secondary !py-2 !text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Price Alert
            </button>
          </div>

          {/* Price Alert Form */}
          {showPriceAlert && (
            <div className="glass rounded-2xl p-4 mb-5">
              <p className="text-xs text-apple-dark mb-2 font-medium">Set a target price to be notified when the price drops</p>
              <div className="flex items-center gap-2">
                <span className="text-apple-gray text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={product.price}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={`Current: $${parseFloat(displayPrice).toFixed(2)}`}
                  className="glass-input flex-1 !py-1.5 !text-xs"
                />
                <button
                  onClick={handleSetPriceAlert}
                  className="btn-apple btn-apple-primary !py-1.5 !px-4 !text-xs"
                >
                  Set Alert
                </button>
              </div>
            </div>
          )}

          {priceAlertSet && (
            <div className="bg-apple-green/10 text-apple-green p-3 rounded-xl text-xs mb-4 inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Price alert set! We'll notify you when the price drops.
            </div>
          )}

          {error && <div className="bg-apple-red/10 text-apple-red p-3 rounded-xl text-xs mb-4">{error}</div>}

          {/* Product Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="border-t border-apple-gray-4/50 pt-5">
              <h3 className="text-sm font-semibold text-apple-dark tracking-tight mb-3">Specifications</h3>
              <div className="space-y-1.5">
                {product.attributes.map((attr) => (
                  <div key={attr.attribute_id} className="flex text-xs">
                    <span className="w-36 text-apple-gray font-medium flex-shrink-0">{attr.attribute_name}</span>
                    {attr.is_html ? (
                      <span
                        className="text-apple-dark"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(attr.attribute_value) }}
                      />
                    ) : (
                      <span className="text-apple-dark">{attr.attribute_value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="glass rounded-2xl p-6 mb-14">
          <h2 className="text-base font-semibold text-apple-dark tracking-tight mb-3">Product Description</h2>
          <div
            className="prose prose-sm max-w-none text-apple-gray [&_a]:text-apple-blue"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
          />
        </div>
      )}

      {/* Block S: Similar recommendations */}
      {recommendedProducts.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="section-heading !mb-1">You May Also Like</h2>
              <p className="text-xs text-apple-gray">Ranked from shared category, tag, shopper behavior, and semantic AI similarity signals.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendedProducts.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                reason={p.recommendation_reason}
                tracking={{
                  actionType: 'CLICK_RECOMMENDATION',
                  metadata: {
                    source: 'product_detail_similar',
                    recommendation_id: p.recommendation_id || null,
                    algorithm_type: p.algorithm_type || null,
                    seed_product_id: product.product_id,
                  },
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
