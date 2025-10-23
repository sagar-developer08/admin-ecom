'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const MetricsContext = createContext();

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
};

export const MetricsProvider = ({ children }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching marketplace metrics...');
      
      // Get token from localStorage (simple approach)
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
      
      // Fetch real metrics data from admin API with authentication
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch('http://localhost:8009/api/metrics/marketplace?period=all', {
        headers,
        credentials: 'include', // Include cookies in the request
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch marketplace metrics');
      }
      
      const metricsData = result.data;
      
      // Transform the data to match the expected format
      const transformedMetrics = {
        revenue: {
          total: metricsData.totalRevenue,
          period: 'All time',
          trend: 'up',
          trendValue: '+12.5%' // This would come from comparison with previous period
        },
        orders: {
          total: metricsData.totalOrders,
          period: 'All time',
          trend: 'up',
          trendValue: '+8.3%'
        },
        campaigns: {
          active: metricsData.activeCampaigns,
          period: 'Running now',
          trend: 'up',
          trendValue: '+2'
        },
        paymentSuccess: {
          rate: metricsData.paymentSuccessRate,
          period: 'Last 24 hours',
          trend: 'up',
          trendValue: '+0.3%'
        },
        users: {
          new: metricsData.newUsers,
          period: 'All time',
          trend: 'up',
          trendValue: '+15.2%'
        },
        vendors: {
          new: metricsData.newVendors,
          period: 'All time',
          trend: 'up',
          trendValue: '+7.8%'
        },
        products: {
          total: metricsData.totalProducts,
          period: 'Active products',
          trend: 'up',
          trendValue: '+5.2%'
        },
        supportTickets: {
          open: metricsData.supportTickets,
          period: 'Open tickets',
          trend: 'down',
          trendValue: '-12%'
        }
      };
      
      console.log('✅ Marketplace metrics loaded:', transformedMetrics);
      
      setMetrics(transformedMetrics);
      setLastUpdated(new Date().toISOString());
      
    } catch (error) {
      console.error('❌ Failed to load marketplace metrics:', error);
      setError(error.message);
      
      // Set fallback metrics in case of error
      setMetrics({
        revenue: { total: 0, period: 'All time', trend: 'up', trendValue: '+0%' },
        orders: { total: 0, period: 'All time', trend: 'up', trendValue: '+0%' },
        campaigns: { active: 0, period: 'Running now', trend: 'up', trendValue: '+0' },
        paymentSuccess: { rate: 0, period: 'Last 24 hours', trend: 'up', trendValue: '+0%' },
        users: { new: 0, period: 'All time', trend: 'up', trendValue: '+0%' },
        vendors: { new: 0, period: 'All time', trend: 'up', trendValue: '+0%' },
        products: { total: 0, period: 'Active products', trend: 'up', trendValue: '+0%' },
        supportTickets: { open: 0, period: 'Open tickets', trend: 'down', trendValue: '+0%' }
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    await fetchMetrics();
  };

  const formatMetricValue = (value, type = 'number') => {
    if (value === null || value === undefined) return '0';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-AE', {
          style: 'currency',
          currency: 'AED',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      
      case 'percentage':
        return `${value}%`;
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      
      default:
        return value.toString();
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const value = {
    metrics,
    loading,
    error,
    lastUpdated,
    refreshMetrics,
    formatMetricValue
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
};