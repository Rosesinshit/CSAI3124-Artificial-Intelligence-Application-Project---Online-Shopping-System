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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'
            }`}
          >
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 font-medium">${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${order.order_id}`} className="text-blue-600 hover:underline text-xs">View Details</Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={(p) => updateFilter('page', p)} />
        </>
      )}
    </div>
  );
}
