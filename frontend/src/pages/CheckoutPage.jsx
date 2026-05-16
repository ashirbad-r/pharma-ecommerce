import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { getAddresses, addAddress } from '../api/addresses';
import { getCart } from '../api/cart';
import { checkout } from '../api/orders';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, summary, setCart, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '', phone: '', street_address: '',
    city: '', state_province: '', postal_code: ''
  });

  const subtotal = parseFloat(summary.subtotal || 0);
  const tax = parseFloat((subtotal * 0.18).toFixed(2));
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    Promise.all([getAddresses(), getCart()])
      .then(([addrRes, cartRes]) => {
        setAddresses(addrRes.data.addresses);
        setCart(cartRes.data.items, cartRes.data.summary);
        const def = addrRes.data.addresses.find(a => a.is_default);
        if (def) setSelectedAddress(def.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addAddress(newAddress);
      setAddresses(prev => [...prev, res.data.address]);
      setSelectedAddress(res.data.address.id);
      setShowAddAddress(false);
      toast.success('Address added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    setPlacing(true);
    try {
      const res = await checkout({ payment_method: 'razorpay' });
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${res.data.order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" /> Delivery Address
            </h2>
            <button onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-sm text-green-600 hover:underline flex items-center gap-1">
              <Plus size={14} /> Add New
            </button>
          </div>

          {addresses.length === 0 && !showAddAddress && (
            <p className="text-gray-400 text-sm">No addresses saved. Add one below.</p>
          )}

          <div className="flex flex-col gap-3">
            {addresses.map(addr => (
              <label key={addr.id}
                className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}>
                <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{addr.full_name}</p>
                  <p className="text-gray-500">{addr.street_address}, {addr.city}</p>
                  <p className="text-gray-500">{addr.state_province} - {addr.postal_code}</p>
                  {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
                  {addr.is_default && <span className="text-xs text-green-600 font-medium">Default</span>}
                </div>
              </label>
            ))}
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="mt-4 flex flex-col gap-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                  <input required value={newAddress.full_name}
                    onChange={e => setNewAddress({...newAddress, full_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                  <input value={newAddress.phone}
                    onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Street Address</label>
                <input required value={newAddress.street_address}
                  onChange={e => setNewAddress({...newAddress, street_address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">City</label>
                  <input required value={newAddress.city}
                    onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">State</label>
                  <input required value={newAddress.state_province}
                    onChange={e => setNewAddress({...newAddress, state_province: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Pincode</label>
                  <input required value={newAddress.postal_code}
                    onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddAddress(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Items ({items.length})</h2>
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                <span className="font-medium text-gray-900">₹{item.line_total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Summary */}
      <div className="lg:w-72">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
          <h2 className="font-bold text-gray-900 mb-4">Bill Summary</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping}`}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handlePlaceOrder} disabled={placing}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors mt-6 disabled:opacity-50">
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
