/**
 * Product Management Service
 * Handles all product-related API calls
 */

import { productApi, adminApi } from '../apiClient';

export const productService = {
  // Get all products (use product API directly for approval status filtering)
  getAllProducts: async (params = {}) => {
    return await productApi.get('/products', params);
  },

  // Get product by ID
  getProductById: async (productId) => {
    return await productApi.get(`/products/${productId}`);
  },

  // Create new product
  createProduct: async (productData) => {
    return await productApi.post('/products', productData);
  },

  // Update product
  updateProduct: async (productId, productData) => {
    return await productApi.put(`/products/${productId}`, productData);
  },

  // Delete product
  deleteProduct: async (productId) => {
    return await productApi.delete(`/products/${productId}`);
  },

  // Get pending products
  getPendingProducts: async () => {
    return await productApi.get('/products', { approval_status: 'pending' });
  },

  // Approve product
  approveProduct: async (productId) => {
    return await productApi.put(`/products/${productId}/approve`);
  },

  // Reject product
  rejectProduct: async (productId, reason) => {
    return await productApi.put(`/products/${productId}/reject`, { reason });
  },

  // Bulk approve products
  bulkApproveProducts: async (productIds) => {
    return await productApi.post('/products/bulk-approve', { productIds });
  },

  // Bulk reject products
  bulkRejectProducts: async (productIds, reason) => {
    return await productApi.post('/products/bulk-reject', { productIds, reason });
  },


  // Get pending vendors summary (count per vendor)
  getPendingVendorsSummary: async (params = {}) => {
    return await productApi.get('/products/pending/vendors', params);
  },

  // Get pending products by vendor
  getVendorPendingProducts: async (vendorId, params = {}) => {
    const query = { approval_status: 'pending', vendor_id: vendorId, ...params };
    return await productApi.get('/products', query);
  },

  // Get product categories
  getCategories: async (params = {}) => {
    return await productApi.get('/categories', params);
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    return await productApi.get(`/categories/${categoryId}`);
  },

  // Create category
  createCategory: async (categoryData) => {
    return await productApi.post('/categories', categoryData);
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    return await productApi.put(`/categories/${categoryId}`, categoryData);
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    return await productApi.delete(`/categories/${categoryId}`);
  },

  // Upload category icon
  uploadCategoryIcon: async (categoryId, file) => {
    const formData = new FormData();
    formData.append('icon', file);
    return await productApi.upload(`/categories/${categoryId}/upload-icon`, formData);
  },

  // Get brands
  getBrands: async (params = {}) => {
    // Add clearCache=true to bypass cache issues
    const paramsWithCacheClear = { ...params, clearCache: 'true' };
    return await productApi.get('/brands', paramsWithCacheClear);
  },

  // Create brand
  createBrand: async (brandData) => {
    return await productApi.post('/brands', brandData);
  },

  // Update brand
  updateBrand: async (brandId, brandData) => {
    return await productApi.put(`/brands/${brandId}`, brandData);
  },

  // Delete brand
  deleteBrand: async (brandId) => {
    return await productApi.delete(`/brands/${brandId}`);
  },

  // Get product attributes
  getAttributes: async () => {
    return await productApi.get('/attributes');
  },

  // Create attribute
  createAttribute: async (attributeData) => {
    return await productApi.post('/attributes', attributeData);
  },

  // Amazon-style related categories and attributes
  getRelatedCategories: async (categoryId) => {
    return await productApi.get(`/attributes/related-categories/${categoryId}`);
  },

  getAttributesByMultipleCategories: async (categoryIds) => {
    return await productApi.post('/attributes/by-categories', { categoryIds });
  },
};

export default productService;

