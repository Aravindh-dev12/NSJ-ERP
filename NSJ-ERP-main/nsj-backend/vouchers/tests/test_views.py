import json
import uuid
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Company
from users.models import User
from vouchers.models import Order, Archives


@pytest.fixture
def company_user_client():
    company = Company.objects.create(name="TV Co", display_name="TV Co")
    user = User.objects.create_user(
        email="tester@example.com",
        username="tester",
        password="pass123",
        name="Tester",
        company=company,
    )
    client = APIClient()
    # Use force_login so Django's @login_required decorator sees an authenticated session
    client.force_login(user)
    return company, user, client


@pytest.mark.django_db
def test_vouchers_list_get_returns_existing_records(company_user_client):
    company, user, client = company_user_client
    # create a voucher/order
    order = Order.objects.create(
        company=company, created_by=user, item_name="Ring", advance_payment_received="YES"
    )

    resp = client.get(reverse("vouchers-list"))
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert any(r.get("bill_no") == order.bill_no for r in data.get("results", []))


@pytest.mark.django_db
def test_voucher_detail_get_and_404(company_user_client):
    company, user, client = company_user_client
    order = Order.objects.create(company=company, created_by=user, item_name="Necklace")

    # valid detail
    resp = client.get(reverse("voucher-detail", kwargs={"pk": order.id}))
    assert resp.status_code == 200
    payload = resp.json()
    assert payload.get("bill_no") == order.bill_no

    # invalid detail
    random_uuid = uuid.uuid4()
    resp = client.get(reverse("voucher-detail", kwargs={"pk": random_uuid}))
    assert resp.status_code == 404


@pytest.mark.django_db
def test_vouchers_create_order_and_archive(company_user_client):
    company, user, client = company_user_client

    # Create as a normal order (advance YES)
    payload = {"item_name": "Earrings", "advance_payment_received": "YES"}
    resp = client.post(
        reverse("vouchers-list"), data=json.dumps(payload), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "Order successfully created" in data.get("message", "")
    assert data.get("result") and data["result"].get("item_name") == "Earrings"

    # Create as an archived record (advance NO)
    payload2 = {"item_name": "Old Ring", "advance_payment_received": "NO"}
    resp = client.post(
        reverse("vouchers-list"), data=json.dumps(payload2), content_type="application/json"
    )
    assert resp.status_code == 201
    data2 = resp.json()
    assert "Record archived for review" in data2.get("message", "")
    assert data2.get("result") and data2["result"].get("item_name") == "Old Ring"


@pytest.mark.django_db
def test_vouchers_aggregates_view(company_user_client):
    company, user, client = company_user_client
    # create two vouchers, one with advance
    Order.objects.create(
        company=company, created_by=user, item_name="A1", advance_payment_received="YES"
    )
    Order.objects.create(
        company=company, created_by=user, item_name="A2", advance_payment_received="NO"
    )

    resp = client.get(reverse("vouchers-aggregates"))
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("total") >= 2
    assert "with_advance" in data and "recent_7_days" in data


@pytest.mark.django_db
def test_archives_list_view_requires_company_and_returns_results(company_user_client):
    company, user, client = company_user_client
    # create an archive
    Archives.objects.create(
        company=company, created_by=user, item_name="Archived Item", advance_payment_received="NO"
    )

    resp = client.get(reverse("vouchers-archives"))
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("count") >= 1
    assert any(r.get("item_name") == "Archived Item" for r in data.get("results", []))
