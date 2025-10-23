/**
 * Commission & Payout Service
 */

import { commissionApi } from '../apiClient';

export const commissionService = {
  // Get all commissions
  getAllCommissions: async (params = {}) => {
    return await commissionApi.get('/commissions', params);
  },

  // Get vendor commissions (for admin)
  getVendorCommissions: async (vendorId, params = {}) => {
    return await commissionApi.get(`/commissions/vendor/${vendorId}`, params);
  },

  // Calculate commission
  calculateCommission: async (orderData) => {
    return await commissionApi.post('/commissions/calculate', orderData);
  },

  // COMMISSION SETTINGS METHODS
  // Get global commission settings
  getGlobalSettings: async () => {
    return await commissionApi.get('/commission-settings/global');
  },

  // Update global commission settings
  updateGlobalSettings: async (settings) => {
    return await commissionApi.put('/commission-settings/global', settings);
  },

  // Get all vendor commission settings (admin only)
  getAllVendorCommissionSettings: async (params = {}) => {
    return await commissionApi.get('/commission-settings/vendors', params);
  },

  // Update vendor commission (only for verified vendors)
  updateVendorCommission: async (vendorId, commissionRate) => {
    return await commissionApi.put(`/commission-settings/vendors/${vendorId}`, {
      commissionRate
    });
  },

  // Delete vendor commission (reset to global default)
  deleteVendorCommission: async (vendorId) => {
    return await commissionApi.delete(`/commission-settings/vendors/${vendorId}`);
  },

  // PAYOUT METHODS
  // Get all payouts
  getAllPayouts: async (params = {}) => {
    return await commissionApi.get('/commissions/payouts', params);
  },

  // Get vendor payouts
  getVendorPayouts: async (vendorId, params = {}) => {
    return await commissionApi.get(`/vendor/financial/payouts`, params);
  },

  // Get vendor earnings summary
  getVendorEarnings: async (vendorId, params = {}) => {
    return await commissionApi.get(`/vendor/financial/earnings`, params);
  },

  // Get vendor financial transactions
  getVendorTransactions: async (vendorId, params = {}) => {
    return await commissionApi.get(`/vendor/financial/transactions`, params);
  },

  // Get vendor commission settings
  getVendorCommission: async (vendorId, params = {}) => {
    return await commissionApi.get(`/vendor/financial/commission`, params);
  },

  // Create payout request
  createPayoutRequest: async (payoutData) => {
    return await commissionApi.post('/commissions/payouts/request', payoutData);
  },

  // Approve payout
  approvePayout: async (payoutId) => {
    return await commissionApi.put(`/commissions/payouts/${payoutId}/approve`);
  },

  // Reject payout
  rejectPayout: async (payoutId, reason) => {
    return await commissionApi.put(`/commissions/payouts/${payoutId}/reject`, { reason });
  },

  // Process payout
  processPayout: async (payoutId) => {
    return await commissionApi.post(`/commissions/payouts/${payoutId}/process`);
  },

  // Get pending payouts
  getPendingPayouts: async () => {
    return await commissionApi.get('/commissions/payouts/pending');
  },

  // Download payout receipt
  downloadPayoutReceipt: async (payoutId) => {
    return await commissionApi.get(`/commissions/payouts/${payoutId}/receipt`);
  },
};

export default commissionService;

