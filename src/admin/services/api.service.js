/**
 * API Service for Booking Management System
 * Handles all HTTP requests with authentication and error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://saloon-booking-management.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = null;
  }

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  setAuthToken(token) {
    this.authToken = token;
    console.log('🔐 Token set in ApiService');
  }

  removeAuthToken() {
    this.authToken = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    console.log('🔓 Token removed from ApiService');
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // ============================================
  // GENERIC REQUEST HANDLER
  // ============================================

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('📡 API Request:', {
      method: options.method || 'GET',
      url,
      hasAuth: !!this.authToken,
    });

    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
    };

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      console.log('✅ API Response:', response.status);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('❌ Unauthorized! Token expired or invalid');
        this.removeAuthToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      // Parse JSON response
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        throw new Error('Invalid JSON returned from server');
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(
          responseData?.message || `HTTP error! Status: ${response.status}`
        );
      }

      return responseData;

    } catch (error) {
      console.error('❌ API Error:', error);

      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  // ============================================
  // HTTP METHODS
  // ============================================

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async login(phone_number, password) {
    const response = await this.post('/auth/login', { phone_number, password });
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  // ============================================
  // ADMIN - DASHBOARD
  // ============================================

  async getDashboardStats() {
    return this.get('/admin/dashboard/stats');
  }

  // ============================================
  // ADMIN - USER MANAGEMENT
  // ============================================

  async getAllUsers(filters = {}) {
    return this.get('/admin/users', filters);
  }

  async getUserById(userId) {
    return this.get(`/admin/users/${userId}`);
  }

  async createAdmin(adminData) {
    return this.post('/admin/users/admin', adminData);
  }

  async updateUserStatus(userId, status) {
    return this.put(`/admin/users/${userId}/status`, { status });
  }

  async deleteUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  }

  // ============================================
  // ADMIN - VENDOR MANAGEMENT
  // ============================================

  async getAllVendors(filters = {}) {
    return this.get('/admin/vendors', filters);
  }

  async getVendorById(vendorId) {
    return this.get(`/admin/vendors/${vendorId}`);
  }

  async updateVendorVerification(vendorId, verificationData) {
    return this.put(`/admin/vendors/${vendorId}/verification`, verificationData);
  }

  async updateDocumentVerification(documentId, verificationData) {
    return this.put(`/admin/documents/${documentId}/verification`, verificationData);
  }

  // ============================================
  // ADMIN - SHOP MANAGEMENT
  // ============================================

  async getAllShops(filters = {}) {
    return this.get('/admin/shops', filters);
  }

  async getShopById(shopId) {
    return this.get(`/admin/shops/${shopId}`);
  }

  async createShop(shopData) {
    return this.post('/admin/shops', shopData);
  }

  async updateShop(shopId, shopData) {
    return this.put(`/admin/shops/${shopId}`, shopData);
  }

  async deleteShop(shopId) {
    return this.delete(`/admin/shops/${shopId}`);
  }

  async updateShopVerification(shopId, verificationData) {
    return this.put(`/admin/shops/${shopId}/verification`, verificationData);
  }

  async updateVendorShopDetails(userId, shopData) {
    // Update vendor's shop details through vendor endpoint
    return this.put(`/admin/vendors/${userId}/shop`, shopData);
  }

  async createVendorWithShop(vendorData) {
    // Create vendor with shop details
    return this.post('/admin/vendors', vendorData);
  }

  // ============================================
  // SHOP IMAGES MANAGEMENT
  // ============================================

  async uploadShopProfileImage(userId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', 'profile');
    return this.request(`/admin/vendors/${userId}/shop/profile-image`, {
      method: 'PUT',
      body: formData,
    });
  }

  async uploadShopGalleryImages(userId, imageFiles) {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    return this.request(`/admin/vendors/${userId}/shop/gallery-images`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteShopImage(userId, imageId, imageType) {
    return this.delete(`/admin/vendors/${userId}/shop/images/${imageId}?type=${imageType}`);
  }

  async setShopPrimaryImage(userId, imageId) {
    return this.put(`/admin/vendors/${userId}/shop/images/${imageId}/primary`, {});
  }

  // ============================================
  // VENDOR DOCUMENTS MANAGEMENT
  // ============================================

  async getVendorDocuments(vendorId) {
    return this.get(`/admin/vendors/${vendorId}/documents`);
  }

  async uploadVendorDocument(vendorId, documentFile, documentType) {
    const formData = new FormData();
    formData.append('document', documentFile);
    formData.append('document_type', documentType);
    return this.upload(`/admin/vendors/${vendorId}/documents`, formData);
  }

  async updateDocumentVerification(documentId, verificationData) {
    return this.put(`/admin/documents/${documentId}/verification`, verificationData);
  }

  async deleteVendorDocument(documentId) {
    return this.delete(`/admin/documents/${documentId}`);
  }

  async approveAllDocuments(vendorId, adminComments) {
    return this.put(`/admin/vendors/${vendorId}/documents/approve-all`, {
      admin_comments: adminComments
    });
  }

  // ============================================
  // ADMIN - SERVICE MANAGEMENT
  // ============================================

  async getAllServices(filters = {}) {
    return this.get('/admin/services', filters);
  }

  async getServiceById(serviceId) {
    return this.get(`/admin/services/${serviceId}`);
  }

  async createService(serviceData) {
    return this.post('/admin/services', serviceData);
  }

  async updateService(serviceId, serviceData) {
    return this.put(`/admin/services/${serviceId}`, serviceData);
  }

  async deleteService(serviceId) {
    return this.delete(`/admin/services/${serviceId}`);
  }

  async toggleServiceAvailability(serviceId, isAvailable) {
    return this.put(`/admin/services/${serviceId}/availability`, { is_available: isAvailable });
  }

  // ============================================
  // ADMIN - CATEGORY MANAGEMENT
  // ============================================

  async getAllCategories(filters = {}) {
    return this.get('/admin/categories', filters);
  }

  async getCategoryById(categoryId) {
    return this.get(`/admin/categories/${categoryId}`);
  }

  async createCategory(categoryData) {
    return this.post('/admin/categories', categoryData);
  }

  async updateCategory(categoryId, categoryData) {
    return this.put(`/admin/categories/${categoryId}`, categoryData);
  }

  async deleteCategory(categoryId) {
    return this.delete(`/admin/categories/${categoryId}`);
  }

  // ============================================
  // ADMIN - BOOKING MANAGEMENT (ADDED)
  // ============================================

  async getAllBookings(filters = {}) {
    return this.get('/admin/bookings', filters);
  }

  async getBookingById(bookingId) {
    return this.get(`/admin/bookings/${bookingId}`);
  }

  async createBooking(bookingData) {
    return this.post('/admin/bookings', bookingData);
  }

  async updateBookingStatus(bookingId, statusData) {
    return this.put(`/admin/bookings/${bookingId}/status`, statusData);
  }

  async cancelBooking(bookingId, cancellationData) {
    return this.put(`/admin/bookings/${bookingId}/cancel`, cancellationData);
  }

  async getVendorServicesForBooking(vendorId) {
    return this.get(`/admin/vendors/${vendorId}/services`);
  }
}



// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
