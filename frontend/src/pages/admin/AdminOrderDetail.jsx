import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import OrderStatusBadge from '../../components/OrderStatusBadge';

const VALID_TRANSITIONS = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['SHIPPED', 'HOLD'],
  'SHIPPED': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': [],
  'HOLD': ['SHIPPED', 'CANCELLED'],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchOrder = () => {
    api.get(`/admin/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    setUpdating(true);
    setError('');
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus, notes });
      setNotes('');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;
  if (!order) return <div className="text-center py-16 text-red-500">{error || 'Order not found'}</div>;

  const validNext = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/admin/orders" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to Orders</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            {order.customer_name} ({order.customer_email}) · {new Date(order.order_date).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.order_item_id} className="py-3 flex items-center gap-4">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/60x60?text=Img'}
                    alt={item.product_name}
                    className="w-14 h-14 rounded-lg object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Img'; }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">${parseFloat(item.unit_price).toFixed(2)} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold">${parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-blue-600">${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Status Update (B2) */}
          {validNext.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Update Status</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
              />
              <div className="flex gap-3">
                {validNext.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 ${
                      status === 'CANCELLED' ? 'bg-red-600 text-white hover:bg-red-700' :
                      status === 'COMPLETED' ? 'bg-green-600 text-white hover:bg-green-700' :
                      'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    → {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <p className="text-gray-600 text-sm whitespace-pre-line">{order.shipping_address}</p>
            {order.notes && (
              <>
                <h3 className="font-medium mt-3 mb-1 text-sm">Customer Notes</h3>
                <p className="text-gray-500 text-sm">{order.notes}</p>
              </>
            )}
          </div>

          {/* Status History (B4) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Status History</h2>
            <div className="space-y-3">
              {order.status_history?.map((h, idx) => (
                <div key={h.history_id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${idx === order.status_history.length - 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    {idx < order.status_history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="font-medium text-sm">{h.old_status ? `${h.old_status} → ` : ''}{h.new_status}</p>
                    <p className="text-xs text-gray-500">{new Date(h.changed_at).toLocaleString()}</p>
                    {h.changed_by && <p className="text-xs text-gray-400">by {h.changed_by}</p>}
                    {h.notes && <p className="text-xs text-gray-400 mt-1">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">Dates</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ordered:</span>
                <span>{new Date(order.order_date).toLocaleString()}</span>
              </div>
              {order.shipped_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipped:</span>
                  <span>{new Date(order.shipped_date).toLocaleString()}</span>
                </div>
              )}
              {order.completed_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed:</span>
                  <span>{new Date(order.completed_date).toLocaleString()}</span>
                </div>
              )}
              {order.cancelled_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cancelled:</span>
                  <span>{new Date(order.cancelled_date).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
