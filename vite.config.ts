import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // 处理生产环境下环境变量的注入
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8080,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8080,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});