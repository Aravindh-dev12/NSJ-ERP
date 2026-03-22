#!/bin/bash
set -e

echo "=== NSJ Backend Starting ==="

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || echo "Static files collection skipped"

echo "Running migrations..."
python manage.py migrate --noinput
echo "Migrations complete."


(
    echo "Setting up task users..."
    python manage.py setup_task_users 2>/dev/null || echo "Users may already exist"

    echo "Creating sales user..."
    python manage.py create_sales_user 2>/dev/null || echo "Sales user may already exist"

    echo "Creating superuser..."
    python manage.py create_superuser 2>/dev/null || echo "Superuser may already exist"

    echo "Ensuring account company associations..."
    python manage.py ensure_account_companies || echo "Account company check completed"

    echo "Checking for production data file..."
    if [ -f "db_backup.json" ]; then
        echo "✓ Found db_backup.json - Loading production data..."
        python check_data_file.py || echo "Data file check failed"
        python manage.py load_production_data --file db_backup.json || echo "Data load failed or data already exists"
    else
        echo "⚠ WARNING: db_backup.json not found - skipping data load"
    fi

    echo "Background setup tasks completed."
) &

echo "Starting Gunicorn on 0.0.0.0:${PORT:-8000}..."
exec gunicorn nsj_backend.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --capture-output
