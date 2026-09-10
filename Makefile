.PHONY: help install run dev build start lint typecheck test test-install check registry demos gacp

# Default target - show help
.DEFAULT_GOAL := help

## Help:
help: ## Show this help message
	@printf "\n\033[1mUsage:\033[0m make \033[36m<target>\033[0m\n"
	@awk 'BEGIN {FS = ":.*##"; section=""} \
		/^## [A-Za-z]/ { section=substr($$0, 4); next } \
		/^[a-zA-Z_-]+:.*##/ { \
			if (section != "") { printf "\n\033[1m%s\033[0m\n", section; section="" } \
			printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)
	@printf "\n"

## Dev:
install: ## Install dependencies
	bun install

# Prerequisites run in order, so this is `install` then `dev` — the same
# chaining `start: build` already uses.
run: install dev ## Install dependencies and start the dev server

dev: ## Start the development server
	bun run dev

build: ## Build for production
	bun run build

start: build ## Build and start the production server
	bun run start

## Quality:
lint: ## Run ESLint
	bun run lint

typecheck: ## Run TypeScript type checking
	bun run typecheck

test: ## Run Vitest unit tests
	bun run test

check: lint typecheck test ## Run every check CI runs

test-install: ## Install a component with the real shadcn CLI and check where its files land
	RUN_REGISTRY_INSTALL_TEST=1 bun run test tests/registry-install.test.ts

## Registry:
toc: ## Rebuild lib/docs/toc.generated.ts from the doc pages
	bun run toc:build

demos: ## Rebuild lib/docs/demos.generated.ts from content/demos
	bun run demos:build

registry: ## Rebuild public/r from registry.json
	bun run registry:build

## Git:
gacp: ## Git add, commit, push (Usage: make gacp M="type(scope): message")
	git add -A && git commit -m "$(M)" && git push
