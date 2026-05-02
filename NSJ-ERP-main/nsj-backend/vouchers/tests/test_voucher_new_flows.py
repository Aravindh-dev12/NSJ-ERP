import json
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Company
from users.models import User


@pytest.fixture
def company_user_client():
    company = Company.objects.create(name="TV Co", display_name="TV Co")
    user = User.objects.create_user(
        email="tester2@example.com",
        username="tester2",
        password="pass123",
        name="Tester2",
        company=company,
    )
    client = APIClient()
    client.force_login(user)
    return company, user, client


@pytest.mark.django_db
def test_receive_create_list_and_detail(company_user_client):
    company, user, client = company_user_client

    payload = {"tag_no": "R-100", "pc": 2, "net_wt": "10.00", "rate": "1000.00"}
    resp = client.post(
        reverse("receive-create"), data=json.dumps(payload), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("tag_no") == "R-100"

    # list should return the created entry
    resp2 = client.get(reverse("receive-list"))
    assert resp2.status_code == 200
    results = resp2.json().get("results", [])
    assert any(r.get("tag_no") == "R-100" for r in results)


@pytest.mark.django_db
def test_receipt_create_and_overview(company_user_client):
    company, user, client = company_user_client

    payload = {"type": "Cr", "cr": "500.00", "narration": "Test receipt"}
    resp = client.post(
        reverse("receipt-create"), data=json.dumps(payload), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    # serializer may return numeric types; ensure cr is present
    assert float(data.get("cr") or 0) == 500.0

    # overview should reflect totals
    resp2 = client.get(reverse("receipt-overview"))
    assert resp2.status_code == 200
    ov = resp2.json()
    assert ov.get("total_count") >= 1
    assert float(ov.get("total_cr") or 0) >= 500.0


@pytest.mark.django_db
def test_pur_return_create_and_overview(company_user_client):
    company, user, client = company_user_client

    payload1 = {"tag_no": "PR-1", "net_wt": "1.5", "rate": "2000"}
    payload2 = {"tag_no": "PR-2", "net_wt": "2.0", "rate": "1500"}
    r1 = client.post(
        reverse("pur-return-create"), data=json.dumps(payload1), content_type="application/json"
    )
    r2 = client.post(
        reverse("pur-return-create"), data=json.dumps(payload2), content_type="application/json"
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    resp = client.get(reverse("pur-return-overview"))
    assert resp.status_code == 200
    ov = resp.json()
    assert ov.get("total_count") >= 2


@pytest.mark.django_db
def test_sales_return_create_and_overview(company_user_client):
    company, user, client = company_user_client

    payload1 = {"tag_no": "SR-1", "net_wt": "1.0", "rate": "1000"}
    payload2 = {"tag_no": "SR-2", "net_wt": "2.0", "rate": "1200"}
    r1 = client.post(
        reverse("sales-return-create"), data=json.dumps(payload1), content_type="application/json"
    )
    r2 = client.post(
        reverse("sales-return-create"), data=json.dumps(payload2), content_type="application/json"
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    resp = client.get(reverse("sales-return-overview"))
    assert resp.status_code == 200
    ov = resp.json()
    assert ov.get("total_count") >= 2
    # total_value should be at least the two records added (1*1000 + 2*1200 = 3400)
    assert float(ov.get("total_value") or 0) >= 3400.0
