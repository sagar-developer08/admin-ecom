'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import SuperAdminDashboard from '../../components/SuperAdminDashboard';

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect after loading is complete and we're sure there's no user
    if (!isLoading && !user) {
      console.log('No user found after loading, redirecting to login');
      router.push('/login');
      return;
    }

    // Redirect to vendor dashboard if user is vendor
    if (!isLoading && user && user.role === 'vendor') {
      router.push('/vendor');
      return;
    }
  }, [user, isLoading, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show Super Admin Dashboard
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        userType="superadmin"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          onMenuClick={toggleSidebar} 
          userType="superadmin"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user.name}
                </p>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{user.avatar}</span>
                </div>
              </div>
            </div>
          </div>

          <SuperAdminDashboard />
        </main>
      </div>
    </div>
  );
}
