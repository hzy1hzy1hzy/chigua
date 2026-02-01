
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 确保在浏览器环境中也能访问到 process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    host: true,
    port: parseInt(process.env.PORT || '8080'),
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
