/**
 * Centralized API Client for All Microservices
 * Handles authentication, error handling, and request/response interceptors
 */

import Cookies from 'js-cookie';

// Microservice Base URLs
const API_BASE_URLS = {
  AUTH: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8888/api/auth',
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009/api',
  PRODUCT: process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'http://localhost:8082/api',
  CART: process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api',
  REVIEW: process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8083/api',
  SEARCH: process.env.NEXT_PUBLIC_SEARCH_API_URL || 'http://localhost:8081/api',
  MEDIA: process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:5005/api',
  // Consolidated in qliq-admin-api (port 8009)
  VENDOR: process.env.NEXT_PUBLIC_VENDOR_API_URL || 'http://localhost:8009/api',
  COMMISSION: process.env.NEXT_PUBLIC_COMMISSION_API_URL || 'http://localhost:8009/api',
  CUSTOMER: process.env.NEXT_PUBLIC_CUSTOMER_API_URL || 'http://localhost:8009/api',
  PROMOTION: process.env.NEXT_PUBLIC_PROMOTION_API_URL || 'http://localhost:8009/api',
  REPORT: process.env.NEXT_PUBLIC_REPORT_API_URL || 'http://localhost:8009/api',
  METRICS: process.env.NEXT_PUBLIC_METRICS_API_URL || 'http://localhost:8009/api',
  // Future services if needed
  SHIPPING: process.env.NEXT_PUBLIC_SHIPPING_API_URL || 'http://localhost:8009/api',
  CMS: process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:8009/api',
  NOTIFICATION: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:8009/api',
  CONFIG: process.env.NEXT_PUBLIC_CONFIG_API_URL || 'http://localhost:8009/api',
  SUPPORT: process.env.NEXT_PUBLIC_SUPPORT_API_URL || 'http://localhost:8009/api',
};

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Get auth token from localStorage (matching AuthContext storage)
  getAuthToken() {
    if (typeof window !== 'undefined') {
      const tokensData = localStorage.getItem('qliq-admin-tokens');
      if (tokensData) {
        try {
          const tokens = JSON.parse(tokensData);
          return tokens.accessToken;
        } catch (error) {
          console.error('Error parsing tokens from localStorage:', error);
          return null;
        }
      }
    }
    return null;
  }

  // Get default headers
  getHeaders(customHeaders = {}) {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  // Get fresh token from auth service
  async getFreshToken() {
    try {
      const response = await fetch(`${API_BASE_URLS.AUTH}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting fresh token:', error);
      return null;
    }
  }

  // Handle API response with token refresh
  async handleResponse(response, originalRequest = null) {
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Check if it's a token validation timeout (auth service unavailable)
        if (data.error === 'Token validation timeout' || data.message === 'Token validation service unavailable') {
          console.warn('Token validation failed, attempting to get fresh token');
          
          // Try to get a fresh token
          const freshToken = await this.getFreshToken();
          if (freshToken) {
            // Update stored token
            if (typeof window !== 'undefined') {
              const tokensData = localStorage.getItem('qliq-admin-tokens');
              if (tokensData) {
                try {
                  const tokens = JSON.parse(tokensData);
                  tokens.accessToken = freshToken;
                  localStorage.setItem('qliq-admin-tokens', JSON.stringify(tokens));
                  
                  // Retry the original request with fresh token
                  if (originalRequest) {
                    console.log('Retrying request with fresh token');
                    return await this.retryRequest(originalRequest, freshToken);
                  }
                } catch (error) {
                  console.error('Error updating token in localStorage:', error);
                }
              }
            }
          }
          
          throw new Error(data.message || 'Token validation service unavailable');
        } else {
          // Unauthorized - clear auth data and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('qliq-admin-user');
            localStorage.removeItem('qliq-admin-tokens');
            Cookies.remove('authToken');
            window.location.href = '/login';
          }
        }
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }

  // Retry request with fresh token
  async retryRequest(requestInfo, freshToken) {
    const { method, url, body } = requestInfo;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`,
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return this.handleResponse(response);
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const requestInfo = { method: 'GET', url, body: null };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    
    return this.handleResponse(response, requestInfo);
  }


  // POST request
  async post(endpoint, body = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    return this.handleResponse(response);
  }

  // PUT request
  async put(endpoint, body = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestInfo = { method: 'PUT', url, body };
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    return this.handleResponse(response, requestInfo);
  }


  // DELETE request
  async delete(endpoint, body = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
      ...(Object.keys(body).length && { body: JSON.stringify(body) }),
    });
    
    return this.handleResponse(response);
  }

  // Upload file (multipart/form-data)
  async upload(endpoint, formData) {
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
      body: formData,
    });
    
    return this.handleResponse(response);
  }
}

// Create API client instances for each microservice
export const authApi = new ApiClient(API_BASE_URLS.AUTH);
export const adminApi = new ApiClient(API_BASE_URLS.ADMIN);
export const productApi = new ApiClient(API_BASE_URLS.PRODUCT);
export const cartApi = new ApiClient(API_BASE_URLS.CART);
export const reviewApi = new ApiClient(API_BASE_URLS.REVIEW);
export const searchApi = new ApiClient(API_BASE_URLS.SEARCH);
export const mediaApi = new ApiClient(API_BASE_URLS.MEDIA);
export const vendorApi = new ApiClient(API_BASE_URLS.VENDOR);
export const commissionApi = new ApiClient(API_BASE_URLS.COMMISSION);
export const customerApi = new ApiClient(API_BASE_URLS.CUSTOMER);
export const promotionApi = new ApiClient(API_BASE_URLS.PROMOTION);
export const shippingApi = new ApiClient(API_BASE_URLS.SHIPPING);
export const cmsApi = new ApiClient(API_BASE_URLS.CMS);
export const notificationApi = new ApiClient(API_BASE_URLS.NOTIFICATION);
export const reportApi = new ApiClient(API_BASE_URLS.REPORT);
export const metricsApi = new ApiClient(API_BASE_URLS.METRICS);
export const configApi = new ApiClient(API_BASE_URLS.CONFIG);
export const supportApi = new ApiClient(API_BASE_URLS.SUPPORT);

export default ApiClient;

