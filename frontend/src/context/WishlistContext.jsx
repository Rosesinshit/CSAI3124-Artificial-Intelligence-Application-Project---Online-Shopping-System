import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState({ items: [], item_count: 0 });
  const [notifications, setNotifications] = useState({ price_drops: [], alerts_reached: [], total_notifications: 0 });
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ items: [], item_count: 0 });
      setNotifications({ price_drops: [], alerts_reached: [], total_notifications: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      setWishlist(res.data.data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/wishlist/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
    fetchNotifications();
  }, [fetchWishlist, fetchNotifications]);

  const addToWishlist = async (productId) => {
    const res = await api.post('/wishlist/items', { product_id: productId });
    await fetchWishlist();
    return res.data.data;
  };

  const removeFromWishlist = async (wishlistItemId) => {
    await api.delete(`/wishlist/items/${wishlistItemId}`);
    await fetchWishlist();
  };

  const isInWishlist = (productId) => {
    return wishlist.items?.some(item => item.product_id === productId);
  };

  const getWishlistItemId = (productId) => {
    const item = wishlist.items?.find(item => item.product_id === productId);
    return item?.wishlist_item_id || null;
  };

  const setPriceAlert = async (productId, targetPrice) => {
    const res = await api.post('/wishlist/price-alerts', { product_id: productId, target_price: targetPrice });
    await fetchNotifications();
    return res.data.data;
  };

  const removePriceAlert = async (alertId) => {
    await api.delete(`/wishlist/price-alerts/${alertId}`);
    await fetchNotifications();
  };

  return (
    <WishlistContext.Provider value={{
      wishlist, notifications, loading,
      addToWishlist, removeFromWishlist,
      isInWishlist, getWishlistItemId,
      setPriceAlert, removePriceAlert,
      fetchWishlist, fetchNotifications
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
