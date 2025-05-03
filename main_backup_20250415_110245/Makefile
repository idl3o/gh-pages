# Web3 Crypto Streaming Platform Build Tools
# Compatible with Linux, macOS, and Windows (with WSL2)

# Default platform detection and settings
OS := $(shell uname -s)
DOTNET := dotnet
NPM := npm
DOCKER := docker

# Override commands for Windows detection (when not in WSL)
ifeq ($(OS),Windows_NT)
	DOTNET := dotnet.exe
endif

# Override for macOS architecture detection
ifeq ($(OS),Darwin)
	ARCH := $(shell uname -m)
	ifeq ($(ARCH),arm64)
		# M1/M2 specific settings
		DOTNET_FLAGS := --arch arm64
	endif
endif

# Configuration
BUILD_CONFIG := Release
DOCKER_REGISTRY := myregistry.io
VERSION := $(shell git describe --tags --always --dirty)
TIMESTAMP := $(shell date -u +"%Y%m%d%H%M%S")

# Targets
.PHONY: all clean build test run docker-build docker-run setup-dev

all: build

# Clean project
clean:
	@echo "Cleaning project..."
	$(DOTNET) clean
	rm -rf node_modules
	rm -rf build
	rm -rf dist

# Build everything
build: build-dotnet build-frontend

# Build .NET components
build-dotnet:
	@echo "Building .NET components..."
	cd dotnet && $(DOTNET) restore $(DOTNET_FLAGS)
	cd dotnet && $(DOTNET) build -c $(BUILD_CONFIG) $(DOTNET_FLAGS)

# Build frontend
build-frontend:
	@echo "Building frontend..."
	$(NPM) ci
	$(NPM) run build

# Run tests
test: test-dotnet test-frontend

test-dotnet:
	@echo "Testing .NET components..."
	cd dotnet && $(DOTNET) test -c $(BUILD_CONFIG) $(DOTNET_FLAGS)

test-frontend:
	@echo "Testing frontend..."
	$(NPM) test

# Run development servers
run:
	@echo "Starting development servers..."
	$(DOCKER) compose up

# Set up development environment
setup-dev:
	@echo "Setting up development environment..."
ifeq ($(OS),Linux)
	# Linux setup
	sudo apt-get update
	sudo apt-get install -y curl git build-essential
	# Install .NET SDK
	curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 6.0
	# Install Node.js
	curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
	sudo apt-get install -y nodejs
	# Install Docker
	sudo apt-get install -y docker.io docker-compose
	sudo usermod -aG docker $(USER)
	@echo "You may need to log out and log back in for Docker permissions to take effect"
else ifeq ($(OS),Darwin)
	# macOS setup
	which brew > /dev/null || { echo "Installing Homebrew..."; /bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; }
	brew install node dotnet
	brew install --cask docker
	@echo "Please start Docker Desktop manually"
else
	@echo "For Windows, please install:"
	@echo "1. WSL2 with Ubuntu 22.04"
	@echo "2. Docker Desktop with WSL2 backend"
	@echo "3. .NET SDK 6.0"
	@echo "4. Node.js 18.x"
	@echo "Then run this makefile from within WSL2"
endif

# Build Docker images
docker-build:
	@echo "Building Docker images..."
	$(DOCKER) compose build

# Run Docker stack
docker-run:
	@echo "Running Docker stack..."
	$(DOCKER) compose up -d
