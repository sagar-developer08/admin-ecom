/**
 * Store Management Service
 * Handles all store-related API calls
 */

import { productApi } from '../apiClient';

export const storeService = {
  // Get all stores
  getAllStores: async (params = {}) => {
    return await productApi.get('/stores', params);
  },

  // Get store by ID
  getStoreById: async (storeId) => {
    return await productApi.get(`/stores/${storeId}`);
  },

  // Create new store
  createStore: async (storeData) => {
    return await productApi.post('/stores', storeData);
  },

  // Update store
  updateStore: async (storeId, storeData) => {
    return await productApi.put(`/stores/${storeId}`, storeData);
  },

  // Delete store
  deleteStore: async (storeId) => {
    return await productApi.delete(`/stores/${storeId}`);
  },

  // Get stores by vendor
  getStoresByVendor: async (vendorId, clearCache = false) => {
    console.log('🔍 Fetching stores for vendor:', vendorId);
    
    // Try the dedicated owner endpoint first
    try {
      const response = await productApi.get(`/stores/owner/${vendorId}`);
      console.log('🔍 Store service response (owner endpoint):', response);
      return response;
    } catch (error) {
      console.log('🔍 Owner endpoint failed, trying general stores endpoint:', error.message);
      
      // Fallback to general stores endpoint with ownerId parameter
      const params = { ownerId: vendorId };
      if (clearCache) {
        params.clearCache = 'true';
      }
      
      try {
        const response = await productApi.get('/stores', params);
        console.log('🔍 Store service response (general endpoint):', response);
        return response;
      } catch (fallbackError) {
        console.error('🔍 Both store endpoints failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Upload store logo
  uploadStoreLogo: async (storeId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return await productApi.upload(`/stores/${storeId}/upload-logo`, formData);
  },
};

export default storeService;

