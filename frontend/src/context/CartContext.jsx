import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_amount: '0.00', item_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total_amount: '0.00', item_count: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { product_id: productId, quantity });
    await fetchCart();
    return res.data.data;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    await api.put(`/cart/items/${cartItemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (cartItemId) => {
    await api.delete(`/cart/items/${cartItemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete('/cart');
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
