import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getOrder, updateOrderStatus } from '../api/index';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(res => { setOrder(res.data.order); setItems(res.data.items); })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft size={20} /> Back to Orders
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {order.first_name} {order.last_name} · {order.email} · {order.phone}
            </p>
            <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium capitalize ${statusColors[order.status] || 'bg-gray-100'}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Status Update */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Update Status:</p>
          <div className="flex flex-wrap gap-2">
            {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => handleStatusUpdate(s)}
                disabled={updating || order.status === s}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                  ${order.status === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                  } disabled:opacity-50`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Items Ordered</h2>
        <table className="w-full">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Unit Price</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{item.unit_price}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t mt-4 pt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{order.tax_amount}</span></div>
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{parseFloat(order.shipping_cost) === 0 ? 'Free' : `₹${order.shipping_cost}`}</span></div>
          <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2"><span>Total</span><span>₹{order.total_amount}</span></div>
        </div>
      </div>
    </div>
  );
}
