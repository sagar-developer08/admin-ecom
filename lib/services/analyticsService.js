/**
 * Analytics Service
 * Handles all analytics-related API calls
 * 
 * NOTE: Main dashboard metrics now use direct API calls to individual services:
 * - Cart Service (8084): /api/metrics/revenue, /api/metrics/orders, /api/metrics/payment-success-rate, /api/metrics/order-status-distribution
 * - Auth Service (8888): /api/metrics/new-users, /api/metrics/new-vendors, /api/metrics/user-role-distribution
 * - Product Catalog Service (8082): /api/metrics/total-products
 * 
 * See: admin/contexts/MetricsContext.jsx for main dashboard metrics implementation
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
