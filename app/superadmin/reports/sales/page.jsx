'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import StatsCard from '../../../../components/shared/StatsCard';
import LineChart from '../../../../components/shared/LineChart';
import BarChart from '../../../../components/shared/BarChart';
import PieChart from '../../../../components/shared/PieChart';
import ExportButton from '../../../../components/shared/ExportButton';
import { DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { reportApi } from '../../../../lib/apiClient';

export default function SalesReportsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalProducts: 0
  });
  
  // Sample data - replace with actual API calls
  const salesData = [
    { name: 'Mon', sales: 4000, orders: 24 },
    { name: 'Tue', sales: 3000, orders: 18 },
    { name: 'Wed', sales: 5000, orders: 32 },
    { name: 'Thu', sales: 2780, orders: 15 },
    { name: 'Fri', sales: 6890, orders: 41 },
    { name: 'Sat', sales: 8390, orders: 52 },
    { name: 'Sun', sales: 7490, orders: 45 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 400 },
    { name: 'Fashion', value: 300 },
    { name: 'Home', value: 200 },
    { name: 'Sports', value: 150 },
    { name: 'Books', value: 100 },
  ];

  const vendorData = [
    { name: 'Vendor A', revenue: 12000 },
    { name: 'Vendor B', revenue: 9800 },
    { name: 'Vendor C', revenue: 8500 },
    { name: 'Vendor D', revenue: 7200 },
    { name: 'Vendor E', revenue: 6100 },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchReports();
    }
  }, [user, isLoading, router, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await reportApi.get('/sales', { period: dateRange });
      
      // Sample stats
      setStats({
        totalRevenue: 43550,
        totalOrders: 227,
        avgOrderValue: 192,
        totalProducts: 1250
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="superadmin"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="superadmin"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive sales performance analysis</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <ExportButton data={salesData} filename="sales-report" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+12.5%"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color="blue"
              trend="up"
              trendValue="+8.3%"
            />
            <StatsCard
              title="Avg Order Value"
              value={`$${stats.avgOrderValue}`}
              icon={TrendingUp}
              color="purple"
              trend="up"
              trendValue="+3.2%"
            />
            <StatsCard
              title="Products Sold"
              value={stats.totalProducts}
              icon={Package}
              color="indigo"
              trend="up"
              trendValue="+15.7%"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
              <LineChart data={salesData} dataKeys={['sales', 'orders']} height={300} />
            </div>

            {/* Top Vendors Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Vendors by Revenue</h3>
              <BarChart data={vendorData} dataKeys={['revenue']} height={300} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
              <PieChart data={categoryData} height={300} />
            </div>

            {/* Sales Summary Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Best Selling Day</span>
                  <span className="font-semibold">Saturday</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Peak Sales Hour</span>
                  <span className="font-semibold">2 PM - 4 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Top Category</span>
                  <span className="font-semibold">Electronics</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Top Vendor</span>
                  <span className="font-semibold">Vendor A</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-green-600">3.8%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Return Rate</span>
                  <span className="font-semibold text-red-600">2.1%</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

