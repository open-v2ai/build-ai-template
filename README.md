# BAIT: Build AI Template

Build AI Template 是一个用于快速构建 AI 应用的模板项目，基于 `FastAPI` 和 `Next.js` 构建。

> [!IMPORTANT]
> 🚀 **快速开始**：点击页面右上角的 [Use this template](https://github.com/open-v2ai/build-ai-template/generate) 按钮创建您的新项目！

[English README](README_EN.md)

## 功能特性

- [x] **智能Agent系统**：支持任务识别、自动拆解和执行跟踪
- [x] **流式对话**：实时展示Agent思考和执行过程
- [x] **用户管理**：邮箱验证码登录，支持多级用户权限
- [x] **管理后台**：集成的管理界面，支持用户管理、对话管理、系统监控
- [x] **多语言支持**：完整的中英文国际化支持
- [x] **响应式设计**：完全适配桌面端和移动端
- [x] **Docker部署**：一键式容器化部署方案
- [ ] **文件处理**：支持PDF、Excel等文档上传和解析
- [ ] **Dify集成**：一键接入 Dify API

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
cp env.example .env
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
cp env.example .env
vim .env
# 修改为你自己的配置

# 开发模式运行，默认端口 3000
pnpm dev
```

然后，打开浏览器并访问 `http://localhost:3000` 查看网页界面。

5. 访问管理员后台

管理员后台已集成在用户端中，访问 `http://localhost:3000/admin` 即可查看管理员界面。

> 🎉 **自动管理员设置**：第一个通过邮箱验证登录的用户将自动成为管理员，无需手动设置！
> 📊 **Agent任务拆解**：系统会自动识别任务型问题并进行智能拆解，实时展示执行过程！

## 部署

1. 构建 docker 镜像

```bash
cd build-ai-template/

# 构建 api 镜像
make build-api
# 构建 web 镜像
make build-web
```

2. 使用 docker compose 部署

> ⚠️ 依赖要求：
> - Docker: >= 26.0.0
> - Docker Compose: >= 2.25.0

```bash
cd build-ai-template/deploy/

# 设置环境变量
cp env.example .env
vim .env
# 修改为你自己的配置

# 后台运行
docker compose up -d
```

然后，打开浏览器并访问 `http://localhost:3000` 查看应用的网页界面，访问 `http://localhost:3000/admin` 查看管理员后台。

## 贡献指南

我们欢迎对 Build AI Template 的贡献！更多信息请参阅我们的 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

Build AI Template 采用 [Apache License 2.0](LICENSE) 许可证发布。
