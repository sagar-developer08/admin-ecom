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
      
      console.log('🔍 Fetching marketplace metrics from individual endpoints...');
      
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
      
      // Fetch individual metrics in parallel for better performance
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('✅ [Metrics] Token found, length:', accessToken.length);
      } else {
        console.warn('⚠️ [Metrics] No access token found in localStorage');
      }
      
      // New API endpoints - different services
      const cartServiceUrl = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api';
      // For metrics endpoints, use base URL without /auth suffix
      const authServiceUrl = (process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8888/api/auth').replace(/\/api\/auth$/, '/api');
      const productServiceUrl = process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'http://localhost:8082/api';
      
      console.log('🔗 [Metrics] Calling services:', {
        cart: cartServiceUrl,
        auth: authServiceUrl,
        product: productServiceUrl
      });
      
      // Call individual endpoints from new services in parallel
      const [revenueRes, ordersRes, usersRes, vendorsRes, productsRes, paymentRes] = await Promise.all([
        fetch(`${cartServiceUrl}/metrics/revenue?period=all`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/metrics/orders?period=all`, { headers, credentials: 'include' }),
        fetch(`${authServiceUrl}/metrics/new-users?period=all`, { headers, credentials: 'include' }),
        fetch(`${authServiceUrl}/metrics/new-vendors?period=all`, { headers, credentials: 'include' }),
        fetch(`${productServiceUrl}/metrics/total-products?period=all`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/metrics/payment-success-rate?period=all`, { headers, credentials: 'include' })
      ]);

      // Parse all responses
      const [revenueData, ordersData, usersData, vendorsData, productsData, paymentData] = await Promise.all([
        revenueRes.json(),
        ordersRes.json(),
        usersRes.json(),
        vendorsRes.json(),
        productsRes.json(),
        paymentRes.json()
      ]);

      // Check for errors
      const responses = [revenueRes, ordersRes, usersRes, vendorsRes, productsRes, paymentRes];
      const failedResponses = responses.filter(res => !res.ok);
      
      if (failedResponses.length > 0) {
        throw new Error(`Some metrics failed to load: ${failedResponses.map(r => r.status).join(', ')}`);
      }

      // Extract data from new API responses
      const metricsData = {
        totalRevenue: revenueData.data?.totalRevenue || 0,
        revenueGrowth: revenueData.data?.growthPercentage || 0,
        revenueDirection: revenueData.data?.growthDirection || 'up',
        revenuePeriod: revenueData.data?.period || 'all',
        
        totalOrders: ordersData.data?.totalOrders || 0,
        ordersGrowth: ordersData.data?.growthPercentage || 0,
        ordersDirection: ordersData.data?.growthDirection || 'up',
        ordersPeriod: ordersData.data?.period || 'all',
        
        newUsers: usersData.data?.newUsers || 0,
        usersGrowth: usersData.data?.growthPercentage || 0,
        usersDirection: usersData.data?.growthDirection || 'up',
        usersPeriod: usersData.data?.period || 'all',
        
        newVendors: vendorsData.data?.newVendors || 0,
        vendorsGrowth: vendorsData.data?.growthPercentage || 0,
        vendorsDirection: vendorsData.data?.growthDirection || 'up',
        vendorsPeriod: vendorsData.data?.period || 'all',
        
        totalProducts: productsData.data?.totalProducts || 0,
        productsGrowth: productsData.data?.growthPercentage || 0,
        productsDirection: productsData.data?.growthDirection || 'up',
        productsPeriod: productsData.data?.period || 'all',
        
        paymentSuccessRate: paymentData.data?.successRate || 0,
        paymentPeriod: paymentData.data?.period || 'all',
        
        activeCampaigns: 12, // Static for now
        supportTickets: 8 // Static for now
      };
      
      // Helper function to format growth percentage
      const formatGrowth = (value, direction) => {
        const sign = direction === 'up' ? '+' : '-';
        return `${sign}${Math.abs(value).toFixed(1)}%`;
      };
      
      // Transform the data to match the expected format
      const transformedMetrics = {
        revenue: {
          total: metricsData.totalRevenue,
          period: metricsData.revenuePeriod === 'all' ? 'All time' : metricsData.revenuePeriod,
          trend: metricsData.revenueDirection,
          trendValue: formatGrowth(metricsData.revenueGrowth, metricsData.revenueDirection)
        },
        orders: {
          total: metricsData.totalOrders,
          period: metricsData.ordersPeriod === 'all' ? 'All time' : metricsData.ordersPeriod,
          trend: metricsData.ordersDirection,
          trendValue: formatGrowth(metricsData.ordersGrowth, metricsData.ordersDirection)
        },
        campaigns: {
          active: metricsData.activeCampaigns,
          period: 'Running now',
          trend: 'up',
          trendValue: '+0' // Static for now
        },
        paymentSuccess: {
          rate: metricsData.paymentSuccessRate,
          period: metricsData.paymentPeriod === 'all' ? 'All time' : 'Last 24 hours',
          trend: 'up',
          trendValue: '+0%' // Payment success rate doesn't have growth comparison yet
        },
        users: {
          new: metricsData.newUsers,
          period: metricsData.usersPeriod === 'all' ? 'All time' : metricsData.usersPeriod,
          trend: metricsData.usersDirection,
          trendValue: formatGrowth(metricsData.usersGrowth, metricsData.usersDirection)
        },
        vendors: {
          new: metricsData.newVendors,
          period: metricsData.vendorsPeriod === 'all' ? 'All time' : metricsData.vendorsPeriod,
          trend: metricsData.vendorsDirection,
          trendValue: formatGrowth(metricsData.vendorsGrowth, metricsData.vendorsDirection)
        },
        products: {
          total: metricsData.totalProducts,
          period: metricsData.productsPeriod === 'all' ? 'Active products' : 'Active products',
          trend: metricsData.productsDirection,
          trendValue: formatGrowth(metricsData.productsGrowth, metricsData.productsDirection)
        },
        supportTickets: {
          open: metricsData.supportTickets,
          period: 'Open tickets',
          trend: 'down',
          trendValue: '+0%' // Static for now
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