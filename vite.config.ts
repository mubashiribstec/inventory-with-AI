
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env': {
        API_KEY: env.API_KEY || ''
      }
    },
    server: {
      port: 5173, // Move Vite to 5173 to avoid conflict with Express on 3000
      host: true,
      strictPort: true,
      proxy: {
        // Proxy API requests to the Express server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
    },
  };
});
