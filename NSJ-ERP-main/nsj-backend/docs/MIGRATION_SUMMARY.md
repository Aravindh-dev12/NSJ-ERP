# NSJ Backend – Migration Summary

## Overview
Nitip Shah Jewels (NSJ) migrated from the Jay Scientific Co. (JSC) FastAPI template to a Django-based stack to align with the organisation’s skill set, session-authenticated requirements, and rapid admin tooling goals. This document captures the deltas, completed milestones, and remaining follow-up work.

## Legacy vs Current Architecture
- **JSC (legacy)**: FastAPI + SQLModel, token-auth APIs, task-specific micro-services.
- **NSJ (current)**: Django 5 with Django REST Framework serializers, cookie-based session auth, consolidated monolith.
- **Rationale**: built-in admin, first-class ORM migrations, easier reuse of existing Django expertise, and closer alignment with session-secured ERP access.

## Domain Coverage
- **Core**: Company, Branch, Country/State/City, and Location masters to support multi-tenancy.
- **Users**: Custom UUID user model with `SUPER_ADMIN`, `ADMIN`, and `EMPLOYEE` roles; login/logout/refresh endpoints implemented as JSON views.
- **Accounts**: Party master with nested Contact, Bank, Tax, and Opening Balance records; CRUD endpoints and master lookups shipped.
- **Products**: Product catalogue retained from the template for future API exposure.
- **Rates**: Daily metal rates and party overrides ready at the model/admin layer.

## Application Shape
- Function-based views coordinate request parsing, payload normalisation, serializer validation, and JSON responses.
- DRF serializers still power validation and nested writes, letting us reuse declarative field rules while avoiding viewsets.
- Session cookies (30-day, sliding) and CSRF cookies secure state-changing operations; CORS is limited to localhost origins in development.
- uv manages the virtual environment, making dependency pinning deterministic via `pyproject.toml` and `uv.lock`.

## Completed Milestones
- Ported schema and admin customisations from the JSC template to Django apps (`core`, `users`, `accounts`, `products`, `rates`).
- Replaced DRF viewsets with plain Django views responding with explicit JSON payloads.
- Implemented Accounts CRUD including alias-aware payload normalisation and master-data hydration.
- Delivered `/api/accounts/masters/` endpoint aggregating branches, locations, and geographic masters with optional filters.
- Authored pytest coverage for Accounts flows (list, create, update, delete, masters) and wired tests into Makefile automation.
- Produced frontend-ready API documentation (`docs/api_accounts.md`).

## Outstanding Items
- Expose similar JSON endpoints for Products and Rates once frontend requirements are defined.
- Harden production settings: switch to PostgreSQL, enable secure cookies, and configure logging.
- Enrich audit trails (created_by/updated_by population) and add API-level permission checks beyond company scoping.
- Automate fixture seeding or factories for non-Accounts domains to support test coverage expansion.

## Tooling & Workflow Changes
- Dependency management moved from `pip` requirements to uv; use `make install` / `uv sync` for repeatable environments.
- Ruff handles formatting and linting; pre-commit bundles format checks with pytest to keep branches clean.
- Tests run through pytest with coverage helpers, favouring modular fixtures in `tests/` over Django’s default test runner.

## Reference Documents
- `README.md`: current setup guidance and module overview.
- `QUICK_START.md`: first-day developer checklist.
- `docs/architecture.md`: detailed module architecture (see new document).
- `docs/api_accounts.md`: Accounts API contract for the frontend team.
