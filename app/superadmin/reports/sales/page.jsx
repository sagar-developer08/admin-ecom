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
import { DollarSign, TrendingUp, ShoppingCart, Package, Calendar } from 'lucide-react';

export default function SalesReportsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [groupBy, setGroupBy] = useState('day');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalRevenueGrowth: 0,
    totalOrders: 0,
    totalOrdersGrowth: 0,
    avgOrderValue: 0,
    avgOrderValueGrowth: 0,
    productsSold: 0
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [quickSummary, setQuickSummary] = useState(null);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedTokens = localStorage.getItem('qliq-admin-tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          return tokens.accessToken;
        }
      } catch (err) {
        console.error('Error getting token:', err);
      }
    }
    return null;
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'super_admin' && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchAllReports();
    }
  }, [user, isLoading, router, period, groupBy]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const cartServiceUrl = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api';

      // Fetch all reports in parallel
      const [summaryRes, trendRes, vendorsRes, categoryRes, quickSummaryRes] = await Promise.all([
        fetch(`${cartServiceUrl}/reports/sales/summary?period=${period}`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/sales/trend?period=${period}&groupBy=${groupBy}`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/sales/top-vendors?period=${period}&limit=5`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/sales/by-category?period=${period}`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/sales/quick-summary?period=${period}`, { headers, credentials: 'include' })
      ]);

      // Check if responses are ok
      if (!summaryRes.ok) {
        throw new Error(`Summary API error: ${summaryRes.status}`);
      }

      const [summaryData, trendData, vendorsData, categoryData, quickSummaryData] = await Promise.all([
        summaryRes.json(),
        trendRes.ok ? trendRes.json() : { success: true, data: { trend: [] } },
        vendorsRes.ok ? vendorsRes.json() : { success: true, data: { vendors: [] } },
        categoryRes.ok ? categoryRes.json() : { success: true, data: { categories: [] } },
        quickSummaryRes.ok ? quickSummaryRes.json() : { success: true, data: null }
      ]);

      if (summaryData.success) {
        setStats({
          totalRevenue: summaryData.data.totalRevenue || 0,
          totalRevenueGrowth: summaryData.data.totalRevenueGrowth || 0,
          totalOrders: summaryData.data.totalOrders || 0,
          totalOrdersGrowth: summaryData.data.totalOrdersGrowth || 0,
          avgOrderValue: summaryData.data.avgOrderValue || 0,
          avgOrderValueGrowth: summaryData.data.avgOrderValueGrowth || 0,
          productsSold: summaryData.data.productsSold || 0
        });
      }

      if (trendData.success) {
        const formattedTrend = trendData.data.trend.map(item => ({
          name: item.label,
          sales: item.revenue,
          orders: item.orders
        }));
        setSalesTrend(formattedTrend);
      }

      if (vendorsData.success) {
        const formattedVendors = vendorsData.data.vendors.map(v => ({
          name: v.vendorName || `Vendor ${v.rank}`,
          revenue: v.revenue
        }));
        setTopVendors(formattedVendors);
      }

      if (categoryData.success) {
        const formattedCategories = categoryData.data.categories.map(cat => ({
          name: cat.name,
          value: cat.revenue,
          percentage: cat.percentage
        }));
        setCategorySales(formattedCategories);
      }

      if (quickSummaryData.success && quickSummaryData.data) {
        setQuickSummary(quickSummaryData.data);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatGrowth = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Use quick summary from API if available
  const summary = quickSummary || {
    bestSellingDay: 'N/A',
    peakSalesHour: 'N/A',
    topCategory: 'N/A',
    topVendor: 'N/A',
    totalRevenue: stats.totalRevenue,
    totalOrders: stats.totalOrders,
    productsSold: stats.productsSold
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales reports...</p>
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
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              {period !== 'today' && (
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="day">By Day</option>
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                </select>
              )}
              <ExportButton data={salesTrend} filename="sales-report" />
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p>Error loading reports: {error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={DollarSign}
              color="green"
              trend={stats.totalRevenueGrowth >= 0 ? 'up' : 'down'}
              trendValue={formatGrowth(stats.totalRevenueGrowth)}
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingCart}
              color="blue"
              trend={stats.totalOrdersGrowth >= 0 ? 'up' : 'down'}
              trendValue={formatGrowth(stats.totalOrdersGrowth)}
            />
            <StatsCard
              title="Avg Order Value"
              value={formatCurrency(stats.avgOrderValue)}
              icon={TrendingUp}
              color="purple"
              trend={stats.avgOrderValueGrowth >= 0 ? 'up' : 'down'}
              trendValue={formatGrowth(stats.avgOrderValueGrowth)}
            />
            <StatsCard
              title="Products Sold"
              value={stats.productsSold.toLocaleString()}
              icon={Package}
              color="indigo"
              trend="up"
              trendValue="--"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
              {salesTrend.length > 0 ? (
                <LineChart 
                  data={salesTrend} 
                  dataKeys={['sales', 'orders']} 
                  height={300}
                />
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No sales data available for selected period
                </div>
              )}
            </div>

            {/* Top Vendors Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Vendors by Revenue</h3>
              {topVendors.length > 0 ? (
                <BarChart 
                  data={topVendors} 
                  dataKeys={['revenue']} 
                  height={300}
                />
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No vendor data available
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
              {categorySales.length > 0 ? (
                <>
                  <PieChart data={categorySales} height={250} />
                  <div className="mt-4 space-y-2">
                    {categorySales.map((cat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                            }}
                          />
                          <span className="text-sm text-gray-700">{cat.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{cat.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-250 flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              )}
            </div>

            {/* Sales Summary Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Best Selling Day</span>
                  <span className="font-semibold">{summary.bestSellingDay || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Peak Sales Hour</span>
                  <span className="font-semibold">{summary.peakSalesHour || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Top Category</span>
                  <span className="font-semibold">{summary.topCategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Top Vendor</span>
                  <span className="font-semibold">{summary.topVendor || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">{formatCurrency(summary.totalRevenue || stats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold">{summary.totalOrders || stats.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Products Sold</span>
                  <span className="font-semibold">{summary.productsSold || stats.productsSold}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}