# BAIT: Build AI Template

Build AI Template is a template project for quickly building AI applications, based on FastAPI and Next.js.

> [!IMPORTANT]
> 🚀 **Quick Start**: Click the [Use this template](https://github.com/open-v2ai/build-ai-template/generate) button in the top right corner of the page to create your new project!

[中文 README](README.md)

## Features

- [x] **Intelligent Agent System**: Support task recognition, automatic decomposition and execution tracking
- [x] **Streaming Conversation**: Real-time display of Agent thinking and execution process
- [x] **User Management**: Email verification code login with multi-level user permissions
- [x] **Admin Dashboard**: Integrated admin interface with user management, chat management, system monitoring
- [x] **Multi-language Support**: Complete Chinese and English internationalization
- [x] **Responsive Design**: Fully compatible with desktop and mobile devices
- [x] **Docker Deployment**: One-click containerized deployment solution
- [ ] **File Processing**: Support PDF, Excel document upload and parsing
- [ ] **Dify Integration**: One-click integration with Dify API

## Quick Start

> [!IMPORTANT]
> 🎯 **AI Collaboration Tip**: When developing with Cursor or other AI tools, it's recommended to provide the [PRD_EN.md](PRD_EN.md) document content to the AI to get more accurate technical solutions and code implementations that align with the project architecture.

> ⚠️ Minimum system requirements:
> - CPU: 2 Cores
> - Memory: 4 GB
> - Storage: 20 GB

1. Clone the repository

```bash
git clone https://github.com/open-v2ai/build-ai-template.git
```

2. Run database service

```bash
cd build-ai-template/

# run postgres
bash api/scripts/run_postgres.sh

# run redis
bash api/scripts/run_redis.sh
```

3. Run the api server

> ⚠️ Requirements:
> - Python: >= 3.10 (3.12.10 recommended)
> - uv: >= 0.6 (0.6.16 recommended)

```bash
cd build-ai-template/api/

# install dependencies
uv sync

# activate virtual environment
source venv/bin/activate

# set environment variables
cp .env.example .env
vim .env
# change all the values to your own

# run in dev mode in port 8000
python -m app.main
```

4. Run the web ui

> ⚠️ Requirements:
> - Node.js: >= 18.19.0
> - npm: >= 10.8.2
> - pnpm: >= 10.11.0

```bash
# open a new terminal
cd build-ai-template/web/

# install dependencies
pnpm install

# set environment variables
cp .env.example .env
vim .env
# change all the values to your own

# run in dev mode in port 3000
pnpm dev
```

Then, open your browser and navigate to `http://localhost:3000` to see the web ui.

5. Access the admin dashboard

The admin dashboard is integrated into the user frontend. Visit `http://localhost:3000/admin` to access the admin interface.

> 🎉 **Automatic Admin Setup**: The first user who logs in via email verification will automatically become an administrator, no manual setup required!
> 📊 **Agent Task Decomposition**: The system automatically recognizes task-oriented questions and performs intelligent decomposition, displaying the execution process in real-time!

## Deploy

1. Build the docker image

```bash
cd build-ai-template/

# build api image
make build-api
# build web image
make build-web
```

2. Use docker compose to deploy

> ⚠️ Requirements:
> - Docker: >= 26.0.0
> - Docker Compose: >= 2.25.0

```bash
cd build-ai-template/deploy/

# set environment variables
cp .env.example .env
vim .env
# change all the values to your own

# run in background
docker compose up -d
```

Then, open your browser and navigate to `http://localhost:3000` to see the web ui, and visit `http://localhost:3000/admin` to see the admin dashboard.

## Contributing

We welcome contributions to Build AI Template! Please see our [CONTRIBUTING_EN.md](CONTRIBUTING_EN.md) for more information.

## License

Build AI Template is released under the [Apache License 2.0](LICENSE).

