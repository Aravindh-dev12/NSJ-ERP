import pytest

from django.apps import apps


@pytest.mark.django_db
def test_django_loads_models():
    """Basic smoke test to ensure the Django app registry is available."""
    # Accessing a known model forces Django to initialize the app registry properly.
    company_model = apps.get_model("core", "Company")
    assert company_model is not None
    # Simple query to confirm the ORM is usable.
    assert company_model.objects.count() >= 0
