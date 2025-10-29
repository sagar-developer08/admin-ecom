'use client';

import React, { useState, useEffect, useRef } from 'react';
import MetricCard from './MetricCard';
import SystemHealth from './SystemHealth';
import LoadingScreen from './LoadingScreen';
import ErrorMessage from './ErrorMessage';
import RecentActivity from './RecentActivity';
import { useMetrics } from '../contexts/MetricsContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package,
  CreditCard,
  BarChart3,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import LineChart from './shared/LineChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SuperAdminDashboard = () => {
  const { metrics, loading, error, lastUpdated, refreshMetrics, formatMetricValue } = useMetrics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderStatusDistribution, setOrderStatusDistribution] = useState(null);
  const [userRoleDistribution, setUserRoleDistribution] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [trends, setTrends] = useState(null);
  const [vendorDistribution, setVendorDistribution] = useState([]);
  const [orderStatistics, setOrderStatistics] = useState([]);
  const [orderStatsPeriod, setOrderStatsPeriod] = useState('month');
  const [orderStatsGroupBy, setOrderStatsGroupBy] = useState('day');
  const hasFetchedAdditionalMetrics = useRef(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMetrics();
      // Reset the flag and fetch additional metrics on refresh
      hasFetchedAdditionalMetrics.current = false;
      await fetchAdditionalMetrics();
      await fetchRecentActivities();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAdditionalMetrics = async () => {
    try {
      console.log('Loading additional metrics from new service endpoints...');
      
      // Get token from localStorage
      let accessToken = null;
      if (typeof window !== 'undefined') {
        try {
          const storedTokens = localStorage.getItem('qliq-admin-tokens');
          if (storedTokens) {
            const tokens = JSON.parse(storedTokens);
            accessToken = tokens.accessToken;
          }
        } catch (err) {
          console.error('Error getting token from localStorage:', err);
        }
      }
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // New API endpoints - different services
      const cartServiceUrl = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api';
      // For metrics endpoints, use base URL without /auth suffix
      const authServiceUrl = (process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8888/api/auth').replace(/\/api\/auth$/, '/api');
      
      // Fetch all reports in parallel
      const [summaryRes, trendRes, statusRes, vendorDistRes, orderStatsRes] = await Promise.all([
        fetch(`${cartServiceUrl}/metrics/order-status-distribution?period=all`, { headers, credentials: 'include' }),
        fetch(`${authServiceUrl}/metrics/user-role-distribution?period=all`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/vendors/status-distribution`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/metrics/vendor-distribution?period=all`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/metrics/order-statistics?period=${orderStatsPeriod}&groupBy=${orderStatsGroupBy}`, { headers, credentials: 'include' })
      ]);
      
      if (!summaryRes.ok || !trendRes.ok) {
        throw new Error(`HTTP error! status: ${summaryRes.status}, ${trendRes.status}`);
      }
      
      const [orderStatusResult, userRoleResult, vendorDistResult, orderStatsResult] = await Promise.all([
        summaryRes.json(),
        trendRes.json(),
        vendorDistRes.ok ? vendorDistRes.json() : { success: true, data: { distribution: [] } },
        orderStatsRes.ok ? orderStatsRes.json() : { success: true, data: { statistics: [] } }
      ]);
      
      if (!orderStatusResult.success || !userRoleResult.success) {
        throw new Error('Failed to fetch additional metrics');
      }
      
      // Transform order status distribution data from new API format
      const orderStatusData = orderStatusResult.data?.distribution ? 
        orderStatusResult.data.distribution.map(item => ({
          status: item.status,
          count: item.count
        })) : [];
      
      // Transform user role distribution data from new API format
      const userRoleData = userRoleResult.data?.distribution ?
        userRoleResult.data.distribution.map(item => ({
          role: item.role,
          count: item.count
        })) : [];

      // Transform vendor distribution data
      const vendorDistData = vendorDistResult.data?.distribution || [];
      
      // Transform order statistics data
      const orderStatsData = orderStatsResult.data?.statistics || [];

      setOrderStatusDistribution(orderStatusData);
      setUserRoleDistribution(userRoleData);
      setVendorDistribution(vendorDistData);
      setOrderStatistics(orderStatsData);
      
      console.log('Additional metrics loaded successfully from new service endpoints');
      
    } catch (error) {
      console.error('Failed to load additional metrics from new service endpoints:', error);
      
      // Fallback to empty arrays if API fails
      setOrderStatusDistribution([]);
      setUserRoleDistribution([]);
      setVendorDistribution([]);
      setOrderStatistics([]);
    }
  };

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

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      console.log('Loading recent activities...');
      
      // Use fallback: Create activities based on available data
      const fallbackActivities = await createFallbackActivities();
      setRecentActivities(fallbackActivities);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const createFallbackActivities = async () => {
    try {
      const activities = [];
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const cartServiceUrl = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api';
      // For metrics endpoints, use base URL without /auth suffix
      const authServiceUrl = (process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8888/api/auth').replace(/\/api\/auth$/, '/api');

      // Get recent orders from cart service
      try {
        const ordersResponse = await fetch(`${cartServiceUrl}/orders/admin/all?limit=10&page=1`, { headers, credentials: 'include' });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          if (ordersData.success && ordersData.data) {
            const orders = Array.isArray(ordersData.data) ? ordersData.data : ordersData.data.orders || [];
            orders.slice(0, 5).forEach(order => {
              activities.push({
                type: 'order',
                message: `New order #${order.orderNumber || order._id?.slice(-6)} placed for $${order.totalAmount?.toFixed(2) || '0.00'}`,
                timestamp: order.createdAt,
                color: 'green',
                metadata: {
                  orderId: order._id,
                  amount: order.totalAmount
                }
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch orders for activities:', error);
      }

      // Get recent users from auth service
      try {
        const usersResponse = await fetch(`${authServiceUrl}/users?limit=5&role=user`, { headers, credentials: 'include' });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success && usersData.users) {
            usersData.users.forEach(user => {
              activities.push({
                type: 'user_registration',
                message: `New customer ${user.name || user.email} registered`,
                timestamp: user.createdAt || user.created_at,
                color: 'blue',
                metadata: {
                  userId: user.id || user._id
                }
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch users for activities:', error);
      }

      // Get recent vendors from auth service
      try {
        const vendorsResponse = await fetch(`${authServiceUrl}/users?limit=3&role=vendor`, { headers, credentials: 'include' });
        if (vendorsResponse.ok) {
          const vendorsData = await vendorsResponse.json();
          if (vendorsData.success && vendorsData.users) {
            vendorsData.users.forEach(vendor => {
              activities.push({
                type: 'vendor',
                message: `New vendor ${vendor.name || vendor.email} registered`,
                timestamp: vendor.createdAt || vendor.created_at,
                color: 'purple',
                metadata: {
                  userId: vendor.id || vendor._id
                }
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch vendors for activities:', error);
      }

      // Sort by timestamp and limit to 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error creating fallback activities:', error);
      return [];
    }
  };

  useEffect(() => {
    // Only fetch additional metrics once when component mounts and initial metrics are loaded
    if (metrics && !loading && !hasFetchedAdditionalMetrics.current) {
      hasFetchedAdditionalMetrics.current = true;
      fetchAdditionalMetrics();
      fetchRecentActivities();
    }
  }, [metrics, loading]); // Only depend on metrics and loading state

  useEffect(() => {
    // Refresh order statistics when period or groupBy changes
    if (metrics && !loading) {
      fetchAdditionalMetrics();
    }
  }, [orderStatsPeriod, orderStatsGroupBy]);

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Chart configurations
  // Order status colors mapping - colors assigned based on status from model
  const getOrderStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    const colorMap = {
      'pending': '#f59e0b',    // orange-500 for pending
      'rejected': '#ef4444',   // red-500 for rejected
      'cancelled': '#ef4444',  // red-500 for cancelled
      'accepted': '#10b981',   // emerald-500 for accepted
      'processing': '#3b82f6', // blue-500 for processing
      'shipped': '#8b5cf6',    // violet-500 for shipped
      'delivered': '#10b981', // emerald-500 for delivered
      'refunded': '#6b7280',   // gray-500 for refunded
      'other': '#ec4899'       // pink-500 for other
    };
    return colorMap[statusLower] || '#6b7280'; // default to gray if status not found
  };

  const userRoleColors = [
    '#3b82f6', // blue-500 for customer/user
    '#10b981', // emerald-500 for vendor
    '#8b5cf6', // violet-500 for admin
    '#f59e0b', // amber-500 for super_admin
    '#06b6d4', // cyan-500 for other roles
    '#ec4899'  // pink-500 for additional roles
  ];

  const orderStatusChartData = orderStatusDistribution ? {
    labels: orderStatusDistribution.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
    datasets: [
      {
        data: orderStatusDistribution.map(item => item.count),
        backgroundColor: orderStatusDistribution.map(item => getOrderStatusColor(item.status)),
        borderColor: orderStatusDistribution.map(item => getOrderStatusColor(item.status)),
        borderWidth: 1,
      },
    ],
  } : null;

  const userRoleChartData = userRoleDistribution ? {
    labels: userRoleDistribution.map(item => item.role.charAt(0).toUpperCase() + item.role.slice(1).replace('_', ' ')),
    datasets: [
      {
        data: userRoleDistribution.map(item => item.count),
        backgroundColor: userRoleColors,
        borderColor: userRoleColors.map(color => color),
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading && !metrics) {
    return <LoadingScreen message="Loading dashboard metrics..." />;
  }

  if (error && !metrics) {
    return <ErrorMessage error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
            <p className="text-blue-100">Welcome to the QLIQ Super Admin Dashboard</p>
            {/* <p className="text-blue-200 text-sm mt-1">Multi-vendor marketplace management</p> */}
            {lastUpdated && (
              <div className="flex items-center mt-2 text-blue-200 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Last updated: {formatLastUpdated(lastUpdated)}
              </div>
            )}
          </div>
          {/* <div className="flex space-x-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              + Add Vendor
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              System Settings
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Launch Tour
            </button>
          </div> */}
        </div>
      </div>

      {/* System Health Section */}
      <SystemHealth />

      {/* Global Snapshot Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Marketplace Overview</h3>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Some metrics may be outdated
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Revenue"
            value={formatMetricValue(metrics?.revenue?.total, 'currency') || 'Loading...'}
            subtitle={metrics?.revenue?.period || 'This month'}
            icon={DollarSign}
            trend={metrics?.revenue?.trend || 'up'}
            trendValue={metrics?.revenue?.trendValue || '+0%'}
            loading={loading}
          />
          <MetricCard
            title="Total Orders"
            value={formatMetricValue(metrics?.orders?.total, 'number') || 'Loading...'}
            subtitle={metrics?.orders?.period || 'This month'}
            icon={ShoppingBag}
            trend={metrics?.orders?.trend || 'up'}
            trendValue={metrics?.orders?.trendValue || '+0%'}
            loading={loading}
          />
          <MetricCard
            title="Active Campaigns"
            value={formatMetricValue(metrics?.campaigns?.active, 'number') || 'Loading...'}
            subtitle={metrics?.campaigns?.period || 'Running now'}
            icon={TrendingUp}
            trend={metrics?.campaigns?.trend || 'up'}
            trendValue={metrics?.campaigns?.trendValue || '+0'}
            loading={loading}
          />
          <MetricCard
            title="Payment Success Rate"
            value={formatMetricValue(metrics?.paymentSuccess?.rate, 'percentage') || 'Loading...'}
            subtitle={metrics?.paymentSuccess?.period || 'Last 24 hours'}
            icon={CreditCard}
            trend={metrics?.paymentSuccess?.trend || 'up'}
            trendValue={metrics?.paymentSuccess?.trendValue || '+0%'}
            loading={loading}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="New Users"
            value={formatMetricValue(metrics?.users?.new, 'number') || 'Loading...'}
            subtitle={metrics?.users?.period || 'This week'}
            icon={Users}
            trend={metrics?.users?.trend || 'up'}
            trendValue={metrics?.users?.trendValue || '+0%'}
            loading={loading}
          />
          <MetricCard
            title="New Vendors"
            value={formatMetricValue(metrics?.vendors?.new, 'number') || 'Loading...'}
            subtitle={metrics?.vendors?.period || 'This week'}
            icon={Store}
            trend={metrics?.vendors?.trend || 'up'}
            trendValue={metrics?.vendors?.trendValue || '+0%'}
            loading={loading}
          />
          <MetricCard
            title="Total Products"
            value={formatMetricValue(metrics?.products?.total, 'number') || 'Loading...'}
            subtitle={metrics?.products?.period || 'Active products'}
            icon={Package}
            trend={metrics?.products?.trend || 'up'}
            trendValue={metrics?.products?.trendValue || '+0%'}
            loading={loading}
          />
          <MetricCard
            title="Support Tickets"
            value={formatMetricValue(metrics?.supportTickets?.open, 'number') || 'Loading...'}
            subtitle={metrics?.supportTickets?.period || 'Open tickets'}
            icon={BarChart3}
            trend={metrics?.supportTickets?.trend || 'down'}
            trendValue={metrics?.supportTickets?.trendValue || '+0%'}
            loading={loading}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Distribution */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {orderStatusChartData && orderStatusChartData.datasets[0].data.length > 0 ? (
              <div className="h-80">
                <Doughnut data={orderStatusChartData} options={chartOptions} />
              </div>
            ) : orderStatusDistribution && orderStatusDistribution.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No order data available</div>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading order status data...</div>
            )}
          </div>
        </div>

        {/* User Role Distribution */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Role Distribution</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {userRoleChartData && userRoleChartData.datasets[0].data.length > 0 ? (
              <div className="h-80">
                <Bar data={userRoleChartData} options={chartOptions} />
              </div>
            ) : userRoleDistribution && userRoleDistribution.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No user data available</div>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading user role data...</div>
            )}
          </div>
        </div>
      </div>

      {/* New Charts Section - Vendor Distribution & Order Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vendor Distribution per Order */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Vendor Distribution per Order</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {vendorDistribution && vendorDistribution.length > 0 ? (
              <div className="h-80">
                <Bar 
                  data={{
                    labels: vendorDistribution.map(item => item.vendorName || 'Unknown'),
                    datasets: [
                      {
                        label: 'Orders',
                        data: vendorDistribution.map(item => item.orderCount),
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                      },
                      {
                        label: 'Revenue',
                        data: vendorDistribution.map(item => item.totalRevenue),
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        borderWidth: 1,
                      }
                    ]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No vendor distribution data available</div>
            )}
          </div>
        </div>

        {/* Order Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Order Statistics</h3>
            <div className="flex items-center space-x-2">
              <select
                value={orderStatsPeriod}
                onChange={(e) => setOrderStatsPeriod(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
              <select
                value={orderStatsGroupBy}
                onChange={(e) => setOrderStatsGroupBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="day">By Day</option>
                <option value="week">By Week</option>
                <option value="month">By Month</option>
                <option value="year">By Year</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {orderStatistics && orderStatistics.length > 0 ? (
              <div className="h-80">
                <LineChart 
                  data={orderStatistics.map(item => ({
                    name: item.label,
                    orders: item.orderCount,
                    revenue: item.paidRevenue
                  }))}
                  dataKeys={['orders', 'revenue']}
                  height={320}
                  colors={['#3b82f6', '#10b981']}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No order statistics data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Growth Trends */}
      {trends && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Growth Trends (Last 30 Days)</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trends.revenue && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatMetricValue(trends.revenue.growth, 'percentage')}
                  </div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                </div>
              )}
              {trends.orders && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatMetricValue(trends.orders.growth, 'percentage')}
                  </div>
                  <div className="text-sm text-gray-600">Orders Growth</div>
                </div>
              )}
              {trends.users && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatMetricValue(trends.users.growth, 'percentage')}
                  </div>
                  <div className="text-sm text-gray-600">Users Growth</div>
                </div>
              )}
              {trends.vendors && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatMetricValue(trends.vendors.growth, 'percentage')}
                  </div>
                  <div className="text-sm text-gray-600">Vendors Growth</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <RecentActivity 
        activities={recentActivities}
        loading={activitiesLoading}
        onRefresh={fetchRecentActivities}
        className="col-span-2"
      />
    </div>
  );
};

export default SuperAdminDashboard;
