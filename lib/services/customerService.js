/**
 * Customer Management Service
 * Handles all customer-related API calls
 */

import { customerApi, authApi, cartApi } from '../apiClient';

export const customerService = {
  // Get all customers
  getAllCustomers: async (params = {}) => {
    return await authApi.get('/users', params);
  },

  // Get customers with purchase history (excluding vendors)
  getCustomersWithPurchases: async (params = {}) => {
    return await cartApi.get('/orders/admin/customers', params);
  },

  // Get customer addresses
  getCustomerAddresses: async (customerId) => {
    return await authApi.get(`/users/${customerId}/addresses`);
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    return await customerApi.get(`/customers/${customerId}`);
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    return await customerApi.put(`/customers/${customerId}`, customerData);
  },

  // Delete customer
  deleteCustomer: async (customerId) => {
    return await customerApi.delete(`/customers/${customerId}`);
  },

  // Update customer status (ban/suspend/activate)
  updateCustomerStatus: async (customerId, status) => {
    return await authApi.put(`/users/${customerId}/status`, { status });
  },

  // Get customer orders
  getCustomerOrders: async (customerId, params = {}) => {
    return await customerApi.get(`/customers/${customerId}/orders`, params);
  },

  // Get customer reviews
  getCustomerReviews: async (customerId) => {
    return await customerApi.get(`/customers/${customerId}/reviews`);
  },

  // Get customer wishlist
  getCustomerWishlist: async (customerId) => {
    return await customerApi.get(`/customers/${customerId}/wishlist`);
  },


  // Get customer statistics
  getCustomerStatistics: async (params = {}) => {
    return await customerApi.get('/customers/statistics', params);
  },

  // Get customer activity log
  getCustomerActivity: async (customerId) => {
    return await customerApi.get(`/customers/${customerId}/activity`);
  },

  // Export customer data
  exportCustomers: async (params = {}) => {
    return await customerApi.post('/customers/export', params);
  },
};

export default customerService;

