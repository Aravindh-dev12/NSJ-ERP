# Contributing Guide

This guide explains how internal contributors can collaborate on the NSJ backend. It covers tooling, coding standards, and review expectations.

## Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) 0.8.0 or newer
- `make`
- Access to the private repository and issue tracker

## Environment Setup
1. Clone the repository and move into the project directory: `git clone <repo-url> && cd nsj-backend`.
2. Run `make install` to bootstrap the `.venv` and install all dependencies (runtime + dev).
3. Apply migrations against SQLite with `make migrate`. Switch to PostgreSQL locally if you need to mirror production; update `DATABASES` in `nsj_backend/settings.py` or provide environment variables.
4. (Optional) Create a superuser for admin access via `make createsuperuser`.

## Branching & Commits
- Follow the pattern `feature/<slug>`, `fix/<slug>`, or `chore/<slug>` for branch names.
- Keep commits focused and descriptive. Favour present-tense subjects (e.g., “Add master data endpoint”).
- Rebase frequently to keep branches up to date with the mainline.

## Coding Standards
- Write Python 3.11+ code. Prefer type hints where they aid readability.
- Use function-based views for new HTTP endpoints. Leverage DRF serializers for validation to maintain consistency with existing patterns.
- Keep multi-tenant awareness front of mind: filter queries by `request.user.company` or the company derived from the session.
- Add concise comments only when logic is non-obvious. Avoid restating the code.
- When introducing new dependencies, run `uv add` (optionally `--group dev`) and commit the updated `pyproject.toml`, `uv.lock`, and regenerated `requirements.txt`.

## Testing & Quality
- Run `make test` before pushing. Add pytest coverage for new features or bug fixes.
- Execute `make check` (format check + coverage) prior to opening a pull request.
- Maintain or improve coverage. Use factories/fixtures in `tests/` to keep test data isolated and readable.
- Install the pre-commit hook (`uv run pre-commit install`) so format and pytest checks run on each commit.

## Documentation Expectations
- Update `README.md`, `docs/architecture.md`, or create new domain-specific docs when behaviour changes.
- Extend `docs/api_<domain>.md` when exposing new endpoints. Include request/response examples and authentication details.
- Note any manual operations (data migrations, backfills) in the relevant doc or migration comments.

## Pull Request Checklist
- [ ] Branch is rebased on the latest `project/initialization` (or target branch).
- [ ] `make check` passes locally.
- [ ] Tests cover the change and demonstrate the expected behaviour.
- [ ] Documentation updates accompany user-facing changes.
- [ ] Screenshots or curl snippets attached when API responses changed.

## Code Review Guidelines
- Be clear about risk areas (auth, multi-tenancy, data migrations).
- Request changes for failing tests, missing coverage, or undocumented behaviour.
- Approve only when the branch is green and documentation is in place.

## Release Notes
- Summaries of finished work should highlight user-facing changes, migrations, and deployment steps.
- Record noteworthy alterations in a shared changelog if a running list is maintained externally.

## Support
For access issues or urgent production fixes, contact the lead maintainer or raise the priority in the issue tracker. For general questions, use the shared engineering channel.
