# 1. 构建阶段
FROM node:18-alpine as builder
WORKDIR /app
# 复制依赖文件
COPY package.json package-lock.json* yarn.lock* ./
# 安装依赖
RUN npm install
# 复制所有代码
COPY . .
# 开始打包 (生成 dist 文件夹)
RUN npm run build

# 2. 运行阶段 (使用 Nginx)
FROM nginx:alpine
# 将构建好的文件放入 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 暴露 80 端口
EXPOSE 80
# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
