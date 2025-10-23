/**
 * Vendor Profile Service
 * Handles all vendor profile-related API calls
 */

import { vendorApi } from '../apiClient';

export const vendorProfileService = {
  // Get vendor store profile
  getVendorStoreProfile: async (vendorId) => {
    return await vendorApi.get(`/vendor/profile/store-profile`);
  },

  // Update vendor store profile
  updateVendorStoreProfile: async (profileData) => {
    return await vendorApi.put('/vendor/profile/store-profile', profileData);
  },

  // Get vendor business information
  getVendorBusinessInfo: async (vendorId) => {
    return await vendorApi.get(`/vendor/profile/business-info`);
  },

  // Update vendor business information
  updateVendorBusinessInfo: async (businessData) => {
    return await vendorApi.put('/vendor/profile/business-info', businessData);
  },

  // Get vendor social media links
  getVendorSocialMedia: async (vendorId) => {
    return await vendorApi.get(`/vendor/profile/social-media`);
  },

  // Update vendor social media links
  updateVendorSocialMedia: async (socialData) => {
    return await vendorApi.put('/vendor/profile/social-media', socialData);
  },

  // Get vendor business hours
  getVendorBusinessHours: async (vendorId) => {
    return await vendorApi.get(`/vendor/profile/business-hours`);
  },

  // Update vendor business hours
  updateVendorBusinessHours: async (hoursData) => {
    return await vendorApi.put('/vendor/profile/business-hours', hoursData);
  },

  // Get vendor stores
  getVendorStores: async (vendorId) => {
    return await vendorApi.get('/vendor/profile/stores');
  }
};

export default vendorProfileService;
