
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This shim makes process.env.API_KEY available in the browser code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // General shim for process.env to prevent ReferenceErrors
      'process.env': {
        API_KEY: env.API_KEY || ''
      }
    },
    server: {
      port: 3000,
      host: true, // Essential for Linux/Docker access
      strictPort: true,
    },
    build: {
      outDir: 'dist',
    },
  };
});
