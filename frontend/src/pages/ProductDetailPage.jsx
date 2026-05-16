import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Package, ChevronLeft } from 'lucide-react';
import { getProduct } from '../api/products';
import { addToCart, getCart } from '../api/cart';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();

  useEffect(() => {
    getProduct(id)
      .then(res => setProduct(res.data.product))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    if (product.requires_prescription) { toast.error('This product requires a prescription'); return; }
    setAdding(true);
    try {
      await addToCart({ product_id: product.id, quantity });
      const cartRes = await getCart();
      setCart(cartRes.data.items, cartRes.data.summary);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse max-w-4xl mx-auto">
      <div className="bg-gray-200 h-8 w-32 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-200 h-80 rounded-2xl" />
        <div className="flex flex-col gap-4">
          <div className="bg-gray-200 h-8 rounded" />
          <div className="bg-gray-200 h-4 rounded w-2/3" />
          <div className="bg-gray-200 h-24 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Product not found</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-6 transition-colors">
        <ChevronLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-gray-50 rounded-2xl h-80 flex items-center justify-center border border-gray-100">
          {product.primary_image_url
            ? <img src={product.primary_image_url} alt={product.name} className="h-full object-contain p-8" />
            : <span className="text-8xl">💊</span>
          }
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {product.requires_prescription && (
              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertCircle size={12} /> Prescription Required
              </span>
            )}
            {product.form && (
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full capitalize">{product.form}</span>
            )}
            {product.category_name && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{product.category_name}</span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-500 text-sm">by {product.manufacturer}</p>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-sm">
            {product.salt_composition && <div><span className="text-gray-400">Composition</span><p className="font-medium text-gray-700 mt-0.5">{product.salt_composition}</p></div>}
            {product.strength && <div><span className="text-gray-400">Strength</span><p className="font-medium text-gray-700 mt-0.5">{product.strength}</p></div>}
            {product.batch_number && <div><span className="text-gray-400">Batch</span><p className="font-medium text-gray-700 mt-0.5">{product.batch_number}</p></div>}
            {product.expiry_date && <div><span className="text-gray-400">Expiry</span><p className="font-medium text-gray-700 mt-0.5">{new Date(product.expiry_date).toLocaleDateString('en-IN')}</p></div>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">₹{product.selling_price}</span>
            {product.discount_percentage > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.base_price}</span>
                <span className="text-green-600 font-semibold">{product.discount_percentage}% off</span>
              </>
            )}
          </div>

          {product.stock_quantity > 0 ? (
            <p className="text-green-600 text-sm font-medium flex items-center gap-1">
              <Package size={14} /> In Stock ({product.stock_quantity} units)
            </p>
          ) : (
            <p className="text-red-500 text-sm font-medium">Out of Stock</p>
          )}

          {!product.requires_prescription && product.stock_quantity > 0 && (
            <div className="flex gap-3 mt-2">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 font-medium">−</button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))} className="px-3 py-2 hover:bg-gray-100 font-medium">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={adding}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <ShoppingCart size={18} />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
