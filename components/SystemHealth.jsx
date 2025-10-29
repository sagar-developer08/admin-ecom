import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const SystemHealth = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSystemHealth = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real system health data from admin API
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api'}/health/services`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch system health');
      }
      
      const staticSystemMetrics = result.data;
      
      setMetrics(staticSystemMetrics);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load system health from API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch only
    fetchSystemHealth();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'unhealthy':
        return 'text-red-600 bg-red-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">System Health</h3>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">System Health</h3>
        <div className="flex items-center space-x-4">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh}
            </span>
          )}
          <button
            onClick={fetchSystemHealth}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Overall System Status */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Overall System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {metrics.overall.healthPercentage}%
                </div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {metrics.overall.uptime}
                </div>
                <div className="text-sm text-gray-600">Avg Uptime (s)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {metrics.overall.averageResponseTime}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.summary.healthy}/{metrics.summary.total}
                </div>
                <div className="text-sm text-gray-600">Services Online</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics && Object.entries(metrics.services).map(([key, service]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  {getStatusIcon(service.status)}
                  <span>{service.name}</span>
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">{service.uptime}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Response:</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-medium">{service.port}</span>
                </div>
                {service.lastCheck && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Check:</span>
                    <span className="font-medium text-xs">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service URLs for Reference - Commented out for now */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Service Endpoints</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics && Object.entries(metrics.services).map(([key, service]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">{service.url}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Port {service.port}</div>
                  <div className="text-xs text-gray-600">
                    {service.status === 'healthy' ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
};

export default SystemHealth;
