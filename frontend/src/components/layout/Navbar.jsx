import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { summary } = useCartStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rx</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PharmaShop</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-gray-600 hover:text-green-600 font-medium transition-colors">
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-gray-600 hover:text-green-600 font-medium transition-colors flex items-center gap-1">
                  <Package size={18} /> Orders
                </Link>
                <Link to="/cart" className="relative text-gray-600 hover:text-green-600 transition-colors">
                  <ShoppingCart size={22} />
                  {summary.item_count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {summary.item_count}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3 border-l pl-4 ml-2">
                  <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                    <User size={18} />
                    <span className="font-medium">{user?.first_name}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-green-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-4">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Products</Link>
            {isAuthenticated ? (
              <>
                <Link to="/cart" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Cart ({summary.item_count})</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Orders</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Profile</Link>
                <button onClick={handleLogout} className="text-red-500 font-medium text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
