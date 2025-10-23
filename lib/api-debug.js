// Debug version of API service to identify the login issue
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:8888/api';

class ApiService {
  constructor() {
    this.authBaseURL = AUTH_BASE_URL;
  }

  // Generic request method for auth endpoints with detailed logging
  async authRequest(endpoint, options = {}) {
    const url = `${this.authBaseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🔍 API Request Debug:');
    console.log('  URL:', url);
    console.log('  Method:', config.method || 'GET');
    console.log('  Headers:', config.headers);
    console.log('  Body:', config.body);

    try {
      const response = await fetch(url, config);
      
      console.log('📊 Response Debug:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('  Data:', data);

      if (!response.ok) {
        console.error('❌ API Error Response:');
        console.error('  Status:', response.status);
        console.error('  Message:', data.message);
        console.error('  Full Response:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ API Success Response:', data);
      return data;
    } catch (error) {
      console.error('💥 API Request Failed:');
      console.error('  Error:', error.message);
      console.error('  Stack:', error.stack);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    console.log('🔐 Login Attempt:');
    console.log('  Email:', email);
    console.log('  Password Length:', password.length);
    
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
    return Promise.resolve({ success: true });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
