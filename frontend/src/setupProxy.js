const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    })
  );
  
  // Proxy Socket.IO requests specifically
  // Quan trọng: ws: true để hỗ trợ WebSocket
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      ws: true,
      secure: false,
      logLevel: 'silent', // Giảm log ồn ào
    })
  );
};
