import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState(user?.shipping_address || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link to="/products" className="text-blue-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/orders', { shipping_address: shippingAddress, notes });
      await fetchCart();
      navigate(`/orders/${res.data.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Order creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address *</label>
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your shipping address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Special instructions..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : `Place Order ($${cart.total_amount})`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <ul className="divide-y">
            {cart.items.map((item) => (
              <li key={item.cart_item_id} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">${parseFloat(item.line_total).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-4 pt-4 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-blue-600">${cart.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
