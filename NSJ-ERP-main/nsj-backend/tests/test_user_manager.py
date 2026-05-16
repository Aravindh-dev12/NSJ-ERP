import pytest
from django.contrib.auth import get_user_model

from core.models import Company


@pytest.mark.django_db
def test_superuser_creation_auto_creates_company():
    assert Company.objects.count() == 0

    user = get_user_model().objects.create_superuser(
        email="auto@example.com",
        username="auto",
        password="testpass123",
        name="Auto User",
    )

    user.refresh_from_db()
    assert user.company is not None
    assert Company.objects.count() == 1
    assert Company.objects.first().name == "NSJ Main"
