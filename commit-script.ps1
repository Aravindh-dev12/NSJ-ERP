
$dates = @(
    "2026-03-10T10:00:00",
    "2026-03-22T14:30:00",
    "2026-04-01T11:00:00",
    "2026-04-17T16:00:00",
    "2026-04-30T09:00:00",
    "2026-05-02T13:00:00",
    "2026-05-07T15:00:00",
    "2026-05-16T10:30:00",
    "2026-05-22T17:00:00",
    "2026-06-01T12:00:00",
    "2026-06-12T14:00:00",
    "2026-06-18T11:30:00"
)

$messages = @(
    "Initial project setup",
    "Backend configuration and dependencies",
    "Backend core modules and settings",
    "Accounts and users modules",
    "Products and rates modules",
    "Vouchers and sales queries modules",
    "Tasks and reports modules",
    "Backend tests and documentation",
    "Frontend setup and configuration",
    "Frontend app pages and components",
    "Frontend hooks, lib, and styles",
    "Frontend tests and final polish"
)

$paths = @(
    "NSJ-ERP-main/.gitignore NSJ-ERP-main/README.md",
    "NSJ-ERP-main/nsj-backend/manage.py NSJ-ERP-main/nsj-backend/requirements.txt NSJ-ERP-main/nsj-backend/pyproject.toml NSJ-ERP-main/nsj-backend/pytest.ini NSJ-ERP-main/nsj-backend/uv.lock NSJ-ERP-main/nsj-backend/.gitignore NSJ-ERP-main/nsj-backend/Dockerfile NSJ-ERP-main/nsj-backend/Dockerfile.railway NSJ-ERP-main/nsj-backend/Dockerfile.simple NSJ-ERP-main/nsj-backend/gunicorn_config.py NSJ-ERP-main/nsj-backend/railway.toml NSJ-ERP-main/nsj-backend/Makefile NSJ-ERP-main/nsj-backend/start.sh NSJ-ERP-main/nsj-backend/start_server.bat NSJ-ERP-main/nsj-backend/start_tally_mock.bat NSJ-ERP-main/nsj-backend/.dockerignore NSJ-ERP-main/nsj-backend/.pre-commit-config.yaml NSJ-ERP-main/nsj-backend/CONTRIBUTING.md NSJ-ERP-main/nsj-backend/QUICK_START.md NSJ-ERP-main/nsj-backend/README.md NSJ-ERP-main/nsj-backend/README_TALLY_MOCK.md NSJ-ERP-main/nsj-backend/START_HERE.md NSJ-ERP-main/nsj-backend/VISUAL_GUIDE.md NSJ-ERP-main/nsj-backend/design.md",
    "NSJ-ERP-main/nsj-backend/nsj_backend/ NSJ-ERP-main/nsj-backend/core/",
    "NSJ-ERP-main/nsj-backend/accounts/ NSJ-ERP-main/nsj-backend/users/",
    "NSJ-ERP-main/nsj-backend/products/ NSJ-ERP-main/nsj-backend/rates/",
    "NSJ-ERP-main/nsj-backend/vouchers/ NSJ-ERP-main/nsj-backend/sales_queries/",
    "NSJ-ERP-main/nsj-backend/tasks/ NSJ-ERP-main/nsj-backend/reports/",
    "NSJ-ERP-main/nsj-backend/tests/ NSJ-ERP-main/nsj-backend/docs/ NSJ-ERP-main/nsj-backend/issues/ NSJ-ERP-main/nsj-backend/.github/",
    "NSJ-ERP-main/nsj-frontend/package.json NSJ-ERP-main/nsj-frontend/pnpm-lock.yaml NSJ-ERP-main/nsj-frontend/next.config.mjs NSJ-ERP-main/nsj-frontend/tsconfig.json NSJ-ERP-main/nsj-frontend/tailwind.config.ts NSJ-ERP-main/nsj-frontend/postcss.config.js NSJ-ERP-main/nsj-frontend/components.json NSJ-ERP-main/nsj-frontend/.eslintrc.json NSJ-ERP-main/nsj-frontend/.prettierrc NSJ-ERP-main/nsj-frontend/.editorconfig NSJ-ERP-main/nsj-frontend/.nvmrc NSJ-ERP-main/nsj-frontend/.gitignore NSJ-ERP-main/nsj-frontend/.dockerignore NSJ-ERP-main/nsj-frontend/.lintstagedrc.json NSJ-ERP-main/nsj-frontend/commitlint.config.cjs NSJ-ERP-main/nsj-frontend/Dockerfile NSJ-ERP-main/nsj-frontend/railway.toml NSJ-ERP-main/nsj-frontend/README.md NSJ-ERP-main/nsj-frontend/ONBOARDING.md NSJ-ERP-main/nsj-frontend/logo.png NSJ-ERP-main/nsj-frontend/.env.example NSJ-ERP-main/nsj-frontend/n2words.d.ts NSJ-ERP-main/nsj-frontend/playwright.config.ts NSJ-ERP-main/nsj-frontend/vitest.config.mjs NSJ-ERP-main/nsj-frontend/.husky/ NSJ-ERP-main/nsj-frontend/.github/ NSJ-ERP-main/nsj-frontend/public/ NSJ-ERP-main/nsj-frontend/styles/",
    "NSJ-ERP-main/nsj-frontend/app/ NSJ-ERP-main/nsj-frontend/components/",
    "NSJ-ERP-main/nsj-frontend/hooks/ NSJ-ERP-main/nsj-frontend/lib/ NSJ-ERP-main/nsj-frontend/types/ NSJ-ERP-main/nsj-frontend/docs/ NSJ-ERP-main/nsj-frontend/e2e/",
    "NSJ-ERP-main/nsj-frontend/tests/ NSJ-ERP-main/nsj-frontend/test-output.txt NSJ-ERP-main/nsj-frontend/test-results.txt NSJ-ERP-main/nsj-frontend/Add_New_Account_2025-11-24.xlsx NSJ-ERP-main/nsj-frontend/Add_New_Account_2025-11-25.xlsx NSJ-ERP-main/nsj-frontend/Add_New_Account_2025-12-26.xlsx"
)

for ($i = 0; $i -lt $dates.Length; $i++) {
    Write-Host "=== Commit $($i+1): $($messages[$i]) - $($dates[$i]) ==="
    git add $paths[$i].Split(" ")
    $env:GIT_AUTHOR_DATE = $dates[$i]
    $env:GIT_COMMITTER_DATE = $dates[$i]
    git commit -m $messages[$i]
    Remove-Item Env:\GIT_AUTHOR_DATE
    Remove-Item Env:\GIT_COMMITTER_DATE
}

Write-Host "=== Adding any remaining files ==="
git add -A
$env:GIT_AUTHOR_DATE = $dates[-1]
$env:GIT_COMMITTER_DATE = $dates[-1]
git commit --allow-empty -m "Final polish" 2>$null
Remove-Item Env:\GIT_AUTHOR_DATE
Remove-Item Env:\GIT_COMMITTER_DATE

Write-Host "=== Done! Commit history: ==="
git log --format="Date: %ad | Author: %an <%ae> | Message: %s" --date=iso
