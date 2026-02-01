import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 显式设置基础路径为根目录
  base: '/',
  define: {
    // 确保环境变量正确传递
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