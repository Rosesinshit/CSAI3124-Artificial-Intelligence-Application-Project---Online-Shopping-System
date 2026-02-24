import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, fetchWishlist, notifications, fetchNotifications } = useWishlist();
  const { addToCart } = useCart();
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState({});
  const [activeTab, setActiveTab] = useState('wishlist');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchWishlist();
        await fetchNotifications();
        const alertsRes = await api.get('/wishlist/price-alerts');
        setPriceAlerts(alertsRes.data.data);
      } catch (err) {
        console.error('Failed to load wishlist data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      setAddedToCart(prev => ({ ...prev, [productId]: true }));
      setTimeout(() => setAddedToCart(prev => ({ ...prev, [productId]: false })), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      await removeFromWishlist(itemId);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const handleRemovePriceAlert = async (alertId) => {
    try {
      await api.delete(`/wishlist/price-alerts/${alertId}`);
      setPriceAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    } catch (err) {
      console.error('Failed to remove price alert:', err);
    }
  };

  const FALLBACK = 'https://via.placeholder.com/100x100?text=No+Image';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="shimmer w-6 h-6 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <h1 className="section-heading">Wish List</h1>

      {/* Notifications */}
      {notifications.total_notifications > 0 && (
        <div className="glass rounded-2xl p-5 mb-6 border border-apple-green/20">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-apple-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <h3 className="text-xs font-semibold text-apple-green">
              {notifications.total_notifications} Price Notification(s)
            </h3>
          </div>
          {notifications.price_drops.length > 0 && (
            <div className="mb-2">
              {notifications.price_drops.map(item => (
                <div key={item.wishlist_item_id} className="flex items-center gap-1.5 text-xs text-apple-dark/70 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-apple-green" />
                  <Link to={`/product/${item.product_id}`} className="hover:text-apple-blue font-medium">{item.name}</Link>
                  <span className="text-apple-gray">was ${parseFloat(item.price_when_added).toFixed(2)},</span>
                  <span className="font-medium text-apple-green">now ${parseFloat(item.current_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {notifications.alerts_reached.length > 0 && (
            <div>
              {notifications.alerts_reached.map(alert => (
                <div key={alert.alert_id} className="flex items-center gap-1.5 text-xs text-apple-dark/70 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-apple-green" />
                  <Link to={`/product/${alert.product_id}`} className="hover:text-apple-blue font-medium">{alert.name}</Link>
                  <span className="text-apple-gray">target ${parseFloat(alert.target_price).toFixed(2)},</span>
                  <span className="font-medium text-apple-green">now ${parseFloat(alert.current_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8">
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === 'wishlist' ? 'bg-apple-dark text-white' : 'text-apple-gray hover:bg-black/[0.04]'
          }`}
        >
          Wish List ({wishlist.item_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === 'alerts' ? 'bg-apple-dark text-white' : 'text-apple-gray hover:bg-black/[0.04]'
          }`}
        >
          Price Alerts ({priceAlerts.length})
        </button>
      </div>

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          {(!wishlist.items || wishlist.items.length === 0) ? (
            <div className="text-center py-20">
              <p className="text-apple-gray text-sm mb-5">Your wish list is empty.</p>
              <Link to="/products" className="text-apple-blue text-sm hover:underline inline-flex items-center gap-1">
                Browse Products
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.items.map((item) => (
                <div key={item.wishlist_item_id} className="glass-card !rounded-2xl !p-4 flex items-center gap-4">
                  <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                    <img
                      src={item.image_url || FALLBACK}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl bg-apple-gray-5"
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="text-sm font-medium text-apple-dark hover:text-apple-blue transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    {item.short_description && (
                      <p className="text-xs text-apple-gray line-clamp-1 mt-0.5">{item.short_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm font-semibold text-apple-dark">
                        ${parseFloat(item.current_price).toFixed(2)}
                      </span>
                      {item.price_dropped && (
                        <>
                          <span className="text-xs text-apple-gray line-through">
                            ${parseFloat(item.price_when_added).toFixed(2)}
                          </span>
                          <span className="bg-apple-green/10 text-apple-green text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Price Dropped
                          </span>
                        </>
                      )}
                    </div>
                    {!item.is_active && (
                      <span className="text-apple-red text-xs mt-1">Unavailable</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {item.is_active && item.stock_quantity > 0 && (
                      <button
                        onClick={() => handleAddToCart(item.product_id)}
                        className={`btn-apple text-xs transition-all ${addedToCart[item.product_id] ? 'bg-apple-green text-white' : 'btn-apple-primary'}`}
                      >
                        {addedToCart[item.product_id] ? 'Added' : 'Add to Bag'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.wishlist_item_id)}
                      className="btn-apple text-xs text-apple-red border border-apple-red/20 hover:bg-apple-red/5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          {priceAlerts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-apple-gray text-sm mb-2">No price alerts set.</p>
              <p className="text-xs text-apple-gray-2">Set a target price on any product to get notified.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {priceAlerts.map((alert) => (
                <div key={alert.alert_id} className="glass-card !rounded-2xl !p-4 flex items-center gap-4">
                  <Link to={`/product/${alert.product_id}`} className="flex-shrink-0">
                    <img
                      src={alert.image_url || FALLBACK}
                      alt={alert.name}
                      className="w-16 h-16 object-cover rounded-xl bg-apple-gray-5"
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${alert.product_id}`} className="text-sm font-medium text-apple-dark hover:text-apple-blue transition-colors">
                      {alert.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="text-apple-gray">
                        Current: <span className="font-medium text-apple-dark">${parseFloat(alert.current_price).toFixed(2)}</span>
                      </span>
                      <span className="text-apple-gray">
                        Target: <span className="font-medium text-apple-blue">${parseFloat(alert.target_price).toFixed(2)}</span>
                      </span>
                    </div>
                    {alert.target_reached && (
                      <span className="inline-block mt-1 bg-apple-green/10 text-apple-green text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Target reached!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemovePriceAlert(alert.alert_id)}
                    className="btn-apple text-xs text-apple-red border border-apple-red/20 hover:bg-apple-red/5 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
