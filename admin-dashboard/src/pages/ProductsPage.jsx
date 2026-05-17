import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/index';
import toast from 'react-hot-toast';

const empty = { name:'', category_id:'1', description:'', base_price:'', selling_price:'', stock_quantity:'', manufacturer:'', salt_composition:'', strength:'', form:'tablet', requires_prescription:false };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    setLoading(true);
    getProducts({ limit: 100 })
      .then(res => setProducts(res.data.products))
      .finally(() => setLoading(false));
  };

  const openCreate = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name:p.name, category_id:p.category_id||'1', description:p.description||'', base_price:p.base_price, selling_price:p.selling_price, stock_quantity:p.stock_quantity, manufacturer:p.manufacturer||'', salt_composition:p.salt_composition||'', strength:p.strength||'', form:p.form||'tablet', requires_prescription:p.requires_prescription });
    setEditing(p.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing, form);
        toast.success('Product updated');
      } else {
        await createProduct(form);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const set = (field) => (e) => setForm({...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Stock</th>
              <th className="px-6 py-3 text-left">Rx</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.manufacturer}</p>
                </td>
                <td className="px-6 py-4 text-sm">
                  <p className="font-semibold text-gray-900">₹{p.selling_price}</p>
                  <p className="text-xs text-gray-400 line-through">₹{p.base_price}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.stock_quantity}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.requires_prescription ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.requires_prescription ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div><label className="text-xs text-gray-500 mb-1 block">Name *</label><input required value={form.name} onChange={set('name')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 mb-1 block">Base Price *</label><input required type="number" value={form.base_price} onChange={set('base_price')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Selling Price *</label><input required type="number" value={form.selling_price} onChange={set('selling_price')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 mb-1 block">Stock Quantity</label><input type="number" value={form.stock_quantity} onChange={set('stock_quantity')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Form</label>
                  <select value={form.form} onChange={set('form')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['tablet','capsule','syrup','injection','cream','drops','powder'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Manufacturer</label><input value={form.manufacturer} onChange={set('manufacturer')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Salt Composition</label><input value={form.salt_composition} onChange={set('salt_composition')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Strength</label><input value={form.strength} onChange={set('strength')} placeholder="e.g. 500mg" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Description</label><textarea value={form.description} onChange={set('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.requires_prescription} onChange={set('requires_prescription')} className="accent-indigo-600" />
                Requires Prescription
              </label>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
