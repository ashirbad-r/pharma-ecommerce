import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package } from 'lucide-react';
import { getOrder, cancelOrder } from '../api/orders';
import toast from 'react-hot-toast';

const statusColors = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(res => {
        setOrder(res.data.order);
        setItems(res.data.items);
        setPayment(res.data.payment);
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      const res = await getOrder(id);
      setOrder(res.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading order...</div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors">
        <ChevronLeft size={20} /> Back to Orders
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status}
            </span>
            {['pending', 'confirmed'].includes(order.status) && (
              <button onClick={handleCancel} disabled={cancelling}
                className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs capitalize hidden sm:block ${i <= currentStep ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-1.5 bg-gray-100 rounded-full mt-1">
              <div className="absolute h-1.5 bg-green-600 rounded-full transition-all"
                style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={18} className="text-green-600" /> Items Ordered
        </h2>
        <div className="flex flex-col gap-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4">
              <div className="bg-gray-50 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                {item.primary_image_url
                  ? <img src={item.primary_image_url} alt={item.product_name} className="h-full object-contain p-2" />
                  : <span className="text-2xl">💊</span>}
              </div>
              <div className="flex-1 flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{item.unit_price}</p>
                </div>
                <p className="font-semibold text-gray-900">₹{item.total_price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Bill Details</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{order.tax_amount}</span></div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>{parseFloat(order.shipping_cost) === 0 ? <span className="text-green-600">Free</span> : `₹${order.shipping_cost}`}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
            <span>Total</span><span>₹{order.total_amount}</span>
          </div>
        </div>
        {payment && (
          <div className="mt-4 pt-4 border-t text-sm flex justify-between text-gray-500">
            <span>Payment</span>
            <span className={`font-medium capitalize ${payment.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
              {payment.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
