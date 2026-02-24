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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="shimmer w-6 h-6 rounded-full" />
    </div>
  );
  if (!order) return <div className="text-center py-16 text-apple-red text-sm">{error || 'Order not found'}</div>;

  const validNext = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <Link to="/admin/orders" className="text-apple-blue text-xs hover:underline mb-4 inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-apple-dark tracking-tight">Order #{order.order_number}</h1>
          <p className="text-xs text-apple-gray mt-0.5">
            {order.customer_name} ({order.customer_email}) · {new Date(order.order_date).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-2xl mb-5 text-xs">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">Order Items</h2>
            <div className="divide-y divide-apple-gray-4/30">
              {order.items?.map((item) => (
                <div key={item.order_item_id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/60x60?text=Img'}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-xl object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Img'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-apple-dark truncate">{item.product_name}</p>
                    <p className="text-[10px] text-apple-gray">${parseFloat(item.unit_price).toFixed(2)} x {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold text-apple-dark">${parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-apple-gray-4/30 mt-4 pt-4 flex justify-between items-center">
              <span className="text-xs text-apple-gray">Total</span>
              <span className="text-base font-semibold text-apple-blue">${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Status Update (B2) */}
          {validNext.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-3">Update Status</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="glass-input !rounded-xl text-xs mb-3"
              />
              <div className="flex gap-2">
                {validNext.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating}
                    className={`btn-apple text-xs disabled:opacity-50 ${
                      status === 'CANCELLED' ? '!bg-apple-red !text-white !border-apple-red hover:!bg-apple-red/90' :
                      status === 'COMPLETED' ? '!bg-apple-green !text-white !border-apple-green hover:!bg-apple-green/90' :
                      'btn-apple-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-2">Shipping Address</h2>
            <p className="text-xs text-apple-gray whitespace-pre-line leading-relaxed">{order.shipping_address}</p>
            {order.notes && (
              <>
                <h3 className="text-xs font-medium text-apple-dark mt-3 mb-1">Customer Notes</h3>
                <p className="text-xs text-apple-gray">{order.notes}</p>
              </>
            )}
          </div>

          {/* Status History (B4) */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">Status History</h2>
            <div className="space-y-0">
              {order.status_history?.map((h, idx) => (
                <div key={h.history_id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${idx === order.status_history.length - 1 ? 'bg-apple-blue' : 'bg-apple-gray-3'}`} />
                    {idx < order.status_history.length - 1 && <div className="w-px flex-1 bg-apple-gray-4 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-medium text-apple-dark">{h.old_status ? `${h.old_status} → ` : ''}{h.new_status}</p>
                    <p className="text-[10px] text-apple-gray">{new Date(h.changed_at).toLocaleString()}</p>
                    {h.changed_by && <p className="text-[10px] text-apple-gray">by {h.changed_by}</p>}
                    {h.notes && <p className="text-[10px] text-apple-gray mt-0.5">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Info */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-3">Dates</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-apple-gray">Ordered</span>
                <span className="text-apple-dark">{new Date(order.order_date).toLocaleString()}</span>
              </div>
              {order.shipped_date && (
                <div className="flex justify-between">
                  <span className="text-apple-gray">Shipped</span>
                  <span className="text-apple-dark">{new Date(order.shipped_date).toLocaleString()}</span>
                </div>
              )}
              {order.completed_date && (
                <div className="flex justify-between">
                  <span className="text-apple-gray">Completed</span>
                  <span className="text-apple-dark">{new Date(order.completed_date).toLocaleString()}</span>
                </div>
              )}
              {order.cancelled_date && (
                <div className="flex justify-between">
                  <span className="text-apple-gray">Cancelled</span>
                  <span className="text-apple-dark">{new Date(order.cancelled_date).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
