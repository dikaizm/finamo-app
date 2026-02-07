.PHONY: help install build-dev build-staging build-prod build-all clean

help:
	@echo "Available targets:"
	@echo "  make install         - Install dependencies"
	@echo "  make build-dev       - Build development APK"
	@echo "  make build-staging   - Build staging APK"
	@echo "  make build-prod      - Build production APK"
	@echo "  make build-all       - Build all APK variants"
	@echo "  make clean           - Clean build artifacts"

install:
	@echo "Installing dependencies..."
	npm install

build-dev:
	@echo "Building development APK..."
	@mkdir -p builds/android && \
	TS=$$(date +%Y%m%d-%H%M) && \
	eas build -p android --profile development --local --output ./builds/android/app-dev-$$TS.apk

build-staging:
	@echo "Building staging APK..."
	@mkdir -p builds/android && \
	TS=$$(date +%Y%m%d-%H%M) && \
	eas build -p android --profile preview --local --output ./builds/android/app-staging-$$TS.apk

build-prod:
	@echo "Building production APK..."
	@mkdir -p builds/android && \
	TS=$$(date +%Y%m%d-%H%M) && \
	eas build -p android --profile production --local --output ./builds/android/app-prod-$$TS.aab

build-all: build-dev build-staging build-prod

clean:
	@echo "Cleaning build artifacts..."
	rm -rf builds
	rm -rf artifacts
	cd android && ./gradlew clean
