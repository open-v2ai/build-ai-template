# Build AI Template

Build AI Template is a template project for quickly building AI applications, based on FastAPI and Next.js.

> [!IMPORTANT]
> 🚀 **Quick Start**: Click the [Use this template](https://github.com/open-v2ai/build-ai-template/generate) button in the top right corner of the page to create your new project!

[中文 README](README.md)

## Features

- [x] Deploy agent with docker and docker-compose
- [x] Chat with agent via web ui
- [ ] Build agent with simple yaml config

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

## Deploy

1. Build the docker image

```bash
cd build-ai-template/

# build the docker image
make build-web
make build-api
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

Then, open your browser and navigate to `http://localhost:3000` to see the web ui.

## Contributing

We welcome contributions to Build AI Template! Please see our [CONTRIBUTING_EN.md](CONTRIBUTING_EN.md) for more information.

## License

Build AI Template is released under the [Apache License 2.0](LICENSE).

