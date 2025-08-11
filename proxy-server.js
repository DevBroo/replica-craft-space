const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Proxy Supabase requests
app.use('/supabase', createProxyMiddleware({
  target: 'https://riqsgtuzccwpplbodwbd.supabase.co',
  changeOrigin: true,
  pathRewrite: {
    '^/supabase': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add Supabase headers
    proxyReq.setHeader('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s');
    proxyReq.setHeader('X-Client-Info', 'picnify-web');
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to Supabase via /supabase`);
});
