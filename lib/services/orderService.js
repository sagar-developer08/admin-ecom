/**
 * Order Management Service
 * Handles all order-related API calls
 */

import { cartApi } from '../apiClient';

export const orderService = {
  // Get all orders (admin view)
  getAllOrders: async (params = {}) => {
    return await cartApi.get('/orders/admin/all', params);
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    return await cartApi.get(`/orders/admin/details/${orderId}`);
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    return await cartApi.put(`/orders/${orderId}/status`, { status });
  },

  // Assign order to vendor
  assignOrder: async (orderId, vendorId) => {
    return await cartApi.put(`/orders/${orderId}/assign`, { vendorId });
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    return await cartApi.post(`/orders/${orderId}/cancel`, { reason });
  },

  // Process refund
  processRefund: async (orderId, refundData) => {
    return await cartApi.post(`/orders/${orderId}/refund`, refundData);
  },

  // Get order timeline
  getOrderTimeline: async (orderId) => {
    return await cartApi.get(`/orders/${orderId}/timeline`);
  },

  // Split multi-vendor order
  splitOrder: async (orderId) => {
    return await cartApi.post(`/orders/${orderId}/split`);
  },

  // Get disputes
  getDisputes: async (params = {}) => {
    return await cartApi.get('/orders/disputes', params);
  },

  // Resolve dispute
  resolveDispute: async (orderId, resolution) => {
    return await cartApi.put(`/orders/${orderId}/resolve-dispute`, resolution);
  },

  // Bulk update orders
  bulkUpdateOrders: async (orderIds, updateData) => {
    return await cartApi.post('/orders/bulk-update', { orderIds, ...updateData });
  },

  // Get order statistics
  getOrderStatistics: async (params = {}) => {
    return await cartApi.get('/orders/statistics', params);
  },

  // Add order note
  addOrderNote: async (orderId, note) => {
    return await cartApi.post(`/orders/${orderId}/notes`, { note });
  },

  // Get vendor orders
  getVendorOrders: async (vendorId, params = {}) => {
    return await cartApi.get(`/orders/vendor/${vendorId}`, params);
  },

  // Get orders by vendor and store
  getVendorStoreOrders: async (vendorId, storeId, params = {}) => {
    return await cartApi.get(`/orders/vendor/${vendorId}/store/${storeId}`, params);
  },

  // Get pending orders only
  getPendingOrders: async (params = {}) => {
    return await cartApi.get('/orders/admin/pending', params);
  },

  // Get vendor pending orders
  getVendorPendingOrders: async (vendorId, params = {}) => {
    return await cartApi.get(`/orders/vendor/${vendorId}/pending`, params);
  },

  // Get vendor returns
  getVendorReturns: async (vendorId, params = {}) => {
    return await cartApi.get(`/orders/vendor/${vendorId}/returns`, params);
  },

  // Update return status
  updateReturnStatus: async (returnId, status, reason = '') => {
    return await cartApi.put(`/returns/${returnId}/status`, { status, reason });
  },
};

export default orderService;

