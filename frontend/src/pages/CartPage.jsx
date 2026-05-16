import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart } from '../api/cart';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, summary, setCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then(res => setCart(res.data.items, res.data.summary))
      .finally(() => setLoading(false));
  }, []);

  const handleQuantity = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdating(productId);
    try {
      await updateCartItem(productId, { quantity: newQty });
      const res = await getCart();
      setCart(res.data.items, res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(productId);
    try {
      await removeFromCart(productId);
      const res = await getCart();
      setCart(res.data.items, res.data.summary);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const TAX_RATE = 0.18;
  const subtotal = parseFloat(summary.subtotal || 0);
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shipping = subtotal >= 500 ? 0 : subtotal > 0 ? 50 : 0;
  const total = subtotal + tax + shipping;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading cart...</div>;

  if (items.length === 0) return (
    <div className="text-center py-20">
      <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Add some medicines to get started</p>
      <Link to="/products" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Items */}
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart ({summary.item_count} items)</h1>
        {items.map(item => (
          <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
            <div className="bg-gray-50 w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0">
              {item.primary_image_url
                ? <img src={item.primary_image_url} alt={item.name} className="h-full object-contain p-2" />
                : <span className="text-3xl">💊</span>}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.slug}`} className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-1">
                {item.name}
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">{item.form} {item.strength}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => handleQuantity(item.product_id, item.quantity - 1)}
                    disabled={updating === item.product_id}
                    className="px-2.5 py-1.5 hover:bg-gray-100 disabled:opacity-50">
                    <Minus size={14} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => handleQuantity(item.product_id, item.quantity + 1)}
                    disabled={updating === item.product_id || item.quantity >= item.stock_quantity}
                    className="px-2.5 py-1.5 hover:bg-gray-100 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">₹{item.line_total}</span>
                  <button onClick={() => handleRemove(item.product_id)} disabled={updating === item.product_id}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="lg:w-80">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping}`}</span>
            </div>
            {subtotal > 0 && subtotal < 500 && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
              </p>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors mt-6">
            Proceed to Checkout
          </button>
          <Link to="/products" className="block text-center text-green-600 text-sm mt-3 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
