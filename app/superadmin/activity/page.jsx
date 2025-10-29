'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import RecentActivity from '../../../components/RecentActivity';
import LoadingScreen from '../../../components/LoadingScreen';
import ErrorMessage from '../../../components/ErrorMessage';
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const MarketplaceActivityPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('day');
  const [activityStats, setActivityStats] = useState(null);
  const [activityTrends, setActivityTrends] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchActivities();
      fetchActivityStats();
      fetchActivityTrends();
    }
  }, [user, isLoading, router, timeRange]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching marketplace activities...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api'}/activities/recent?limit=50&period=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch activities');
      }
      
      setActivities(result.data.activities || []);
      console.log('✅ Activities loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      console.log('📈 Fetching activity statistics...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api'}/activities/statistics?period=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch activity statistics');
      }
      
      setActivityStats(result.data);
      console.log('✅ Activity statistics loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching activity statistics:', error);
    }
  };

  const fetchActivityTrends = async () => {
    try {
      console.log('📊 Fetching activity trends...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api'}/activities/trends?days=7`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch activity trends');
      }
      
      setActivityTrends(result.data);
      console.log('✅ Activity trends loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching activity trends:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchActivities(),
        fetchActivityStats(),
        fetchActivityTrends()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeRangeChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  const exportActivities = () => {
    const csvContent = [
      ['Type', 'Message', 'Timestamp', 'Metadata'].join(','),
      ...activities.map(activity => [
        activity.type,
        `"${activity.message}"`,
        activity.timestamp,
        activity.metadata ? JSON.stringify(activity.metadata) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketplace-activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                Marketplace Activity
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor all activities happening across your ecommerce platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportActivities}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <div className="flex gap-2">
              {[
                { key: 'hour', label: 'Last Hour' },
                { key: 'day', label: 'Last 24 Hours' },
                { key: 'week', label: 'Last Week' },
                { key: 'month', label: 'Last Month' },
                { key: 'all', label: 'All Time' }
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleTimeRangeChange(range.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {activityStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{activityStats.totalActivities}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{activityStats.activityTypes.orders}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">{activityStats.activityTypes.users}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products Added</p>
                  <p className="text-2xl font-bold text-gray-900">{activityStats.activityTypes.products}</p>
                </div>
                <Filter className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentActivity 
              activities={activities}
              loading={loading}
              onRefresh={fetchActivities}
              className="h-full"
              enableRealTime={true}
            />
          </div>
          
          {/* Activity Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Activity Trends
            </h3>
            {activityTrends ? (
              <div className="space-y-4">
                {activityTrends.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{trend.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (trend.totalActivities / Math.max(...activityTrends.trends.map(t => t.totalActivities))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {trend.totalActivities}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Loading trends...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceActivityPage;
