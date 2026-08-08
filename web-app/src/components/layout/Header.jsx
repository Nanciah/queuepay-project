import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'super_admin' && 'Gestion de la plateforme'}
            {user?.role === 'company_admin' && 'Gestion de votre entreprise'}
            {user?.role === 'agent' && 'Gestion de la file d\'attente'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.firstName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;