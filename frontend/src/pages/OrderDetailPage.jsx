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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="shimmer w-6 h-6 rounded-full" />
    </div>
  );
  if (error && !order) return <div className="text-center py-20 text-apple-red text-sm">{error}</div>;
  if (!order) return null;

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <Link to="/orders" className="text-apple-blue hover:underline text-xs inline-flex items-center gap-1 mb-6">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-apple-dark tracking-tight">Order #{order.order_number}</h1>
          <p className="text-xs text-apple-gray mt-1">
            {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && <div className="bg-apple-red/5 border border-apple-red/10 text-apple-red p-3 rounded-xl mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-apple-dark mb-4">Items</h2>
          <div className="divide-y divide-black/[0.04]">
            {order.items?.map((item) => (
              <div key={item.order_item_id} className="py-3 flex items-center gap-4">
                <img
                  src={item.image_url || 'https://via.placeholder.com/60x60?text=Img'}
                  alt={item.product_name}
                  className="w-14 h-14 rounded-xl object-cover bg-apple-gray-5 flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Img'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-apple-dark">{item.product_name}</p>
                  <p className="text-xs text-apple-gray mt-0.5">
                    ${parseFloat(item.unit_price).toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-apple-dark">${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-black/[0.06] mt-4 pt-4 flex justify-between items-center">
            <span className="text-sm font-medium text-apple-dark">Total</span>
            <span className="text-xl font-semibold text-apple-dark tracking-tight">${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark mb-2">Shipping Address</h2>
            <p className="text-xs text-apple-gray leading-relaxed whitespace-pre-line">{order.shipping_address}</p>
            {order.notes && (
              <>
                <h3 className="text-xs font-medium text-apple-dark mt-3 mb-1">Notes</h3>
                <p className="text-xs text-apple-gray">{order.notes}</p>
              </>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-apple-dark mb-4">Status History</h2>
            <div className="space-y-3">
              {order.status_history?.map((h, idx) => (
                <div key={h.history_id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 ${idx === order.status_history.length - 1 ? 'bg-apple-blue' : 'bg-apple-gray-3'}`} />
                    {idx < order.status_history.length - 1 && <div className="w-px flex-1 bg-apple-gray-3/50 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-medium text-apple-dark">
                      {h.old_status ? `${h.old_status} → ` : ''}{h.new_status}
                    </p>
                    <p className="text-[10px] text-apple-gray mt-0.5">
                      {new Date(h.changed_at).toLocaleString()}
                    </p>
                    {h.notes && <p className="text-[10px] text-apple-gray mt-0.5">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {['PENDING', 'HOLD'].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full btn-apple bg-apple-red text-white hover:opacity-90 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
