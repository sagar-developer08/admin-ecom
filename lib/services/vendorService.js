/**
 * Vendor Management Service
 * Handles all vendor-related API calls
 */

import { vendorApi, productApi } from '../apiClient';

export const vendorService = {
  // Get all vendors
  getAllVendors: async (params = {}) => {
    console.log('🔍 [VendorService] getAllVendors called with params:', params);
    try {
      const response = await vendorApi.get('/vendors', params);
      console.log('✅ [VendorService] getAllVendors response:', response);
      return response;
    } catch (error) {
      console.error('❌ [VendorService] getAllVendors error:', error);
      throw error;
    }
  },

  // Get vendor by ID
  getVendorById: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}`);
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    return await vendorApi.post('/vendors', vendorData);
  },

  // Update vendor
  updateVendor: async (vendorId, vendorData) => {
    return await vendorApi.put(`/vendors/${vendorId}`, vendorData);
  },

  // Delete vendor
  deleteVendor: async (vendorId) => {
    return await vendorApi.delete(`/vendors/${vendorId}`);
  },

  // Update vendor status (approve/reject/suspend)
  updateVendorStatus: async (vendorId, status) => {
    return await vendorApi.put(`/vendors/${vendorId}/status`, { status });
  },

  // Suspend vendor
  suspendVendor: async (vendorId, reason) => {
    return await vendorApi.put(`/vendors/${vendorId}/suspend`, { reason });
  },

  // Activate vendor
  activateVendor: async (vendorId) => {
    return await vendorApi.put(`/vendors/${vendorId}/activate`);
  },

  // Verify vendor KYC
  verifyVendor: async (vendorId, verificationData) => {
    return await vendorApi.put(`/vendors/${vendorId}/verify`, verificationData);
  },

  // Get vendor documents
  getVendorDocuments: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}/documents`);
  },

  // Upload vendor document
  uploadVendorDocument: async (vendorId, formData) => {
    return await vendorApi.upload(`/vendors/${vendorId}/documents`, formData);
  },

  // Get vendor performance metrics
  getVendorPerformance: async (vendorId) => {
    return await vendorApi.get(`/vendors/${vendorId}/performance`);
  },

  // Update vendor commission
  updateVendorCommission: async (vendorId, commissionRate) => {
    return await vendorApi.put(`/vendors/${vendorId}/commission`, { commissionRate });
  },

  // Get vendor's products
  getVendorProducts: async (vendorId, params = {}) => {
    return await productApi.get(`/products`, { ...params, vendor_id: vendorId });
  },

  // Get vendor's orders
  getVendorOrders: async (vendorId, params = {}) => {
    return await vendorApi.get(`/vendors/${vendorId}/orders`, params);
  },

  // Get vendor revenue
  getVendorRevenue: async (vendorId, params = {}) => {
    return await vendorApi.get(`/vendors/${vendorId}/revenue`, params);
  },
};

export default vendorService;

