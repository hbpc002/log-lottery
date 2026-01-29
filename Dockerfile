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
FROM rust:latest as backend-builder

WORKDIR /usr/src/app
COPY ws_server/Cargo.toml ./ws_server/
COPY ws_server/src ./ws_server/src

RUN cd ws_server && cargo build --release

# 运行时镜像
FROM nginx:1.26-alpine as runtime

# 安装 socat 用于支持 WebSocket
RUN apk add --no-cache socat

# 复制前端文件
COPY --from=frontend-builder /usr/src/app/frontend/dist /usr/share/nginx/html

# 暂时跳过后端，只运行前端
# COPY --from=backend-builder /usr/src/app/ws_server/target/release/ws_server /usr/local/bin/ws_server

# 创建简化的启动脚本，只运行前端
RUN tee /start.sh > /dev/null <<'EOL'
#!/bin/sh
# 动态生成Nginx配置，使用Render的PORT环境变量
cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen ${PORT:-80};
    server_name localhost;
    
    # 根路径重定向到 /log-lottery/
    location = / {
        return 301 /log-lottery/;
    }
    
    # 前端静态文件 - 匹配 /log-lottery/ 路径
    location /log-lottery/ {
        alias /usr/share/nginx/html/;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # 前端静态资源 - 匹配特定目录
    location /log-lottery/js/ {
        alias /usr/share/nginx/html/js/;
    }
    
    location /log-lottery/css/ {
        alias /usr/share/nginx/html/css/;
    }
    
    location /log-lottery/assets/ {
        alias /usr/share/nginx/html/assets/;
    }
    
    location /log-lottery/png/ {
        alias /usr/share/nginx/html/png/;
    }
    
    location /log-lottery/mp3/ {
        alias /usr/share/nginx/html/mp3/;
    }
    
    location /log-lottery/wav/ {
        alias /usr/share/nginx/html/wav/;
    }
    
    # 暂时禁用API路由
    location /log-lottery/api/ {
        return 404;
    }
    
    # 暂时禁用WebSocket
    location /log-lottery/ws {
        return 404;
    }
}
EOF

# 启动 nginx
nginx -g 'daemon off;'
EOL

RUN chmod +x /start.sh

# 不再EXPOSE固定端口，让Render控制
CMD ["/start.sh"]