import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';

const Header = ({ onMenuClick, userType = 'superadmin', user }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gray-900">
              {userType === 'superadmin' ? 'Super Admin Dashboard' : 'Vendor Dashboard'}
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-md hover:bg-gray-100 relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user ? user.avatar : 'A'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user ? user.name : (userType === 'superadmin' ? 'Super Admin' : 'Vendor')}
              </p>
              <p className="text-xs text-gray-500">
                {user ? user.email : 'admin@qliq.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
