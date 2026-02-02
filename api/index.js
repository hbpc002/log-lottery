const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// WebSocket 和 API 路由代理到 Rust 后端
app.all('/api/*', (req, res) => {
  // 这里我们会在 Vercel 上使用无服务器函数来处理
  // 由于 Vercel 不直接支持 Rust，我们需要使用 Node.js 代理
  res.status(503).json({ 
    error: 'Service temporarily unavailable - Rust backend needs to be deployed separately' 
  });
});

// WebSocket 处理
app.get('/ws', (req, res) => {
  res.status(503).json({ 
    error: 'WebSocket service temporarily unavailable' 
  });
});

app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});