// Network configuration for different environments
const config = {
  // Development - Local network access
  development: {
    apiUrl: 'http://10.45.137.92:5000',
    socketUrl: 'http://10.45.137.92:5000',
    frontendUrl: 'http://10.45.137.92:3000'
  },
  // Local development
  local: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000',
    frontendUrl: 'http://localhost:3000'
  },
  // Production (when deployed)
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://backend-1-nhfe.onrender.com',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'https://backend-1-nhfe.onrender.com',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'https://frontend-eight-chi-46.vercel.app'
  }
};

// Get current environment
const getEnvironment = () => {
  const hostname = window.location.hostname;
  
  // Check if it's localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }
  
  // Check if it's local network IP (for mobile/other devices)
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
    return 'development';
  }
  
  // Default to production for deployed apps
  return 'production';
};

// Export current configuration
export const currentConfig = config[getEnvironment()];

// Helper function to get API URL
export const getApiUrl = () => currentConfig.apiUrl;

// Helper function to get Socket URL
export const getSocketUrl = () => currentConfig.socketUrl;

export default currentConfig;
