import json
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Company
from users.models import User
from accounts.models import Account
from vouchers.models import Order, Archives, PaymentEntry, JournalEntry


@pytest.fixture
def company_user_client():
    company = Company.objects.create(name="BulkCo", display_name="BulkCo")
    user = User.objects.create_user(
        email="bulk@example.com",
        username="bulker",
        password="pass123",
        name="Bulk User",
        company=company,
    )
    client = APIClient()
    client.force_login(user)
    return company, user, client


@pytest.mark.django_db
def test_archives_detail_delete_and_export(company_user_client):
    company, user, client = company_user_client
    # create an archive record
    archive = Archives.objects.create(
        company=company, created_by=user, item_name="ToDelete", advance_payment_received="NO"
    )

    # GET detail
    resp = client.get(reverse("vouchers-archives-detail", kwargs={"pk": archive.id}))
    assert resp.status_code == 200
    assert resp.json().get("item_name") == "ToDelete"

    # Export -> should return an excel payload (content-type may vary); ensure 200
    resp2 = client.get(reverse("vouchers-archives-export", kwargs={"pk": archive.id}))
    assert resp2.status_code == 200
    disp = (
        resp2.get("Content-Disposition") or resp2.headers.get("Content-Disposition")
        if hasattr(resp2, "headers")
        else None
    )
    # filename should contain .xlsx or be present
    assert disp is None or ".xlsx" in disp

    # DELETE
    resp3 = client.delete(reverse("vouchers-archives-detail", kwargs={"pk": archive.id}))
    assert resp3.status_code == 204


PAYLOADS_PAYMENT = [
    {"type": "Cr", "dr": 0, "cr": 100.0, "narration": "Test pay 1"},
    {"type": "Dr", "dr": 50.0, "cr": 0, "narration": "Test pay 2"},
    {"type": "Cr", "dr": 0, "cr": 123.45, "narration": "Payment with total", "total": 123.45},
]


@pytest.mark.django_db
@pytest.mark.parametrize("payload", PAYLOADS_PAYMENT)
def test_payment_create_and_detail_variants(company_user_client, payload):
    company, user, client = company_user_client
    # ensure an account exists
    acct = Account.objects.create(company=company, account_name="AcctPay")
    payload_copy = dict(payload)
    payload_copy["account_id"] = str(acct.id)

    resp = client.post(
        reverse("payment-list"), data=json.dumps(payload_copy), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    created_id = data.get("id") or data.get("result", {}).get("id")
    assert created_id

    # detail
    resp2 = client.get(reverse("payment-detail", kwargs={"pk": created_id}))
    assert resp2.status_code == 200


PAYLOADS_JOURNAL = [
    {"type": "Cr", "dr": 0, "cr": 200.0, "narration": "Journal 1"},
    {"type": "Dr", "dr": 10.0, "cr": 0, "narration": "Journal 2"},
]


@pytest.mark.django_db
@pytest.mark.parametrize("payload", PAYLOADS_JOURNAL)
def test_journal_create_and_detail_variants(company_user_client, payload):
    company, user, client = company_user_client
    acct = Account.objects.create(company=company, account_name="AcctJournal")
    payload_copy = dict(payload)
    payload_copy["account_id"] = str(acct.id)

    resp = client.post(
        reverse("journal-list"), data=json.dumps(payload_copy), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    created_id = data.get("id") or data.get("result", {}).get("id")
    assert created_id

    resp2 = client.get(reverse("journal-detail", kwargs={"pk": created_id}))
    assert resp2.status_code == 200


@pytest.mark.django_db
def test_payment_and_journal_aggregates(company_user_client):
    company, user, client = company_user_client
    acct = Account.objects.create(company=company, account_name="AggAcct")
    # create payments and journals
    PaymentEntry.objects.create(company=company, created_by=user, account=acct, dr=10, cr=0)
    PaymentEntry.objects.create(company=company, created_by=user, account=acct, dr=0, cr=40)
    JournalEntry.objects.create(company=company, created_by=user, account=acct, dr=5, cr=0)

    resp = client.get(reverse("payment-aggregates"))
    assert resp.status_code == 200
    data = resp.json()
    assert "sum_dr" in data and "sum_cr" in data

    resp2 = client.get(reverse("journal-aggregates"))
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert "sum_dr" in data2 and "sum_cr" in data2


SALE_PAYLOADS = [
    {"item_name": "S1", "rate": 100.0, "order_no": "O1"},
    {"item_name": "S2", "rate": 200.0, "order_no": "O2"},
    {"item_name": "S3", "rate": 300.0, "order_no": "O3"},
]


@pytest.mark.django_db
@pytest.mark.parametrize("payload", SALE_PAYLOADS)
def test_sales_create_variants(company_user_client, payload):
    company, user, client = company_user_client
    payload_copy = dict(payload)
    resp = client.post(
        reverse("sales-list"), data=json.dumps(payload_copy), content_type="application/json"
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("order_no") or data.get("id")


@pytest.mark.django_db
def test_vouchers_list_and_search_pagination(company_user_client):
    company, user, client = company_user_client
    # create multiple orders
    for i in range(15):
        Order.objects.create(company=company, created_by=user, item_name=f"Item{i}")

    resp = client.get(reverse("vouchers-list") + "?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("results") and len(data.get("results")) <= 10

    # search
    some = Order.objects.first()
    resp2 = client.get(reverse("vouchers-list") + f"?search={some.item_name}")
    assert resp2.status_code == 200
