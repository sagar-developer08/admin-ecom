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
    // Get all users from auth service (frontend will filter by role)
    return await authApi.get('/users', params);
  },

  // Get customer addresses
  getCustomerAddresses: async (customerId) => {
    // Use superadmin endpoint for searching addresses by any user ID or Cognito ID
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8888/api/auth'}/profile/superadmin/addresses/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
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

  // NEW: Get all users with comprehensive details (admin API)
  getAllUsersWithDetails: async (params = {}) => {
    return await customerApi.get('/customers/admin/all-with-details', params);
  },

  // NEW: Get single user with comprehensive details (admin API)
  getUserWithDetails: async (userId) => {
    return await customerApi.get(`/customers/admin/${userId}/with-details`);
  },

  // NEW: Get customer details for superadmin (includes addresses and order history via RabbitMQ)
  getCustomerDetailsForSuperAdmin: async (customerId, params = {}) => {
    const { page = 1, limit = 10 } = params;
    return await authApi.get(`/superadmin/customer/${customerId}?page=${page}&limit=${limit}`);
  },

  // NEW: Get users with pagination and filtering (auth API)
  getUsersWithPagination: async (params = {}) => {
    const { role = 'user', status = 'active', page = 1, limit = 20 } = params;
    return await authApi.get('/users', { role, status, page, limit });
  },

  // NEW: Get total users count for metrics
  getTotalUsersCount: async (params = {}) => {
    const { role = 'user', status = 'active' } = params;
    return await authApi.get('/users', { role, status, page: 1, limit: 1 });
  },

  // NEW: Get comprehensive customers data (NEW DEDICATED ENDPOINT)
  getComprehensiveCustomers: async (params = {}) => {
    const { 
      role = 'user', 
      status = 'active', 
      page = 1, 
      limit = 20,
      search = '',
      includeAddresses = true,
      includeOrders = true,
      addressLimit = 5,
      orderLimit = 5
    } = params;
    
    return await authApi.get('/customers/comprehensive', {
      role,
      status,
      page,
      limit,
      search,
      includeAddresses,
      includeOrders,
      addressLimit,
      orderLimit
    });
  },

  // MAIN METHOD FOR CUSTOMERS PAGE - Uses comprehensive API
  getCustomersWithComprehensiveDetails: async (params = {}) => {
    const { 
      page = 1,
      limit = 20,
      status = 'active',
      search = '',
      includeAddresses = true,
      includeOrders = true,
      addressLimit = 5,
      orderLimit = 5
    } = params;
    
    return await authApi.get('/customers/comprehensive', {
      page,
      limit,
      status,
      search,
      includeAddresses,
      includeOrders,
      addressLimit,
      orderLimit
    });
  },

  // NEW: Get single customer with comprehensive details (NEW DEDICATED ENDPOINT)
  getComprehensiveCustomerById: async (customerId, params = {}) => {
    const { 
      includeAddresses = true,
      includeOrders = true,
      addressLimit = 10,
      orderLimit = 10
    } = params;
    
    return await authApi.get(`/customers/comprehensive/${customerId}`, {
      includeAddresses,
      includeOrders,
      addressLimit,
      orderLimit
    });
  },

  // NEW: Get customer statistics for dashboard (NEW DEDICATED ENDPOINT)
  getCustomerStatistics: async (params = {}) => {
    const { 
      status = 'active',
      role = 'user'
    } = params;
    
    return await authApi.get('/customers/statistics', {
      status,
      role
    });
  },
};

export default customerService;

