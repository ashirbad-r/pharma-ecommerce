import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingCart, AlertCircle, Filter } from 'lucide-react';
import { getProducts } from '../api/products';
import { addToCart, getCart } from '../api/cart';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();

  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => { fetchProducts(); }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('page')) params.page = searchParams.get('page');
      const res = await getProducts(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
    } catch {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); return; }
    if (product.requires_prescription) { toast.error('This product requires a prescription'); return; }
    setAddingId(product.id);
    try {
      await addToCart({ product_id: product.id, quantity: 1 });
      const cartRes = await getCart();
      setCart(cartRes.data.items, cartRes.data.summary);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="bg-gray-200 h-40 rounded-xl mb-4" />
              <div className="bg-gray-200 h-4 rounded mb-2" />
              <div className="bg-gray-200 h-4 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Filter size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <Link to={`/products/${product.slug}`}>
                <div className="bg-gray-50 h-44 flex items-center justify-center">
                  {product.primary_image_url
                    ? <img src={product.primary_image_url} alt={product.name} className="h-full object-contain p-4" />
                    : <span className="text-5xl">💊</span>}
                </div>
              </Link>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex gap-2 flex-wrap">
                  {product.requires_prescription && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <AlertCircle size={10} /> Rx
                    </span>
                  )}
                  {product.form && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{product.form}</span>
                  )}
                </div>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-400">{product.manufacturer}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">₹{product.selling_price}</span>
                    {product.discount_percentage > 0 && (
                      <span className="text-xs text-green-600 ml-2 font-medium">{product.discount_percentage}% off</span>
                    )}
                  </div>
                  <button onClick={() => handleAddToCart(product)}
                    disabled={addingId === product.id || product.stock_quantity === 0}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    <ShoppingCart size={16} />
                  </button>
                </div>
                {product.stock_quantity === 0 && (
                  <p className="text-xs text-red-500 font-medium">Out of stock</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i}
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: i + 1 })}
              className={`w-9 h-9 rounded-lg font-medium transition-colors ${page === i + 1 ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
