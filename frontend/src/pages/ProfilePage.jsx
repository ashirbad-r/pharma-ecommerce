import { useState } from 'react';
import { User, MapPin, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearCart();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
            <User size={28} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400 mb-1">Phone</p>
            <p className="font-medium text-gray-700">{user?.phone || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400 mb-1">KYC Status</p>
            <p className={`font-medium ${user?.kyc_verified ? 'text-green-600' : 'text-orange-500'}`}>
              {user?.kyc_verified ? 'Verified' : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-900 mb-2">Quick Links</h2>
        <button onClick={() => navigate('/orders')}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left w-full">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">My Orders</p>
            <p className="text-xs text-gray-400">Track and manage your orders</p>
          </div>
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-red-100 text-red-500 font-medium hover:bg-red-50 transition-colors">
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
