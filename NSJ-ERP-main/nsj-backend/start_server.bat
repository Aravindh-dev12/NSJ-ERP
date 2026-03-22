@echo off
echo Starting NSJ Backend Server...
echo.
uv run python manage.py runserver
pause

