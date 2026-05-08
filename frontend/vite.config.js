import { defineConfig } from 'vite'

// https://vite.dev/config/
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  root: '.', // Raíz del proyecto
  publicDir: 'public', // Directorio público
  build: {
    outDir: 'dist', // Directorio de salida
  },
  server: {
    port: 5173, // Puerto específico
    open: true, // Abrir navegador automáticamente
    host: '0.0.0.0', // Escuchar en todas las interfaces
    allowedHosts: ['localhost', '127.0.0.1', 'monsoon-aim-mashed.ngrok-free.dev', '.ngrok-free.dev'],
    // Proxy para redirigir llamadas a /api y /uploads al backend local
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    //  Configurar MIME types para archivos estáticos
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (req.url && req.url.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (req.url && req.url.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html');
        }
        next();
      });
    }
  }
})
