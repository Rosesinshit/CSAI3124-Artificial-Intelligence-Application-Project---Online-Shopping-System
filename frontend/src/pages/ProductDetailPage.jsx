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
  const [relatedProducts, setRelatedProducts] = useState([]);
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
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);
    setAddedToCart(false);

    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/related?limit=4`),
    ]).then(([prodRes, relRes]) => {
      setProduct(prodRes.data.data);
      setRelatedProducts(relRes.data.data);
      // Fetch SEO data (Block Y)
      api.get(`/seo/product/${prodRes.data.data.product_id}`).then(seoRes => {
        setSeoData(seoRes.data.data);
      }).catch(() => {}); // SEO data is optional
    }).catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
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

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;
  if (error && !product) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!product) return null;

  const images = product.images || [];
  const primaryImage = images[selectedImage]?.image_url || 'https://via.placeholder.com/600x600?text=No+Image';
  // Block U: Determine best price (considering promotional pricing)
  const promoPrice = product.promotional_price;
  const displayPrice = promoPrice || product.sale_price || product.price;
  const hasDiscount = parseFloat(displayPrice) < parseFloat(product.price);
  const inWishlist = user && isInWishlist(product.product_id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        {product.category_name && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/products?category=${product.category_id}`} className="hover:text-blue-600">
              {product.category_name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery (B1) */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <img
              src={primaryImage}
              alt={images[selectedImage]?.alt_text || product.name}
              className="w-full aspect-square object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.image_id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === selectedImage ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag) => (
                <Link
                  key={tag.tag_id}
                  to={`/search?tags=${tag.slug}`}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-gray-200"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-blue-600">${parseFloat(displayPrice).toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-400 line-through">${parseFloat(product.price).toFixed(2)}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                  {Math.round((1 - parseFloat(displayPrice) / parseFloat(product.price)) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Block U: Promotional pricing badge */}
          {product.promotional_price && product.promotion_name && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                🏷️ {product.promotion_name}
                {product.promotion_end_date && (
                  <span className="text-xs text-orange-500 ml-1">
                    (ends {new Date(product.promotion_end_date).toLocaleDateString()})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Stock */}
          <div className="mb-6">
            {product.stock_quantity > 0 ? (
              <span className="text-green-600 font-medium">✓ In Stock ({product.stock_quantity} available)</span>
            ) : (
              <span className="text-red-600 font-medium">✗ Out of Stock</span>
            )}
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-gray-600 mb-6">{product.short_description}</p>
          )}

          {/* Add to Cart */}
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
                  addedToCart ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
              </button>
            </div>
          )}

          {/* Block U: Wishlist & Price Alert buttons */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors ${
                inWishlist
                  ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {inWishlist ? '♥ In Wish List' : '♡ Add to Wish List'}
            </button>
            <button
              onClick={() => setShowPriceAlert(!showPriceAlert)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              🔔 Price Alert
            </button>
          </div>

          {/* Block U: Price Alert Form */}
          {showPriceAlert && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 mb-2 font-medium">Set a target price to be notified when price drops</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={product.price}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={`Current: $${parseFloat(displayPrice).toFixed(2)}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleSetPriceAlert}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Set Alert
                </button>
              </div>
            </div>
          )}

          {priceAlertSet && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4">
              ✓ Price alert set successfully! We'll notify you when the price drops.
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

          {/* Product Attributes (C1) */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Specifications</h3>
              <div className="space-y-2">
                {product.attributes.map((attr) => (
                  <div key={attr.attribute_id} className="flex">
                    <span className="w-40 text-gray-500 text-sm font-medium flex-shrink-0">{attr.attribute_name}</span>
                    {attr.is_html ? (
                      <span
                        className="text-gray-700 text-sm"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(attr.attribute_value) }}
                      />
                    ) : (
                      <span className="text-gray-700 text-sm">{attr.attribute_value}</span>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
          <div
            className="prose max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
          />
        </div>
      )}

      {/* Related Products (C4) */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
