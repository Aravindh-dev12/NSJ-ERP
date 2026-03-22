# NSJ Backend – Quick Start

Fast-track guide for spinning up the Nitip Shah Jewels backend on a new machine.

## Before You Start
- Install Python 3.11+
- Install [uv](https://github.com/astral-sh/uv) 0.8.0+
- Ensure `make` is available (Xcode command-line tools on macOS)
- Confirm SQLite is present (ships with macOS). PostgreSQL installs are optional for local use.

## Kick-off Checklist
```bash
git clone <repo-url>
cd nsj-backend
make install         # bootstrap .venv and sync deps
make migrate         # apply database migrations
make runserver       # start http://localhost:8000
```

Use `make createsuperuser` if you need an admin login for the Django admin UI. The automation scripts run everything through `uv`, so there’s no need to activate `.venv` manually unless you prefer it.

## Smoke Tests
- `make test` executes the pytest suite covering Accounts CRUD and master-list endpoints.
- `python test_setup.py` (via `uv run python test_setup.py`) seeds baseline admin data for exploratory work.

## Session Auth Basics
- Issue `GET /api/auth/csrf` to prime the CSRF cookie before any state-changing requests.
- Use `POST /api/auth/login` with email + password to receive the `sessionid` cookie.
- Send `credentials: 'include'` from the frontend so the browser forwards cookies to Django.
- `POST /api/auth/logout` clears the session; `POST /api/auth/refresh` rehydrates on page load.

## Helpful Admin Checks
- Core masters: add a Branch, Country, State, and City.
- Accounts: create a customer and verify nested contact/bank/tax/opening balance forms persist correctly.
- Rates: add a daily metal rate to ensure the admin configuration is intact.

## Toolbelt Reference
- `make help` prints all supported automation tasks.
- `make check` runs formatting checks plus coverage, mirroring CI expectations.
- `uv add <pkg>` / `uv add --group dev <pkg>` manage dependencies; always commit `pyproject.toml` and `uv.lock` after changes.

## Where to Next
- Deep-dive documentation starts in `README.md` and `docs/architecture.md`.
- API payloads for the frontend live in `docs/api_accounts.md`.
- Contribution standards, including pull-request checklists, are in `CONTRIBUTING.md`.
