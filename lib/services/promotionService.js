/**
 * Promotion & Marketing Service
 */

import { promotionApi } from '../apiClient';

export const promotionService = {
  // COUPON METHODS
  createCoupon: async (couponData) => {
    return await promotionApi.post('/promotions/coupons', couponData);
  },

  getAllCoupons: async (params = {}) => {
    return await promotionApi.get('/promotions/coupons', params);
  },

  getCouponById: async (couponId) => {
    return await promotionApi.get(`/promotions/coupons/${couponId}`);
  },

  updateCoupon: async (couponId, couponData) => {
    return await promotionApi.put(`/promotions/coupons/${couponId}`, couponData);
  },

  deleteCoupon: async (couponId) => {
    return await promotionApi.delete(`/promotions/coupons/${couponId}`);
  },

  validateCoupon: async (code, orderData) => {
    return await promotionApi.post('/coupons/validate', { code, ...orderData });
  },

  getCouponStatistics: async (couponId) => {
    return await promotionApi.get(`/coupons/${couponId}/statistics`);
  },

  // FLASH SALE METHODS
  createFlashSale: async (flashSaleData) => {
    return await promotionApi.post('/promotions/flash-sales', flashSaleData);
  },

  getAllFlashSales: async (params = {}) => {
    return await promotionApi.get('/promotions/flash-sales', params);
  },

  getFlashSaleById: async (flashSaleId) => {
    return await promotionApi.get(`/promotions/flash-sales/${flashSaleId}`);
  },

  updateFlashSale: async (flashSaleId, flashSaleData) => {
    return await promotionApi.put(`/promotions/flash-sales/${flashSaleId}`, flashSaleData);
  },

  deleteFlashSale: async (flashSaleId) => {
    return await promotionApi.delete(`/promotions/flash-sales/${flashSaleId}`);
  },

  // BANNER METHODS
  createBanner: async (bannerData) => {
    return await promotionApi.post('/promotions/banners', bannerData);
  },

  getAllBanners: async (params = {}) => {
    return await promotionApi.get('/promotions/banners', params);
  },

  updateBanner: async (bannerId, bannerData) => {
    return await promotionApi.put(`/promotions/banners/${bannerId}`, bannerData);
  },

  deleteBanner: async (bannerId) => {
    return await promotionApi.delete(`/promotions/banners/${bannerId}`);
  },

  updateBannerPosition: async (bannerId, position) => {
    return await promotionApi.put(`/promotions/banners/${bannerId}/position`, { position });
  },

  // DEAL METHODS
  createDeal: async (dealData) => {
    return await promotionApi.post('/deals', dealData);
  },

  getAllDeals: async (params = {}) => {
    return await promotionApi.get('/deals', params);
  },

  getDealById: async (dealId) => {
    return await promotionApi.get(`/deals/${dealId}`);
  },

  updateDeal: async (dealId, dealData) => {
    return await promotionApi.put(`/deals/${dealId}`, dealData);
  },

  deleteDeal: async (dealId) => {
    return await promotionApi.delete(`/deals/${dealId}`);
  },
};

export default promotionService;

