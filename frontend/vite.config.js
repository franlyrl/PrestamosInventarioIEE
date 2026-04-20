import { defineConfig } from 'vite'

// https://vite.dev/config/
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
    // Proxy para redirigir llamadas a /api y /uploads al backend
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:4000',
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
