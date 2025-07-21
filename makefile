# Variables
DOCKER_REGISTRY=v2ai
WEB_IMAGE=$(DOCKER_REGISTRY)/build-ai-template-web
API_IMAGE=$(DOCKER_REGISTRY)/build-ai-template-api
VERSION=latest

# Build Docker images
build-web:
	@echo "Building web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker build -t $(WEB_IMAGE):$(VERSION) ./web
	@echo "Web Docker image built successfully: $(WEB_IMAGE):$(VERSION)"

build-api:
	@echo "Building API Docker image: $(API_IMAGE):$(VERSION)..."
	docker build -t $(API_IMAGE):$(VERSION) ./api
	@echo "API Docker image built successfully: $(API_IMAGE):$(VERSION)"

# Push Docker images
push-web:
	@echo "Pushing web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker push $(WEB_IMAGE):$(VERSION)
	@echo "Web Docker image pushed successfully: $(WEB_IMAGE):$(VERSION)"

push-api:
	@echo "Pushing API Docker image: $(API_IMAGE):$(VERSION)..."
	docker push $(API_IMAGE):$(VERSION)
	@echo "API Docker image pushed successfully: $(API_IMAGE):$(VERSION)"

# Run Docker images
run-web:
	@echo "Running web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker rm -f build-ai-template-web
	docker run -d -p 3000:3000 --name build-ai-template-web -v $(PWD)/web/.env:/app/web/.env $(WEB_IMAGE):$(VERSION)
	@echo "Web Docker image running successfully: $(WEB_IMAGE):$(VERSION)"

run-api:
	@echo "Running API Docker image: $(API_IMAGE):$(VERSION)..."
	docker rm -f build-ai-template-api
	docker run -d -p 8000:8000 --name build-ai-template-api -v $(PWD)/api/.env:/app/api/.env $(API_IMAGE):$(VERSION)
	@echo "API Docker image running successfully: $(API_IMAGE):$(VERSION)"

# Build all images
build-all: build-web build-api

# Push all images
push-all: push-web push-api

# Run all images
run-all: run-web run-api

# Build and push all images
build-push-api: build-api push-api
build-push-web: build-web push-web

# Build and push all images
build-push-all: build-all push-all
	@echo "All Docker images have been built and pushed."

# Phony targets
.PHONY: build-web build-api push-web push-api build-all push-all build-push-all
