# Variables
DOCKER_REGISTRY=v2ai
API_IMAGE=$(DOCKER_REGISTRY)/bat-api
WEB_IMAGE=$(DOCKER_REGISTRY)/bat-web
ADMIN_WEB_IMAGE=$(DOCKER_REGISTRY)/bat-admin-web
VERSION=latest

# Build Docker images
build-api:
	@echo "Building API Docker image: $(API_IMAGE):$(VERSION)..."
	docker build -t $(API_IMAGE):$(VERSION) ./api
	@echo "API Docker image built successfully: $(API_IMAGE):$(VERSION)"

build-web:
	@echo "Building web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker build -t $(WEB_IMAGE):$(VERSION) ./web
	@echo "Web Docker image built successfully: $(WEB_IMAGE):$(VERSION)"

build-admin-web:
	@echo "Building admin-web Docker image: $(ADMIN_WEB_IMAGE):$(VERSION)..."
	docker build -t $(ADMIN_WEB_IMAGE):$(VERSION) ./admin-web
	@echo "Admin-web Docker image built successfully: $(ADMIN_WEB_IMAGE):$(VERSION)"

# Push Docker images
push-api:
	@echo "Pushing API Docker image: $(API_IMAGE):$(VERSION)..."
	docker push $(API_IMAGE):$(VERSION)
	@echo "API Docker image pushed successfully: $(API_IMAGE):$(VERSION)"

push-web:
	@echo "Pushing web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker push $(WEB_IMAGE):$(VERSION)
	@echo "Web Docker image pushed successfully: $(WEB_IMAGE):$(VERSION)"

push-admin-web:
	@echo "Pushing admin-web Docker image: $(ADMIN_WEB_IMAGE):$(VERSION)..."
	docker push $(ADMIN_WEB_IMAGE):$(VERSION)
	@echo "Admin-web Docker image pushed successfully: $(ADMIN_WEB_IMAGE):$(VERSION)"

# Run Docker images
run-api:
	@echo "Running API Docker image: $(API_IMAGE):$(VERSION)..."
	docker rm -f bat-api
	docker run -d -p 8000:8000 --name bat-api -v $(PWD)/api/.env:/app/api/.env $(API_IMAGE):$(VERSION)
	@echo "API Docker image running successfully: $(API_IMAGE):$(VERSION)"

run-web:
	@echo "Running web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker rm -f bat-web
	docker run -d -p 3000:3000 --name bat-web -v $(PWD)/web/.env:/app/web/.env $(WEB_IMAGE):$(VERSION)
	@echo "Web Docker image running successfully: $(WEB_IMAGE):$(VERSION)"

run-admin-web:
	@echo "Running admin-web Docker image: $(ADMIN_WEB_IMAGE):$(VERSION)..."
	docker rm -f bat-admin-web
	docker run -d -p 3001:3001 --name bat-admin-web -v $(PWD)/admin-web/.env:/app/admin-web/.env $(ADMIN_WEB_IMAGE):$(VERSION)
	@echo "Admin-web Docker image running successfully: $(ADMIN_WEB_IMAGE):$(VERSION)"

# Build all images
build-all: build-api build-web build-admin-web

# Push all images
push-all: push-api push-web push-admin-web

# Run all images
run-all: run-api run-web run-admin-web

# Build and push all images
build-push-all: build-all push-all
	@echo "All Docker images have been built and pushed."

# Build and push images
build-push-api: build-api push-api
build-push-web: build-web push-web
build-push-admin-web: build-admin-web push-admin-web

# Phony targets
.PHONY: build-web build-admin-web build-api push-web push-admin-web push-api build-all push-all build-push-all build-push-admin-web
