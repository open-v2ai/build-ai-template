# BAT: Build AI Template

Build AI Template 是一个用于快速构建 AI 应用的模板项目，基于 `FastAPI` 和 `Next.js` 构建。

> [!IMPORTANT]
> 🚀 **快速开始**：点击页面右上角的 [Use this template](https://github.com/open-v2ai/build-ai-template/generate) 按钮创建您的新项目！

[English README](README_EN.md)

## 功能特性

- [x] 使用 docker 和 docker-compose 部署智能体；
- [x] 通过网页界面与智能体对话；
- [x] 管理员后台，支持用户管理、会话查看、智能体管理等；
- [ ] 一键接入 Dify API；

## 快速开始

> [!IMPORTANT]
> 🎯 **AI 协作提示**：使用 Cursor 或其他 AI 工具进行开发时，建议将 [PRD.md](PRD.md) 文档内容一同提供给 AI，以获得更准确、更符合项目架构的技术方案和代码实现。

> ⚠️ 最低系统要求：
> - CPU：2 核
> - 内存：4 GB
> - 存储：20 GB

1. 克隆仓库

```bash
git clone https://github.com/open-v2ai/build-ai-template.git
```

2. 运行数据库服务

```bash
cd build-ai-template/

# 运行 postgres
bash api/scripts/run_postgres.sh

# 运行 redis
bash api/scripts/run_redis.sh
```

3. 运行 API 服务器

> ⚠️ 依赖要求：
> - Python: >= 3.10（推荐 3.12.10）
> - uv: >= 0.6（推荐 0.6.16）

```bash
cd build-ai-template/api/

# 安装依赖
uv sync

# 激活虚拟环境
source venv/bin/activate

# 设置环境变量
cp .env.example .env
vim .env
# 修改为你自己的配置

# 开发模式运行，端口 8000
python -m app.main
```

4. 运行网页界面

> ⚠️ 依赖要求：
> - Node.js: >= 18.19.0
> - npm: >= 10.8.2
> - pnpm: >= 10.11.0

```bash
# 新开一个终端
cd build-ai-template/web/

# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env
vim .env
# 修改为你自己的配置

# 开发模式运行，默认端口 3000
pnpm dev
```

然后，打开浏览器并访问 `http://localhost:3000` 查看网页界面。

5. 运行管理员后台

```bash
# 新开一个终端
cd build-ai-template/admin-web/

# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env
vim .env
# 修改为你自己的配置

# 开发模式运行，默认端口 3001
pnpm dev
```

然后，打开浏览器并访问 `http://localhost:3001` 查看管理员界面。

> 🎉 **自动管理员设置**：第一个通过邮箱验证登录的用户将自动成为管理员，无需手动设置！

## 部署

1. 构建 docker 镜像

```bash
cd build-ai-template/

# 构建 api 镜像
make build-api
# 构建 web 镜像
make build-web
# 构建 admin-web 镜像
make build-admin-web
```

2. 使用 docker compose 部署

> ⚠️ 依赖要求：
> - Docker: >= 26.0.0
> - Docker Compose: >= 2.25.0

```bash
cd build-ai-template/deploy/

# 设置环境变量
cp .env.example .env
vim .env
# 修改为你自己的配置

# 后台运行
docker compose up -d
```

然后，打开浏览器并访问 `http://localhost:3000` 查看应用的网页界面，访问 `http://localhost:3001` 查看管理员后台。

## 贡献指南

我们欢迎对 Build AI Template 的贡献！更多信息请参阅我们的 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

Build AI Template 采用 [Apache License 2.0](LICENSE) 许可证发布。
