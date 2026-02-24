import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Pagination from '../components/Pagination';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'HOLD'];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') || 'ALL';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (status !== 'ALL') params.set('status', status);

    api.get(`/orders?${params}`)
      .then((res) => {
        setOrders(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, page]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <h1 className="section-heading">My Orders</h1>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              status === s
                ? 'bg-apple-dark text-white'
                : 'text-apple-gray hover:bg-black/[0.04]'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="shimmer w-6 h-6 rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-apple-gray text-sm mb-5">No orders found.</p>
          <Link to="/products" className="btn-apple btn-apple-primary text-sm">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                className="block glass-card !p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-apple-dark">#{order.order_number}</span>
                    <span className="text-xs text-apple-gray">
                      {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.order_item_id} className="flex items-center gap-2">
                      <img
                        src={item.image_url || 'https://via.placeholder.com/40x40?text=Img'}
                        alt={item.product_name}
                        className="w-9 h-9 rounded-lg object-cover bg-apple-gray-5"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=Img'; }}
                      />
                      <span className="text-xs text-apple-gray truncate max-w-[120px]">{item.product_name}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="text-[11px] text-apple-gray">+{order.items.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-apple-gray">{order.items?.length || 0} item(s)</span>
                  <span className="text-sm font-semibold text-apple-dark">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination meta={meta} onPageChange={(p) => updateFilter('page', p)} />
        </>
      )}
    </div>
  );
}
