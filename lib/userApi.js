// User Management API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8009/api';

class UserApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    let token = null;
    if (typeof window !== 'undefined') {
      try {
        const storedTokens = localStorage.getItem('qliq-admin-tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          token = tokens.accessToken;
        }
      } catch (err) {
        console.error('Error getting token:', err);
      }
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('User API request failed:', error);
      throw error;
    }
  }

  // Get all users with pagination and filters
  async getUsers(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return this.request(`/users?${queryParams.toString()}`);
  }

  // Get user by ID
  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  // Update user
  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Update user status (active/inactive)
  async updateUserStatus(userId, status) {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Delete user
  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Get user statistics
  async getUserStats() {
    return this.request('/users/stats');
  }

  // Bulk update users
  async bulkUpdateUsers(userIds, updates) {
    return this.request('/users/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ userIds, updates }),
    });
  }

  // Export users
  async exportUsers(format = 'csv', filters = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return this.request(`/users/export?${queryParams.toString()}`);
  }
}

// Create and export a singleton instance
const userApiService = new UserApiService();
export default userApiService;
