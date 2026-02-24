import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/products?limit=1'),
      api.get('/admin/orders?limit=5'),
      api.get('/admin/orders?status=PENDING&limit=1'),
    ]).then(([prodRes, orderRes, pendingRes]) => {
      setStats({
        products: prodRes.data.meta?.total || 0,
        orders: orderRes.data.meta?.total || 0,
        pendingOrders: pendingRes.data.meta?.total || 0,
      });
      setRecentOrders(orderRes.data.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <h1 className="section-heading">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] text-apple-gray uppercase tracking-wider mb-1">Total Products</p>
          <p className="text-[28px] font-semibold text-apple-dark tracking-tight leading-tight">{stats.products}</p>
          <Link to="/admin/products" className="text-apple-blue text-xs hover:underline mt-2 inline-flex items-center gap-0.5">
            Manage
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] text-apple-gray uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-[28px] font-semibold text-apple-green tracking-tight leading-tight">{stats.orders}</p>
          <Link to="/admin/orders" className="text-apple-blue text-xs hover:underline mt-2 inline-flex items-center gap-0.5">
            View All
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] text-apple-gray uppercase tracking-wider mb-1">Pending Orders</p>
          <p className="text-[28px] font-semibold text-apple-orange tracking-tight leading-tight">{stats.pendingOrders}</p>
          <Link to="/admin/orders?status=PENDING" className="text-apple-blue text-xs hover:underline mt-2 inline-flex items-center gap-0.5">
            View
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        <Link to="/admin/products/new" className="btn-apple btn-apple-primary !rounded-2xl py-3 text-center text-xs">
          + New Product
        </Link>
        <Link to="/admin/products" className="glass-card !p-3 text-center text-xs font-medium text-apple-dark flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-apple-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          Products
        </Link>
        <Link to="/admin/orders" className="glass-card !p-3 text-center text-xs font-medium text-apple-dark flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-apple-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Orders
        </Link>
        <Link to="/admin/promotions" className="glass-card !p-3 text-center text-xs font-medium text-apple-dark flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-apple-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          Promotions
        </Link>
        <Link to="/" className="glass-card !p-3 text-center text-xs font-medium text-apple-dark flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-apple-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Storefront
        </Link>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-apple-dark tracking-tight mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-apple-gray-4/50 text-left text-apple-gray">
                  <th className="pb-2 font-medium">Order #</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.order_id} className="border-b border-apple-gray-4/30 last:border-b-0">
                    <td className="py-2.5">
                      <Link to={`/admin/orders/${order.order_id}`} className="text-apple-blue hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-2.5 text-apple-dark">{order.customer_name}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                        order.status === 'PENDING' ? 'text-apple-orange' :
                        order.status === 'COMPLETED' ? 'text-apple-green' :
                        order.status === 'CANCELLED' ? 'text-apple-red' :
                        'text-apple-blue'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'PENDING' ? 'bg-apple-orange' :
                          order.status === 'COMPLETED' ? 'bg-apple-green' :
                          order.status === 'CANCELLED' ? 'bg-apple-red' :
                          'bg-apple-blue'
                        }`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-apple-dark">${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="py-2.5 text-apple-gray">{new Date(order.order_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
