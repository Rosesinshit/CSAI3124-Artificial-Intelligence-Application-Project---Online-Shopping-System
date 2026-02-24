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
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Wish List</h1>

      {/* Notifications Banner */}
      {notifications.total_notifications > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-xl">🔔</span>
            <h3 className="font-semibold text-green-800">
              Price Drop Notifications ({notifications.total_notifications})
            </h3>
          </div>
          {notifications.price_drops.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-green-700 font-medium mb-1">Wishlist items with price drops:</p>
              {notifications.price_drops.map(item => (
                <div key={item.wishlist_item_id} className="flex items-center gap-2 text-sm text-green-700">
                  <span>•</span>
                  <Link to={`/product/${item.product_id}`} className="hover:underline font-medium">{item.name}</Link>
                  <span>was ${parseFloat(item.price_when_added).toFixed(2)},</span>
                  <span className="font-semibold">now ${parseFloat(item.current_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {notifications.alerts_reached.length > 0 && (
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Price alerts reached:</p>
              {notifications.alerts_reached.map(alert => (
                <div key={alert.alert_id} className="flex items-center gap-2 text-sm text-green-700">
                  <span>•</span>
                  <Link to={`/product/${alert.product_id}`} className="hover:underline font-medium">{alert.name}</Link>
                  <span>target: ${parseFloat(alert.target_price).toFixed(2)},</span>
                  <span className="font-semibold">now ${parseFloat(alert.current_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'wishlist'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Wish List ({wishlist.item_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Price Alerts ({priceAlerts.length})
        </button>
      </div>

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          {(!wishlist.items || wishlist.items.length === 0) ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">Your wish list is empty</p>
              <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium">
                Browse Products →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.items.map((item) => (
                <div key={item.wishlist_item_id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
                  <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                    <img
                      src={item.image_url || FALLBACK}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                      {item.name}
                    </Link>
                    {item.short_description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">{item.short_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-blue-600">
                        ${parseFloat(item.current_price).toFixed(2)}
                      </span>
                      {item.price_dropped && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            ${parseFloat(item.price_when_added).toFixed(2)}
                          </span>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            Price Dropped!
                          </span>
                        </>
                      )}
                    </div>
                    {!item.is_active && (
                      <span className="text-red-500 text-sm">Product unavailable</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {item.is_active && item.stock_quantity > 0 && (
                      <button
                        onClick={() => handleAddToCart(item.product_id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          addedToCart[item.product_id]
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {addedToCart[item.product_id] ? '✓ Added' : '🛒 Add to Cart'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.wishlist_item_id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
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
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">No price alerts set</p>
              <p className="text-sm text-gray-400">
                Set a target price on any product to be notified when it drops to your desired price.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {priceAlerts.map((alert) => (
                <div key={alert.alert_id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
                  <Link to={`/product/${alert.product_id}`} className="flex-shrink-0">
                    <img
                      src={alert.image_url || FALLBACK}
                      alt={alert.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${alert.product_id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                      {alert.name}
                    </Link>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-500">
                        Current: <span className="font-medium text-gray-700">${parseFloat(alert.current_price).toFixed(2)}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        Target: <span className="font-medium text-blue-600">${parseFloat(alert.target_price).toFixed(2)}</span>
                      </span>
                    </div>
                    {alert.target_reached && (
                      <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        🎉 Target price reached!
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleRemovePriceAlert(alert.alert_id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
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
    </div>
  );
}
