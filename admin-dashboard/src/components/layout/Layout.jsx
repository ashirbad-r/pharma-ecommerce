import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, FileText, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/prescriptions', icon: FileText, label: 'Prescriptions' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">Rx</div>
            <div>
              <p className="font-bold">PharmaAdmin</p>
              <p className="text-xs text-indigo-300">Management Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                pathname === path ? 'bg-indigo-700 text-white' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
              }`}>
              <Icon size={18} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.first_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors px-2 py-1 w-full">
            <LogOut size={16} /> <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
