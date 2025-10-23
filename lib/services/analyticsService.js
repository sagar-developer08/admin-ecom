/**
 * Analytics Service
 * Handles all analytics-related API calls
 */

import { metricsApi } from '../apiClient';

export const analyticsService = {
  // Get vendor analytics dashboard
  getVendorAnalytics: async (vendorId, params = {}) => {
    return await metricsApi.get(`/vendor/analytics`, params);
  },

  // Get marketplace metrics
  getMarketplaceMetrics: async (params = {}) => {
    return await metricsApi.get('/metrics/marketplace', params);
  },

  // Get revenue metrics
  getRevenueMetrics: async (params = {}) => {
    return await metricsApi.get('/metrics/revenue', params);
  },

  // Get user growth metrics
  getUserGrowthMetrics: async (params = {}) => {
    return await metricsApi.get('/metrics/user-growth', params);
  },

  // Get sales reports
  getSalesReport: async (params = {}) => {
    return await metricsApi.get('/reports/sales', params);
  },

  // Get vendor performance report
  getVendorReport: async (params = {}) => {
    return await metricsApi.get('/reports/vendor', params);
  },

  // Get product performance report
  getProductReport: async (params = {}) => {
    return await metricsApi.get('/reports/product', params);
  }
};

export default analyticsService;
