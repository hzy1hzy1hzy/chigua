import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 使用相对路径基础，防止部署在非根目录下时的资源丢失
  base: './',
  define: {
    // 确保 API_KEY 能正确注入到客户端代码
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
    target: 'esnext',
    sourcemap: false
  }
});