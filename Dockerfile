# 多阶段构建 - 前端构建
FROM node:22-alpine as frontend-builder

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app/frontend
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY src ./src
COPY public ./public
COPY static ./static

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Rust 后端构建
FROM rust:1.85 as backend-builder

# 安装必要的构建工具
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app/backend
COPY ws_server/Cargo.toml ./ws_server/
COPY ws_server/src ./ws_server/src

RUN cd ws_server && cargo build --release

# 运行时镜像
FROM nginx:1.26-alpine as runtime

# 安装 socat 用于支持 WebSocket
RUN apk add --no-cache socat

# 复制前端文件
COPY --from=frontend-builder /usr/src/app/frontend/dist /usr/share/nginx/html

# 复制后端二进制文件
COPY --from=backend-builder /usr/src/app/backend/ws_server/target/release/ws_server /usr/local/bin/ws_server

# 创建启动脚本（动态生成Nginx配置）
RUN tee /start.sh > /dev/null <<'EOL'
#!/bin/sh
# 动态生成Nginx配置，使用Render的PORT环境变量
cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen ${PORT:-80};
    server_name localhost;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket 支持
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启动后端服务
ws_server &
# 启动 nginx
nginx -g 'daemon off;'
EOL

RUN chmod +x /start.sh

# 不再EXPOSE固定端口，让Render控制
CMD ["/start.sh"]