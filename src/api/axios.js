// 📁 src/api/axios.js
import axios from 'axios';
import { getApiUrl } from '../config/network';

const instance = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add timeout for mobile networks
  config.timeout = 10000;
  
  return config;
});

// Add response interceptor for better error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('Network Error - Check if backend is running on:', getApiUrl());
    }
    return Promise.reject(error);
  }
);

export default instance;
