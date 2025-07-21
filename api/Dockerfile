# base image
FROM python:3.12.10-alpine3.21 AS base

WORKDIR /app

RUN pip install --no-cache-dir uv==0.6.16
# in China, you can use ustc mirror to speed up
# RUN pip install --no-cache-dir uv==0.6.16 -i https://pypi.mirrors.ustc.edu.cn/simple

FROM base AS packages

RUN apk add --no-cache \
    gcc g++ libc-dev libffi-dev gmp-dev mpfr-dev mpc1-dev libpq-dev

# Install Python dependencies
COPY pyproject.toml uv.lock ./

RUN uv sync --locked

# production stage
FROM base AS production

RUN apk add --no-cache libpq-dev

WORKDIR /app

EXPOSE 8000

# Copy Python environment and packages
ENV VIRTUAL_ENV=/app/.venv
COPY --from=packages ${VIRTUAL_ENV} ${VIRTUAL_ENV}
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

# Copy source code
COPY . /app/

ENTRYPOINT ["python", "-m", "app.main"]
