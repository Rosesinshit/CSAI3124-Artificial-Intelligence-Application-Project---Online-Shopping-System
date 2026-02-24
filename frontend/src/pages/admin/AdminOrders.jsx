import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Pagination from '../../components/Pagination';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'HOLD'];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') || 'ALL';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (status !== 'ALL') params.set('status', status);

    api.get(`/admin/orders?${params}`)
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
      <h1 className="section-heading">Order Management</h1>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              status === s
                ? 'bg-apple-dark text-white'
                : 'glass-light text-apple-gray hover:text-apple-dark'
            }`}
          >
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="shimmer w-6 h-6 rounded-full" />
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-apple-gray-4/50 text-left text-apple-gray">
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b border-apple-gray-4/30 last:border-b-0 hover:bg-white/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-apple-dark">{order.order_number}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-apple-dark">{order.customer_name}</div>
                        <div className="text-[10px] text-apple-gray">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-2.5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-2.5 font-medium text-apple-dark">${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-apple-gray">{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <Link to={`/admin/orders/${order.order_id}`} className="text-apple-blue hover:underline">View Details</Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-apple-gray">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onPageChange={(p) => updateFilter('page', p)} />
        </>
      )}
    </div>
  );
}
