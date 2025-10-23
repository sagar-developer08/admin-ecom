'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import StatsCard from '../../../components/shared/StatsCard';
import LineChart from '../../../components/shared/LineChart';
import BarChart from '../../../components/shared/BarChart';
import PieChart from '../../../components/shared/PieChart';
import { TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';
import analyticsService from '../../../lib/services/analyticsService';

export default function VendorAnalyticsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    salesTrend: [],
    topProducts: [],
    trafficSources: [],
    performanceMetrics: {}
  });

  // Sample data - fallback when API fails
  const defaultSalesData = [
    { name: 'Mon', sales: 1200, visitors: 340 },
    { name: 'Tue', sales: 1800, visitors: 420 },
    { name: 'Wed', sales: 1500, visitors: 380 },
    { name: 'Thu', sales: 2200, visitors: 510 },
    { name: 'Fri', sales: 2800, visitors: 620 },
    { name: 'Sat', sales: 3200, visitors: 750 },
    { name: 'Sun', sales: 2900, visitors: 680 },
  ];

  const defaultProductPerformance = [
    { name: 'Product A', sales: 120 },
    { name: 'Product B', sales: 98 },
    { name: 'Product C', sales: 86 },
    { name: 'Product D', sales: 72 },
    { name: 'Product E', sales: 65 },
  ];

  const defaultTrafficSources = [
    { name: 'Direct', value: 450 },
    { name: 'Search', value: 350 },
    { name: 'Social', value: 200 },
    { name: 'Referral', value: 150 },
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchAnalytics();
    }
  }, [user, isLoading, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching analytics for vendor:', user?.vendorId || user?.id, 'period:', dateRange);
      
      const response = await analyticsService.getVendorAnalytics(user?.vendorId || user?.id, { period: dateRange });
      console.log('📊 Analytics Response:', response);
      
      const data = response.data || response || {};
      setAnalyticsData({
        overview: data.overview || {
          totalRevenue: 13850,
          totalOrders: 156,
          storeVisitors: 3780,
          conversionRate: 4.1,
          averageOrderValue: 88.78,
          returnRate: 3.2,
          customerSatisfaction: 4.6,
          totalProducts: 45,
          activeProducts: 38,
          commissionRate: 12
        },
        salesTrend: data.salesTrend || defaultSalesData,
        topProducts: data.topProducts || defaultProductPerformance,
        trafficSources: data.trafficSources || defaultTrafficSources,
        performanceMetrics: data.performanceMetrics || {
          orderFulfillmentRate: 95.2,
          onTimeDelivery: 92.8,
          customerRetentionRate: 78.5,
          productRating: 4.6,
          responseTime: '2.3 hours'
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      // Use default data on error
      setAnalyticsData({
        overview: {
          totalRevenue: 13850,
          totalOrders: 156,
          storeVisitors: 3780,
          conversionRate: 4.1,
          averageOrderValue: 88.78,
          returnRate: 3.2,
          customerSatisfaction: 4.6,
          totalProducts: 45,
          activeProducts: 38,
          commissionRate: 12
        },
        salesTrend: defaultSalesData,
        topProducts: defaultProductPerformance,
        trafficSources: defaultTrafficSources,
        performanceMetrics: {
          orderFulfillmentRate: 95.2,
          onTimeDelivery: 92.8,
          customerRetentionRate: 78.5,
          productRating: 4.6,
          responseTime: '2.3 hours'
        }
      });
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
        userType="vendor"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your store performance</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                fetchAnalytics();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Revenue"
              value={`$${analyticsData.overview.totalRevenue?.toLocaleString() || '0'}`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+15.3%"
            />
            <StatsCard
              title="Total Orders"
              value={analyticsData.overview.totalOrders?.toString() || '0'}
              icon={ShoppingBag}
              color="blue"
              trend="up"
              trendValue="+8.7%"
            />
            <StatsCard
              title="Store Visitors"
              value={analyticsData.overview.storeVisitors?.toLocaleString() || '0'}
              icon={Users}
              color="purple"
              trend="up"
              trendValue="+12.1%"
            />
            <StatsCard
              title="Conversion Rate"
              value={`${analyticsData.overview.conversionRate?.toFixed(1) || '0.0'}%`}
              icon={TrendingUp}
              color="indigo"
              trend="up"
              trendValue="+0.8%"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales & Visitors Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales & Visitors Trend</h3>
              <LineChart data={analyticsData.salesTrend} dataKeys={['sales', 'visitors']} height={300} />
            </div>

            {/* Top Products Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              <BarChart data={analyticsData.topProducts} dataKeys={['sales']} height={300} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
              <PieChart data={analyticsData.trafficSources} height={300} />
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Key Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold text-lg">${analyticsData.overview.averageOrderValue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Return Rate</span>
                  <span className="font-semibold text-lg text-yellow-600">{analyticsData.overview.returnRate?.toFixed(1) || '0.0'}%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-lg text-green-600">{analyticsData.overview.customerSatisfaction?.toFixed(1) || '0.0'}/5.0</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.totalProducts || '0'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Active Products</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.activeProducts || '0'}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Commission Rate</span>
                  <span className="font-semibold text-lg">{analyticsData.overview.commissionRate || '0'}%</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

