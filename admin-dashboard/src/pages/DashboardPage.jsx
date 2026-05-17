import { useState, useEffect } from 'react';
import { ShoppingBag, Package, Clock, IndianRupee } from 'lucide-react';
import { getOrders, getProducts } from '../api/index';
import { Link } from 'react-router-dom';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders({ limit: 100 }), getProducts({ limit: 100 })])
      .then(([ordersRes, productsRes]) => {
        setOrders(ordersRes.data.orders);
        setProducts(productsRes.data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 8);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Pending Orders', value: pendingOrders, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-green-500' },
    { label: 'Revenue', value: `₹${totalRevenue.toFixed(0)}`, icon: IndianRupee, color: 'bg-indigo-500' },
  ];

  if (loading) return (
    <div className="grid grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm">
            <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-lg">Recent Orders</h2>
          <Link to="/orders" className="text-indigo-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Order</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/orders/${order.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.first_name} {order.last_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.item_count} item(s)</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-12 text-gray-400">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
