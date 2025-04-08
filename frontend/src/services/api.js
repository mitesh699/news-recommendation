import axios from 'axios';
import { secureStorage } from './storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Get auth token from secure storage
    const token = secureStorage.getItem('auth_token');
    
    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available (for form submissions)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add request ID for tracing (if not already set)
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = generateRequestId();
    }
    
    return config;
  },
  (error) => {
    // Do something with request error
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx triggers this function
    return response.data;
  },
  (error) => {
    // Any status codes outside the range of 2xx trigger this function
    const { response } = error;
    
    // Handle authentication errors
    if (response?.status === 401) {
      // Clear auth data and redirect to login page
      secureStorage.removeItem('auth_token');
      secureStorage.removeItem('user');
      
      // Redirect to login page with return URL
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return Promise.reject(new Error('Authentication required. Please login again.'));
    }
    
    // Handle forbidden errors
    if (response?.status === 403) {
      // Handle permission errors
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }
    
    // Handle server errors
    if (response?.status >= 500) {
      // Log server errors
      console.error('Server error:', response);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Handle validation errors (422 Unprocessable Entity)
    if (response?.status === 422) {
      // Return validation errors for form handling
      return Promise.reject({
        message: 'Validation failed. Please check your input.',
        errors: response.data.errors || {}
      });
    }
    
    // Handle other errors
    return Promise.reject(
      error.response?.data?.message || 
      error.message || 
      'An unexpected error occurred'
    );
  }
);

// Generate unique request ID for tracing
const generateRequestId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// API endpoints
export const newsService = {
  // Get featured news
  getFeaturedNews: () => {
    return api.get('/news/featured');
  },
  
  // Get news based on search query and filters
  searchNews: (query, filters = {}) => {
    return api.get('/news/search', {
      params: {
        q: query,
        ...filters
      }
    });
  },
  
  // Get news for a specific topic
  getTopicNews: (topicId, filters = {}) => {
    return api.get(`/news/topics/${topicId}`, {
      params: filters
    });
  },
  
  // Get a specific article
  getArticle: (articleId) => {
    return api.get(`/news/articles/${articleId}`);
  },
  
  // Get trending news
  getTrendingNews: (location = 'global') => {
    return api.get('/news/trending', {
      params: { location }
    });
  },
  
  // Get recommended news for user
  getRecommendations: () => {
    return api.get('/news/recommendations');
  },
  
  // Save/bookmark an article
  saveArticle: (articleId) => {
    return api.post('/user/saved-articles', { articleId });
  },
  
  // Unsave/unbookmark an article
  unsaveArticle: (articleId) => {
    return api.delete(`/user/saved-articles/${articleId}`);
  },
  
  // Get user's saved articles
  getSavedArticles: () => {
    return api.get('/user/saved-articles');
  },
  
  // Record article view (for history)
  recordArticleView: (articleId) => {
    return api.post('/user/article-views', { articleId });
  },
  
  // Get user's reading history
  getReadingHistory: () => {
    return api.get('/user/article-views');
  },
  
  // Clear reading history
  clearReadingHistory: () => {
    return api.delete('/user/article-views');
  },
  
  // Submit article feedback
  submitArticleFeedback: (articleId, feedback) => {
    return api.post(`/news/articles/${articleId}/feedback`, feedback);
  }
};

export const authService = {
  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  // User registration
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // User logout
  logout: () => {
    return api.post('/auth/logout')
      .finally(() => {
        // Clear local storage regardless of API response
        secureStorage.removeItem('auth_token');
        secureStorage.removeItem('user');
      });
  },
  
  // Get current user profile
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
  
  // Update user profile
  updateProfile: (profileData) => {
    return api.put('/user/profile', profileData);
  },
  
  // Update user preferences
  updatePreferences: (preferences) => {
    return api.put('/user/preferences', preferences);
  },
  
  // Change password
  changePassword: (passwordData) => {
    return api.put('/auth/password', passwordData);
  },
  
  // Request password reset
  requestPasswordReset: (email) => {
    return api.post('/auth/password/reset', { email });
  },
  
  // Validate token from reset email
  validateResetToken: (token) => {
    return api.get(`/auth/password/reset/${token}/validate`);
  },
  
  // Reset password with token
  resetPassword: (token, password) => {
    return api.post(`/auth/password/reset/${token}`, { password });
  },
  
  // Two-factor authentication setup
  setup2FA: () => {
    return api.post('/auth/2fa/setup');
  },
  
  // Verify two-factor authentication
  verify2FA: (code) => {
    return api.post('/auth/2fa/verify', { code });
  },
  
  // Disable two-factor authentication
  disable2FA: (code) => {
    return api.delete('/auth/2fa', { data: { code } });
  }
};

export const userService = {
  // Get user's notification settings
  getNotificationSettings: () => {
    return api.get('/user/notifications/settings');
  },
  
  // Update notification settings
  updateNotificationSettings: (settings) => {
    return api.put('/user/notifications/settings', settings);
  },
  
  // Get user's notifications
  getNotifications: () => {
    return api.get('/user/notifications');
  },
  
  // Mark notification as read
  markNotificationRead: (notificationId) => {
    return api.put(`/user/notifications/${notificationId}/read`);
  },
  
  // Mark all notifications as read
  markAllNotificationsRead: () => {
    return api.put('/user/notifications/read-all');
  },
  
  // Update privacy settings
  updatePrivacySettings: (settings) => {
    return api.put('/user/privacy-settings', settings);
  },
  
  // Get user activity log
  getActivityLog: () => {
    return api.get('/user/activity-log');
  },
  
  // Download user data
  downloadUserData: () => {
    return api.get('/user/data-export', {
      responseType: 'blob'
    });
  },
  
  // Request account deletion
  requestAccountDeletion: () => {
    return api.post('/user/account-deletion');
  }
};

// Export default API instance for custom use
export default api;