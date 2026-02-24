import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import OrderStatusBadge from '../components/OrderStatusBadge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;
  if (error && !order) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to Orders</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Items</h2>
          <div className="divide-y">
            {order.items?.map((item) => (
              <div key={item.order_item_id} className="py-3 flex items-center gap-4">
                <img
                  src={item.image_url || 'https://via.placeholder.com/60x60?text=Img'}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Img'; }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    ${parseFloat(item.unit_price).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="font-semibold">${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-blue-600">${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <p className="text-gray-600 text-sm whitespace-pre-line">{order.shipping_address}</p>
            {order.notes && (
              <>
                <h3 className="font-medium mt-3 mb-1 text-sm">Notes</h3>
                <p className="text-gray-500 text-sm">{order.notes}</p>
              </>
            )}
          </div>

          {/* Status History (B4) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Status History</h2>
            <div className="space-y-4">
              {order.status_history?.map((h, idx) => (
                <div key={h.history_id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${idx === order.status_history.length - 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    {idx < order.status_history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">
                      {h.old_status ? `${h.old_status} → ` : ''}{h.new_status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(h.changed_at).toLocaleString()}
                    </p>
                    {h.notes && <p className="text-xs text-gray-400 mt-1">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel Button */}
          {['PENDING', 'HOLD'].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
