import { productApi } from '../apiClient';

export const attributeService = {
  // Get all attribute definitions
  getAllAttributes: async (params = {}) => {
    return await productApi.get('/attributes', params);
  },

  // Get attribute definition by ID
  getAttributeById: async (id) => {
    return await productApi.get(`/attributes/${id}`);
  },

  // Get attributes by category
  getAttributesByCategory: async (categoryId) => {
    return await productApi.get(`/attributes/category/${categoryId}`);
  },

  // Get attributes by multiple categories (Amazon-style)
  getAttributesByMultipleCategories: async (categoryIds) => {
    return await productApi.post('/attributes/by-categories', { categoryIds });
  },

  // Get related categories for a given category
  getRelatedCategories: async (categoryId) => {
    return await productApi.get(`/attributes/related-categories/${categoryId}`);
  },

  // Create new attribute definition
  createAttribute: async (attributeData) => {
    return await productApi.post('/attributes', attributeData);
  },

  // Update attribute definition
  updateAttribute: async (id, attributeData) => {
    return await productApi.put(`/attributes/${id}`, attributeData);
  },

  // Delete attribute definition
  deleteAttribute: async (id) => {
    return await productApi.delete(`/attributes/${id}`);
  }
};

export default attributeService;
