.DEFAULT_GOAL := help

PYTHON := uv run python

.PHONY: help install sync runserver makemigrations migrate createsuperuser shell test coverage coverage-html coverage-xml coverage-clean format format-check lint check clean requirements pre-commit

help: ## Show available commands
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Install runtime and development dependencies
	uv sync --group dev

sync: ## Update the lockfile and install dependencies
	uv lock
	uv sync --group dev

runserver: ## Start the Django development server
	$(PYTHON) manage.py runserver

makemigrations: ## Create new database migrations
	$(PYTHON) manage.py makemigrations

migrate: ## Apply database migrations
	$(PYTHON) manage.py migrate

createsuperuser: ## Create a Django superuser
	$(PYTHON) manage.py createsuperuser

shell: ## Open the Django shell
	$(PYTHON) manage.py shell

test: ## Run the test suite with pytest
	uv run python -m pytest

coverage: ## Run tests with coverage reporting
	uv run coverage erase
	uv run python -m coverage run -m pytest
	uv run coverage report --fail-under=0

coverage-html: ## Generate an HTML coverage report
	uv run coverage html

coverage-xml: ## Generate an XML coverage report
	uv run coverage xml

coverage-clean: ## Remove coverage artifacts
	rm -rf htmlcov .coverage coverage.xml

format: ## Format code with Ruff
	uv run ruff format .

format-check: ## Check code formatting without making changes
	uv run ruff format . --check

lint: ## Run Ruff linting
	uv run ruff check .

pre-commit: ## Run fast checks executed by the pre-commit hook
	$(MAKE) format
	$(MAKE) format-check
	uv run python -m pytest

check: ## Run formatting checks, tests, and coverage
	$(MAKE) format-check
	$(MAKE) coverage

clean: ## Remove Python cache files and build artifacts
	find . -name "__pycache__" -type d -prune -exec rm -rf {} +
	find . -name "*.py[cod]" -delete

requirements: ## Regenerate requirements.txt from pyproject.toml
	uv pip compile pyproject.toml -o requirements.txt --generate-hashes --python 3.11
