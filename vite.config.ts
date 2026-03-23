import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      cors: false,
      proxy: {
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          secure: true,
          ws: false,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 添加 Authorization 头
              if (env.VITE_DEEPSEEK_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_DEEPSEEK_API_KEY}`);
                console.log('🔑 Added Authorization header to proxy request');
              }
              // 确保 Content-Type 正确
              proxyReq.setHeader('Content-Type', 'application/json');
              // 添加其他必要的头
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('User-Agent', 'Vite-Proxy/1.0');
            });
            
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('📥 Proxy response:', proxyRes.statusCode, req.url);
            });
            
            proxy.on('error', (err, req, res) => {
              console.error('❌ Proxy error:', err);
              if (res && !res.headersSent) {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ error: 'Proxy error', message: `${err.message}${req.url ? ` (${req.url})` : ''}` }));
              }
            });
          }
        }
      }
    }
  }
})
