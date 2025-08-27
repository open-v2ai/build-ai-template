# Build AI Template API

Build AI Template API is the core component of Build AI Template, responsible for handling all the API requests and responses.

## Project Structure

```bash
/
├── app/
│   ├── main.py               # FastAPI instance creation and route registration entry point
│   ├── routers/              # Route related code
│   │   ├── v1/               # API versioning
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   ├── core/                 # Core configuration, startup settings, etc.
│   │   ├── config.py         # Environment variables and configuration file loading
│   │   ├── security.py       # Security related logic, e.g., password encryption, JWT
│   ├── models/               # Data models, typically SQLAlchemy models
│   │   ├── user.py
│   ├── schemas/              # Pydantic models (request and response validation)
│   │   ├── user.py
│   │   ├── chat.py
│   │   ├── message.py
│   ├── crud/                 # Database operations encapsulation (Create, Read, Update, Delete)
│   │   ├── user.py
│   │   ├── chat.py
│   │   ├── message.py
│   ├── services/             # Business logic modules
│   │   ├── user_service.py
│   │   ├── email_service.py
│   ├── db/                   # Database initialization and session management
│   │   ├── base.py           # Base class definition
│   ├── dependencies/         # FastAPI Depends related logic
│   │   ├── db.py
│   ├── util/                # Utility functions
│   │   ├── db.py
│   ├── templates/           # Email templates
├── alembic/                  # Database migration directory (if using Alembic)
├── scripts/                  # Scripts directory
├── env.example             # Environment variables file
├── pyproject.toml           # Project configuration file
├── uv.lock                  # Dependency lock file
├── README.md
```

## Get Started

> ⚠️ Requirements:
> - Python: >= 3.10 (3.12.10 recommended)
> - uv: >= 0.6 (0.6.16 recommended)

### Install database with Docker

```bash
cd ./api

bash scripts/run_postgres.sh
bash scripts/run_redis.sh
```

### Configuration

```bash
cp env.example .env
# Edit .env file
```

### Local Development

use [uv](https://docs.astral.sh/uv/getting-started/installation/) to install the dependencies.

```bash
uv sync

# activate virtual environment
source .venv/bin/activate

# run in dev mode in port 8000
python -m app.main
```

### Run with Docker

```bash
docker build -t build-ai-template-api:0.1.0 .

cp env.example .env
# Edit .env file

docker run -d --name build-ai-template-api \
    -p 8000:8000 \
    -v $(pwd)/.env:/app/.env \
    build-ai-template-api:0.1.0
```
