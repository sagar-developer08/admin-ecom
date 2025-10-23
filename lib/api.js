// API configuration and service functions - Authentication only
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:8888/api';

class ApiService {
  constructor() {
    this.authBaseURL = AUTH_BASE_URL;
  }

  // Generic request method for auth endpoints
  async authRequest(endpoint, options = {}) {
    const url = `${this.authBaseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
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
      console.error('❌ Auth API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    return this.authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(userData) {
    return this.authRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken) {
    return this.authRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile(accessToken) {
    return this.authRequest('/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  async logout() {
    // Since we're using JWT tokens, logout is handled client-side
    // by removing tokens from storage
    return Promise.resolve({ success: true });
  }

}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
