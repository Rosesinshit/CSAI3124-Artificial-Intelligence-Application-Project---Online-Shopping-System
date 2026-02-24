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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>

      {/* Status Filters (B3) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {s === 'ALL' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No orders found</p>
          <Link to="/products" className="text-blue-600 hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-gray-800">Order #{order.order_number}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center gap-3 mb-3">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.order_item_id} className="flex items-center gap-2">
                      <img
                        src={item.image_url || 'https://via.placeholder.com/40x40?text=Img'}
                        alt={item.product_name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=Img'; }}
                      />
                      <span className="text-sm text-gray-600 truncate max-w-[150px]">{item.product_name}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="text-sm text-gray-400">+{order.items.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{order.items?.length || 0} item(s)</span>
                  <span className="text-lg font-bold text-blue-600">${parseFloat(order.total_amount).toFixed(2)}</span>
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
