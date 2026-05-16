import json

import pytest
from django.contrib.auth import get_user_model

from core.models import Company


@pytest.mark.django_db
def test_login_and_refresh(client):
    company = Company.objects.create(name="TestCo", display_name="TestCo")
    user = get_user_model().objects.create_user(
        email="user@example.com",
        username="user",
        password="secret123",
        name="User Example",
        company=company,
    )

    response = client.post(
        "/api/auth/login",
        data=json.dumps({"email": "user@example.com", "password": "secret123"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["email"] == user.email

    refresh = client.post("/api/auth/refresh")
    assert refresh.status_code == 200
    refresh_payload = refresh.json()
    assert refresh_payload["user"]["email"] == user.email


@pytest.mark.django_db
def test_refresh_requires_authentication(client):
    response = client.post("/api/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required"


@pytest.mark.django_db
def test_login_with_username(client):
    company = Company.objects.create(name="OtherCo", display_name="OtherCo")
    user = get_user_model().objects.create_user(
        email="second@example.com",
        username="seconduser",
        password="pass456",  # nosec - test credential
        name="Second User",
        company=company,
    )

    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "seconduser", "password": "pass456"}),
        content_type="application/json",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["email"] == user.email
