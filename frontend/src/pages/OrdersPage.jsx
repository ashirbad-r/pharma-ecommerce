import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { getOrders } from '../api/orders';
import toast from 'react-hot-toast';

const statusColors = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="text-center py-20">
      <Package size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
      <p className="text-gray-400 mb-6">Your order history will appear here</p>
      <Link to="/products" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      {orders.map(order => (
        <Link key={order.id} to={`/orders/${order.id}`}
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">{order.order_number}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{order.item_count} item(s) · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 text-lg">₹{order.total_amount}</p>
            <p className={`text-xs font-medium capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
              {order.payment_status}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
