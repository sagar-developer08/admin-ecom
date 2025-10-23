'use client';

import React, { useState, useEffect, useRef } from 'react';
import MetricCard from './MetricCard';
import SystemHealth from './SystemHealth';
import LoadingScreen from './LoadingScreen';
import ErrorMessage from './ErrorMessage';
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
      console.log('Loading additional metrics from admin API...');
      
      // Fetch real data from the admin API
      const response = await fetch('http://localhost:8009/api/metrics/marketplace?period=all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch additional metrics');
      }
      
      const metricsData = result.data;
      
      // Transform order status distribution data
      const orderStatusData = metricsData.orderStatusDistribution ? 
        Object.entries(metricsData.orderStatusDistribution).map(([status, count]) => ({
          status,
          count
        })) : [];
      
      // Transform user role distribution data
      const userRoleData = metricsData.userRoleDistribution ?
        Object.entries(metricsData.userRoleDistribution).map(([role, count]) => ({
          role,
          count
        })) : [];

      setOrderStatusDistribution(orderStatusData);
      setUserRoleDistribution(userRoleData);
      
      console.log('Additional metrics loaded successfully from admin API');
      
    } catch (error) {
      console.error('Failed to load additional metrics from admin API:', error);
      
      // Fallback to empty arrays if API fails
      setOrderStatusDistribution([]);
      setUserRoleDistribution([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      console.log('Loading recent activities from admin API...');
      
      const response = await fetch('http://localhost:8009/api/activities/recent?limit=10&period=day');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch recent activities');
      }
      
      setRecentActivities(result.data.activities || []);
      console.log('Recent activities loaded successfully from admin API');
      
    } catch (error) {
      console.error('Failed to load recent activities from admin API:', error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
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
  const orderStatusColors = [
    '#ef4444', // red-500 for completed
    '#f59e0b', // amber-500 for processing  
    '#10b981', // emerald-500 for shipped
    '#3b82f6', // blue-500 for pending
    '#6b7280'  // gray-500 for cancelled
  ];

  const userRoleColors = [
    '#ef4444', // red-500 for customer
    '#f59e0b', // amber-500 for vendor
    '#10b981', // emerald-500 for admin
    '#8b5cf6'  // violet-500 for super_admin
  ];

  const orderStatusChartData = orderStatusDistribution ? {
    labels: orderStatusDistribution.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
    datasets: [
      {
        data: orderStatusDistribution.map(item => item.count),
        backgroundColor: orderStatusColors,
        borderColor: orderStatusColors.map(color => color),
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
                <Doughnut data={userRoleChartData} options={chartOptions} />
              </div>
            ) : userRoleDistribution && userRoleDistribution.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No user data available</div>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading user role data...</div>
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
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Marketplace Activity</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activitiesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading activities...</div>
          ) : recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between py-3 ${
                    index < recentActivities.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.color === 'green' ? 'bg-green-500' :
                      activity.color === 'blue' ? 'bg-blue-500' :
                      activity.color === 'purple' ? 'bg-purple-500' :
                      activity.color === 'yellow' ? 'bg-yellow-500' :
                      activity.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">{activity.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent activities</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
