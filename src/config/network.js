// Network configuration for different environments
const config = {
  // Development - Local network access
  development: {
    apiUrl: 'http://10.45.137.92:5000' || 'https://backend-1-nhfe.onrender.com',
    socketUrl: 'http://10.45.137.92:5000' || 'https://backend-1-nhfe.onrender.com',
    frontendUrl: 'http://10.45.137.92:3000' || 'https://backend-1-nhfe.onrender.com'
  },
  // Local development
  local: {
    apiUrl: 'http://localhost:5000' || 'https://backend-1-nhfe.onrender.com',
    socketUrl: 'http://localhost:5000' || 'https://backend-1-nhfe.onrender.com',
    frontendUrl: 'http://localhost:3000'  || 'https://backend-1-nhfe.onrender.com'
  },
  // Production (when deployed)
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://10.45.137.92:5000'  || 'https://backend-1-nhfe.onrender.com',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://10.45.137.92:5000' || 'https://backend-1-nhfe.onrender.com',
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://10.45.137.92:3000'  || 'https://backend-1-nhfe.onrender.com'
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
