import axios from 'axios';

/**
 * Optimized Axios instance with caching and request deduplication
 * Handles API communication with the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Request cache with TTL
const requestCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Ongoing requests to prevent duplicates
const ongoingRequests = new Map();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to generate cache key
const generateCacheKey = (config) => {
  const { method, url, params, data } = config;
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

// Helper function to check cache validity
const isCacheValid = (cacheEntry) => {
  return cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// Request interceptor with caching and deduplication
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only cache GET requests for specific endpoints
    const shouldCache = config.method === 'get' && (
      config.url.includes('/sessions') ||
      config.url.includes('/attendance') ||
      config.url.includes('/users/profile')
    );

    if (shouldCache) {
      const cacheKey = generateCacheKey(config);
      
      // Check cache first
      const cachedResponse = requestCache.get(cacheKey);
      if (isCacheValid(cachedResponse)) {
        console.log(`🎯 Cache hit for: ${config.url}`);
        return Promise.reject({
          cached: true,
          data: cachedResponse.data,
          status: 200,
          config
        });
      }

      // Check if same request is ongoing
      if (ongoingRequests.has(cacheKey)) {
        console.log(`⏳ Waiting for ongoing request: ${config.url}`);
        return ongoingRequests.get(cacheKey);
      }

      // Mark request as ongoing
      config._cacheKey = cacheKey;
      ongoingRequests.set(cacheKey, config);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with caching and error handling
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    
    // Cache successful GET responses
    if (config._cacheKey && response.status === 200) {
      requestCache.set(config._cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      ongoingRequests.delete(config._cacheKey);
      
      // Clean old cache entries periodically
      if (requestCache.size > 100) {
        const cutoff = Date.now() - CACHE_TTL;
        for (const [key, entry] of requestCache.entries()) {
          if (entry.timestamp < cutoff) {
            requestCache.delete(key);
          }
        }
      }
    }

    return response;
  },
  (error) => {
    // Handle cached responses
    if (error.cached) {
      return Promise.resolve({
        data: error.data,
        status: error.status,
        config: error.config
      });
    }

    // Clean up ongoing requests on error
    if (error.config?._cacheKey) {
      ongoingRequests.delete(error.config._cacheKey);
    }

    // Handle common errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data.message);
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

// Clear cache function
api.clearCache = () => {
  requestCache.clear();
  ongoingRequests.clear();
  console.log('🧹 API cache cleared');
};

export default api;