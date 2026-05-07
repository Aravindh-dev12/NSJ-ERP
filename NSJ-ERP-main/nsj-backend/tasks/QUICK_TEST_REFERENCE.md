# Task Management Tests - Quick Reference

## Installation
```bash
pip install pytest pytest-django
```

## Run All Tests
```bash
cd nsj-backend/nsj-backend
pytest tasks/tests/ -v
```

## Run Specific Test Files
```bash
# Models
pytest tasks/tests/test_models.py -v

# Views/API
pytest tasks/tests/test_views.py -v

# Analytics
pytest tasks/tests/test_analytics.py -v

# NLP Queries
pytest tasks/tests/test_nlp_query.py -v

# Signals
pytest tasks/tests/test_signals.py -v
```

## Run Specific Test Class
```bash
pytest tasks/tests/test_models.py::TestTaskModel -v
pytest tasks/tests/test_views.py::TestTaskViewSet -v
pytest tasks/tests/test_analytics.py::TestTaskAnalytics -v
pytest tasks/tests/test_nlp_query.py::TestNLPQueryProcessor -v
pytest tasks/tests/test_signals.py::TestTaskSignals -v
```

## Run Specific Test
```bash
pytest tasks/tests/test_models.py::TestTaskModel::test_create_task -v
pytest tasks/tests/test_views.py::TestTaskViewSet::test_list_tasks_as_founder -v
```

## Coverage
```bash
# Generate HTML coverage report
pytest tasks/tests/ --cov=tasks --cov-report=html

# View report
open htmlcov/index.html  # Mac/Linux
start htmlcov/index.html  # Windows
```

## Useful Options
```bash
# Verbose output
pytest tasks/tests/ -vv

# Stop on first failure
pytest tasks/tests/ -x

# Run only failed tests
pytest tasks/tests/ --lf

# Show print statements
pytest tasks/tests/ -s

# Run in parallel (requires pytest-xdist)
pytest tasks/tests/ -n auto
```

## Test Count
- **test_models.py**: 14 tests
- **test_views.py**: 15 tests
- **test_analytics.py**: 13 tests
- **test_nlp_query.py**: 23 tests
- **test_signals.py**: 13 tests
- **TOTAL**: 78 tests

## Quick Test Examples

### Test a specific feature
```bash
# Test role-based access
pytest tasks/tests/test_views.py -k "role" -v

# Test NLP intent detection
pytest tasks/tests/test_nlp_query.py -k "intent" -v

# Test signals
pytest tasks/tests/test_signals.py -k "notification" -v
```

### Test with markers (if configured)
```bash
# Fast tests only
pytest tasks/tests/ -m "not slow"

# Integration tests
pytest tasks/tests/ -m "integration"
```

## Troubleshooting

### Issue: ModuleNotFoundError
```bash
# Make sure you're in the right directory
cd nsj-backend/nsj-backend

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-django
```

### Issue: Database errors
```bash
# Make sure Django settings are configured
export DJANGO_SETTINGS_MODULE=nsj_backend.settings

# Or create pytest.ini
```

### Issue: Import errors
```bash
# Add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    cd nsj-backend/nsj-backend
    pytest tasks/tests/ --cov=tasks --cov-report=xml
```

### GitLab CI
```yaml
test:
  script:
    - cd nsj-backend/nsj-backend
    - pytest tasks/tests/ --cov=tasks
```

## Documentation
- Full guide: `tasks/TESTING_GUIDE.md`
- Implementation details: `tasks/TESTING_COMPLETE.md`
