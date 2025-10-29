'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ShoppingCart, 
  User, 
  Package, 
  Star, 
  Store, 
  CreditCard, 
  AlertTriangle,
  Clock,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

const RecentActivity = ({ 
  activities = [], 
  loading = false, 
  onRefresh, 
  className = ''
}) => {
  const [filteredActivities, setFilteredActivities] = useState(activities);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activityTypes = [
    { key: 'all', label: 'All Activities', icon: Activity, color: 'gray' },
    { key: 'order', label: 'Orders', icon: ShoppingCart, color: 'blue' },
    { key: 'user_registration', label: 'Users', icon: User, color: 'green' },
    { key: 'product', label: 'Products', icon: Package, color: 'purple' },
    { key: 'review', label: 'Reviews', icon: Star, color: 'yellow' },
    { key: 'vendor', label: 'Vendors', icon: Store, color: 'indigo' },
    { key: 'payment', label: 'Payments', icon: CreditCard, color: 'green' },
    { key: 'inventory', label: 'Inventory', icon: AlertTriangle, color: 'orange' }
  ];

  // Update filtered activities when activities or selectedFilter changes
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(activity => activity.type === selectedFilter));
    }
  }, [activities, selectedFilter]);

  const getActivityIcon = (type) => {
    const activityType = activityTypes.find(t => t.key === type);
    return activityType ? activityType.icon : Activity;
  };

  const getActivityColor = (type) => {
    const activityType = activityTypes.find(t => t.key === type);
    return activityType ? activityType.color : 'gray';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const displayedActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 5);

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Marketplace Activity
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Recent Marketplace Activity
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh activities"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {activityTypes.map((type) => {
          const Icon = type.icon;
          const isActive = selectedFilter === type.key;
          const count = type.key === 'all' 
            ? activities.length 
            : activities.filter(a => a.type === type.key).length;

          return (
            <button
              key={type.key}
              onClick={() => handleFilterChange(type.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? `bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {type.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? `bg-${type.color}-200 text-${type.color}-800` : 'bg-gray-300 text-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No activities found for the selected filter</p>
          </div>
        ) : (
          displayedActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);
            const colorClasses = {
              blue: 'text-blue-600 bg-blue-100',
              green: 'text-green-600 bg-green-100',
              purple: 'text-purple-600 bg-purple-100',
              yellow: 'text-yellow-600 bg-yellow-100',
              indigo: 'text-indigo-600 bg-indigo-100',
              orange: 'text-orange-600 bg-orange-100',
              red: 'text-red-600 bg-red-100',
              gray: 'text-gray-600 bg-gray-100'
            };

            return (
              <div
                key={`${activity.timestamp}-${index}`}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${colorClasses[color]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium leading-5">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                    {activity.metadata && (
                      <div className="flex items-center gap-1">
                        {activity.metadata.orderId && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Order #{activity.metadata.orderId.slice(-6)}
                          </span>
                        )}
                        {activity.metadata.amount && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {activity.metadata.amount}
                          </span>
                        )}
                        {activity.metadata.rating && (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                            {activity.metadata.rating}★
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {activity.metadata && (
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Show More/Less Button */}
      {filteredActivities.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show More ({filteredActivities.length - 5} more)
              </>
            )}
          </button>
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {displayedActivities.length} of {filteredActivities.length} activities
          </span>
          <span className="text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;