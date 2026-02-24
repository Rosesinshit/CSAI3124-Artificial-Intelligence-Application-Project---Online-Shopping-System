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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-500 mb-1">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.products}</p>
          <Link to="/admin/products" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Manage →</Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-500 mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-green-600">{stats.orders}</p>
          <Link to="/admin/orders" className="text-sm text-green-600 hover:underline mt-2 inline-block">View All →</Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm text-gray-500 mb-1">Pending Orders</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          <Link to="/admin/orders?status=PENDING" className="text-sm text-yellow-600 hover:underline mt-2 inline-block">View →</Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/products/new" className="bg-blue-600 text-white rounded-lg p-4 text-center hover:bg-blue-700 font-semibold">
          + New Product
        </Link>
        <Link to="/admin/products" className="bg-white border rounded-lg p-4 text-center hover:bg-gray-50 font-semibold">
          📦 Products
        </Link>
        <Link to="/admin/orders" className="bg-white border rounded-lg p-4 text-center hover:bg-gray-50 font-semibold">
          📋 Orders
        </Link>
        <Link to="/admin/promotions" className="bg-white border rounded-lg p-4 text-center hover:bg-gray-50 font-semibold">
          🏷️ Promotions
        </Link>
        <Link to="/" className="bg-white border rounded-lg p-4 text-center hover:bg-gray-50 font-semibold">
          🏪 View Storefront
        </Link>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.order_id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-2">
                    <Link to={`/admin/orders/${order.order_id}`} className="text-blue-600 hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-2">{order.customer_name}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{order.status}</span>
                  </td>
                  <td className="py-2 font-medium">${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td className="py-2 text-gray-500">{new Date(order.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
