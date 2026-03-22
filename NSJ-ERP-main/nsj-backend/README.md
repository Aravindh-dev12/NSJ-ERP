# NSJ Backend – Nitip Shah Jewels

Backend services for the Nitip Shah Jewels ERP platform. The project serves JSON APIs powered by Django 5 and function-based views, with session-cookie authentication shared with the Next.js frontend.

## Contents
- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Project Layout](#project-layout)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Developer Workflow](#developer-workflow)
- [API Surface](#api-surface)
- [Testing](#testing)
- [Documentation Index](#documentation-index)
- [Contributing](#contributing)
- [License](#license)

## Highlights
- Multi-tenant ERP data model: companies, branches, accounts, products, metal rates
- Session-authenticated JSON APIs with CSRF protection and pagination defaults
- Function-based Django views backed by DRF serializers for predictable validation
- Rich Accounts CRUD including nested contact/bank/tax/opening balance handling
- uv-managed Python environment with Makefile tasks for repeatable automation

## Tech Stack
- **Runtime**: Python 3.11, Django 5.2.7, Django REST Framework 3.16.1
- **Database**: SQLite for development; PostgreSQL recommended for production
- **Tooling**: uv dependency management, Ruff formatting/linting, pytest test suite
- **Auth & CORS**: Session authentication, CSRF cookies, django-cors-headers

## Project Layout
```
nsj-backend/
├── accounts/         # Accounts CRUD views, serializers, tests, migrations
├── core/             # Company/branch/location masters and seed data
├── docs/             # Architecture and API documentation assets
├── nsj_backend/      # Django project (settings, URLs, ASGI/WSGI)
├── products/         # Product catalogue domain logic
├── rates/            # Daily and party metal rate models and admin
├── tests/            # Pytest suite spanning cross-app functionality
├── users/            # Custom user model, roles, and session views
├── Makefile          # Convenience wrappers around uv and Django commands
├── pyproject.toml    # Project metadata and dependency declarations
├── uv.lock           # Locked dependency graph produced by uv
├── requirements.txt  # Generated lock for downstream tooling
├── README.md         # You are here
└── docs/api_accounts.md (and related guides)
```

Each app keeps its `models`, `views`, `serializers`, `admin`, and `tests` colocated. Shared helpers live inside app modules to keep multi-tenant rules scoped and discoverable.

## Getting Started

### Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) 0.8.0 or newer
- `make`
- SQLite (bundled) or PostgreSQL for production deployments

### Local Setup
```bash
git clone <repo-url>
cd nsj-backend
make install            # create .venv and install runtime + dev deps
make migrate            # apply migrations against SQLite (default)
make createsuperuser    # optional – interactive superuser creation
make runserver          # launch at http://localhost:8000
```

Use `make help` to discover additional shortcuts. uv keeps the virtual environment in `.venv`; activate manually via `source .venv/bin/activate` if you prefer direct shell access.

### Verifying the Stack
- `make test` ensures the pytest suite (including Accounts API scenarios) passes.
- `make check` runs formatting plus coverage to mirror CI enforcement.
- `python test_setup.py` seeds admin-friendly fixtures used during early demos.

## Configuration
- Settings load environment overrides from a local `.env`. Copy `.env.example` if one exists or define variables inline in your shell.
- Default DB is SQLite. For PostgreSQL, update `DATABASES` in `nsj_backend/settings.py` or configure `DJANGO_DB_*` variables before startup.
- CORS is open during development and trusts localhost/127.0.0.1 origins by default. Adjust `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` when deploying.
- Sessions are long-lived (30 days, sliding). Use HTTPS and secure cookies in production.

## Developer Workflow
- Dependency hygiene: `uv add <package>` (runtime) or `uv add --group dev <package>` for tooling. Commit `pyproject.toml`, `uv.lock`, and regenerated `requirements.txt` when dependencies change.
- Formatting and linting: `make format` applies Ruff formatting; `make format-check` or `make lint` keep the tree clean.
- Tests: prefer `make test` for local runs; `make coverage` when you need coverage metrics.
- Git hooks: `uv run pre-commit install` installs a hook that runs `make pre-commit` (format check + pytest) before each commit.

## API Surface
- Accounts endpoints (`/api/accounts/`, `/api/accounts/<id>/`, `/api/accounts/masters/`) are documented in `docs/api_accounts.md` with payload schemas and session guidelines.
- Session auth endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/csrf`) are function-based views under `users/views.py`.
- Additional app APIs will follow the same function-view pattern: small view functions orchestrating serializer validation plus explicit response payloads.

## Testing
- Unit and integration tests live under `tests/` and app-specific `tests.py` files. New features should add pytest modules mirroring the HTTP flows they exercise.
- Run `make coverage` to produce reports; `make coverage-html` generates `htmlcov/index.html` for local inspection.
- Keep fixtures isolated to the specific apps whenever possible; use factory helpers to seed multi-tenant data for clarity.

## Documentation Index
- `README.md`: overview, setup, and workflow (this document).
- `QUICK_START.md`: rapid-fire instructions for new developers.
- `MIGRATION_SUMMARY.md`: context on the move from the JSC template to the Django stack.
- `docs/architecture.md`: detailed module breakdown and request flow.
- `docs/api_accounts.md`: Accounts API contract for the Next.js frontend.
- `CONTRIBUTING.md`: branching, testing, and pull-request expectations for the team.

## Contributing
- Internal contributors should review `CONTRIBUTING.md` for branching, coding standards, and pull-request expectations.
- Always accompany feature work with tests and, when relevant, documentation updates.

## License
Proprietary – Nitip Shah Jewels. Redistribution requires explicit approval from project stakeholders.
