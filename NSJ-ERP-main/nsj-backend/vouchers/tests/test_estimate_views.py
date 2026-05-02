import json
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from datetime import date

from core.models import Company
from users.models import User
from accounts.models import Account
from vouchers.models import EstimateVoucher, EstimateLineItem


@pytest.fixture
def company_user_client():
    company = Company.objects.create(name="Test Jewelry Co", display_name="Test Jewelry Co")
    user = User.objects.create_user(
        email="tester@example.com",
        username="tester",
        password="pass123",
        name="Tester",
        company=company,
    )
    client = APIClient()
    client.force_login(user)
    return company, user, client


@pytest.fixture
def test_account(company_user_client):
    company, user, client = company_user_client
    account = Account.objects.create(
        company=company,
        account_name="Test Customer",
        account_no="ACC001",
    )
    return account


@pytest.mark.django_db
def test_estimate_create_with_line_items(company_user_client, test_account):
    company, user, client = company_user_client

    payload = {
        "account_id": str(test_account.id),
        "item_name": "Diamond Ring",
        "date": "2024-01-15",
        "line_items": [
            {
                "particulars": "Diamond",
                "shape": "RD",
                "colour": "F-G",
                "clarity": "VVS",
                "pc": 1,
                "weight": 0.5,
                "unit": "CT",
                "rate": 50000.00,
                "amount": 25000.00,
                "order": 0,
            },
            {
                "particulars": "18K Gold",
                "shape": "",
                "colour": "",
                "clarity": "",
                "pc": None,
                "weight": 5.0,
                "unit": "GM",
                "rate": 5000.00,
                "amount": 25000.00,
                "order": 1,
            },
        ],
        "total_taxable_value": 50000.00,
        "gst_amount": 1500.00,
        "grand_total": 51500.00,
    }

    resp = client.post(
        reverse("estimate-list"), data=json.dumps(payload), content_type="application/json"
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data.get("item_name") == "Diamond Ring"
    assert len(data.get("line_items", [])) == 2
    assert data.get("grand_total") == "51500.00"


@pytest.mark.django_db
def test_estimate_list_get(company_user_client, test_account):
    company, user, client = company_user_client

    # Create an estimate
    estimate = EstimateVoucher.objects.create(
        company=company,
        account=test_account,
        item_name="Test Ring",
        date=date.today(),
        total_taxable_value=10000.00,
        gst_amount=300.00,
        grand_total=10300.00,
        created_by=user,
    )
    EstimateLineItem.objects.create(
        estimate=estimate,
        particulars="Gold",
        weight=5.0,
        unit="GM",
        rate=2000.00,
        amount=10000.00,
        order=0,
    )

    resp = client.get(reverse("estimate-list"))
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert data.get("count") >= 1


@pytest.mark.django_db
def test_estimate_detail_get(company_user_client, test_account):
    company, user, client = company_user_client

    estimate = EstimateVoucher.objects.create(
        company=company,
        account=test_account,
        item_name="Test Necklace",
        date=date.today(),
        total_taxable_value=20000.00,
        gst_amount=600.00,
        grand_total=20600.00,
        created_by=user,
    )
    EstimateLineItem.objects.create(
        estimate=estimate,
        particulars="Diamond",
        weight=1.0,
        unit="CT",
        rate=20000.00,
        amount=20000.00,
        order=0,
    )

    resp = client.get(reverse("estimate-detail", kwargs={"pk": estimate.id}))
    assert resp.status_code == 200
    payload = resp.json()
    assert payload.get("item_name") == "Test Necklace"
    assert len(payload.get("line_items", [])) == 1


@pytest.mark.django_db
def test_estimate_update(company_user_client, test_account):
    company, user, client = company_user_client

    estimate = EstimateVoucher.objects.create(
        company=company,
        account=test_account,
        item_name="Original Item",
        date=date.today(),
        total_taxable_value=10000.00,
        gst_amount=300.00,
        grand_total=10300.00,
        created_by=user,
    )
    EstimateLineItem.objects.create(
        estimate=estimate,
        particulars="Gold",
        weight=5.0,
        unit="GM",
        rate=2000.00,
        amount=10000.00,
        order=0,
    )

    update_payload = {
        "item_name": "Updated Item",
        "line_items": [
            {
                "particulars": "Gold",
                "weight": 6.0,
                "unit": "GM",
                "rate": 2000.00,
                "amount": 12000.00,
                "order": 0,
            }
        ],
        "total_taxable_value": 12000.00,
        "gst_amount": 360.00,
        "grand_total": 12360.00,
    }

    resp = client.patch(
        reverse("estimate-detail", kwargs={"pk": estimate.id}),
        data=json.dumps(update_payload),
        content_type="application/json",
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data.get("item_name") == "Updated Item"
    assert data.get("grand_total") == "12360.00"


@pytest.mark.django_db
def test_estimate_delete(company_user_client, test_account):
    company, user, client = company_user_client

    estimate = EstimateVoucher.objects.create(
        company=company,
        account=test_account,
        item_name="To Delete",
        date=date.today(),
        total_taxable_value=5000.00,
        gst_amount=150.00,
        grand_total=5150.00,
        created_by=user,
    )

    resp = client.delete(reverse("estimate-detail", kwargs={"pk": estimate.id}))
    assert resp.status_code == 204

    # Verify it's deleted
    assert not EstimateVoucher.objects.filter(id=estimate.id).exists()


@pytest.mark.django_db
def test_estimate_validation_no_line_items(company_user_client, test_account):
    company, user, client = company_user_client

    payload = {
        "account_id": str(test_account.id),
        "item_name": "Invalid Estimate",
        "date": "2024-01-15",
        "line_items": [],  # Empty line items - should fail
        "total_taxable_value": 0.00,
        "gst_amount": 0.00,
        "grand_total": 0.00,
    }

    resp = client.post(
        reverse("estimate-list"), data=json.dumps(payload), content_type="application/json"
    )

    assert resp.status_code == 400
    data = resp.json()
    assert "errors" in data
    assert "line_items" in data["errors"]


@pytest.mark.django_db
def test_estimate_validation_missing_particulars(company_user_client, test_account):
    company, user, client = company_user_client

    payload = {
        "account_id": str(test_account.id),
        "item_name": "Invalid Estimate",
        "date": "2024-01-15",
        "line_items": [
            {
                "particulars": "",  # Missing particulars with weight and rate
                "weight": 5.0,
                "unit": "GM",
                "rate": 2000.00,
                "amount": 10000.00,
                "order": 0,
            }
        ],
        "total_taxable_value": 10000.00,
        "gst_amount": 300.00,
        "grand_total": 10300.00,
    }

    resp = client.post(
        reverse("estimate-list"), data=json.dumps(payload), content_type="application/json"
    )

    assert resp.status_code == 400
    data = resp.json()
    assert "errors" in data


@pytest.mark.django_db
def test_estimate_filter_by_account(company_user_client, test_account):
    company, user, client = company_user_client

    # Create another account
    other_account = Account.objects.create(
        company=company,
        account_name="Other Customer",
        account_no="ACC002",
    )

    # Create estimates for both accounts
    EstimateVoucher.objects.create(
        company=company,
        account=test_account,
        item_name="For Test Account",
        date=date.today(),
        total_taxable_value=10000.00,
        gst_amount=300.00,
        grand_total=10300.00,
        created_by=user,
    )
    EstimateVoucher.objects.create(
        company=company,
        account=other_account,
        item_name="For Other Account",
        date=date.today(),
        total_taxable_value=20000.00,
        gst_amount=600.00,
        grand_total=20600.00,
        created_by=user,
    )

    # Filter by test_account
    resp = client.get(reverse("estimate-list"), {"account_id": str(test_account.id)})
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("count") == 1
    assert data["results"][0]["item_name"] == "For Test Account"
