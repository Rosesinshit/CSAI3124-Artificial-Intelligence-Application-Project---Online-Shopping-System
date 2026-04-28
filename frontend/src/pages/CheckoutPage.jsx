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
      <div className="max-w-[980px] mx-auto px-4 py-20 text-center">
        <p className="text-apple-gray text-sm mb-5">Your bag is empty.</p>
        <Link to="/products" className="btn-apple btn-apple-primary text-sm">Continue Shopping</Link>
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
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <h1 className="section-heading">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-apple-dark tracking-tight mb-5">Shipping Information</h2>

            {error && (
              <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-apple-gray mb-1.5">Shipping Address *</label>
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  className="glass-input"
                  placeholder="Enter your shipping address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-apple-gray mb-1.5">Order Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="glass-input"
                  placeholder="Special instructions..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 btn-apple btn-apple-primary"
            >
              {loading ? 'Placing Order...' : `Place Order — $${cart.total_amount}`}
            </button>
          </form>
        </div>

        <div className="glass rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-apple-dark tracking-tight mb-4">Order Summary</h2>
          <ul className="divide-y divide-black/[0.04]">
            {cart.items.map((item) => (
              <li key={item.cart_item_id} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-apple-dark">{item.name}</p>
                  <p className="text-xs text-apple-gray mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-apple-dark">${parseFloat(item.line_total).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-black/[0.06] mt-4 pt-4 flex justify-between items-center">
            <span className="text-sm font-medium text-apple-dark">Total</span>
            <span className="text-xl font-semibold text-apple-dark tracking-tight">${cart.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
