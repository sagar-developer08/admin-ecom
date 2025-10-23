/**
 * Review Management Service
 * Handles all review-related API calls
 */

import { reviewApi, productApi, vendorApi } from '../apiClient';

export const reviewService = {
  // Get all product reviews
  getAllReviews: async (params = {}) => {
    return await reviewApi.get('/product-reviews/all', params);
  },

  // Get all store reviews
  getAllStoreReviews: async (params = {}) => {
    return await reviewApi.get('/store-reviews/all', params);
  },

  // Get reviews by product
  getProductReviews: async (productId, params = {}) => {
    return await reviewApi.get(`/product-reviews/product/${productId}`, params);
  },

  // Get reviews by store
  getStoreReviews: async (storeId, params = {}) => {
    return await reviewApi.get(`/store-reviews/store/${storeId}`, params);
  },

  // Get user's product reviews
  getUserProductReviews: async (params = {}) => {
    return await reviewApi.get('/product-reviews/user/product-reviews', params);
  },

  // Get user's store reviews
  getUserStoreReviews: async (params = {}) => {
    return await reviewApi.get('/store-reviews/user/store-reviews', params);
  },

  // Get product review by ID
  getProductReviewById: async (reviewId) => {
    return await reviewApi.get(`/product-reviews/${reviewId}`);
  },

  // Get store review by ID
  getStoreReviewById: async (reviewId) => {
    return await reviewApi.get(`/store-reviews/${reviewId}`);
  },

  // Update product review
  updateProductReview: async (reviewId, reviewData) => {
    return await reviewApi.put(`/product-reviews/${reviewId}`, reviewData);
  },

  // Update store review
  updateStoreReview: async (reviewId, reviewData) => {
    return await reviewApi.put(`/store-reviews/${reviewId}`, reviewData);
  },

  // Delete product review
  deleteProductReview: async (reviewId) => {
    return await reviewApi.delete(`/product-reviews/${reviewId}`);
  },

  // Delete store review
  deleteStoreReview: async (reviewId) => {
    return await reviewApi.delete(`/store-reviews/${reviewId}`);
  },

  // Get product review statistics
  getProductReviewStatistics: async (productId) => {
    return await reviewApi.get(`/product-reviews/statistics/product/${productId}`);
  },

  // Get store review statistics
  getStoreReviewStatistics: async (storeId) => {
    return await reviewApi.get(`/store-reviews/statistics/store/${storeId}`);
  },

  // Mark product review as helpful
  markProductReviewHelpful: async (reviewId) => {
    return await reviewApi.post(`/product-reviews/${reviewId}/helpful`);
  },

  // Mark store review as helpful
  markStoreReviewHelpful: async (reviewId) => {
    return await reviewApi.post(`/store-reviews/${reviewId}/helpful`);
  },

  // Get reviews for vendor's products only
  getVendorReviews: async (params = {}) => {
    return await reviewApi.get('/product-reviews/vendor', params);
  },

  // Get vendor review statistics
  getVendorReviewStats: async (vendorId) => {
    return await reviewApi.get(`/product-reviews/statistics/vendor/${vendorId}`);
  }
};

export default reviewService;
