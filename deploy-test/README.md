# Build AI Template Deploy Test

## Get Started

```bash
# Clone repository
git clone https://github.com/open-v2ai/build-ai-template.git
cd build-ai-template/deploy-test

# Copy env.example to .env
cp env.example .env

# Edit .env file
vim .env

# Run services
docker compose up -d

# View logs
docker compose logs -f
```