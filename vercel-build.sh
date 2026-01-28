#!/bin/bash
# Vercel 构建脚本
set -e

# 安装前端依赖
echo "安装前端依赖..."
pnpm install

# 构建前端
echo "构建前端..."
pnpm run build

# 构建后端
echo "构建后端..."
cd ws_server
cargo build --release
cd ..

echo "构建完成!"