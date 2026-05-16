import json
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from accounts.models import Account, AccountBank, AccountContact, AccountOpeningBalance, AccountTax
from core.models import Branch, CityMaster, Company, CountryMaster, LocationMaster, StateMaster


@pytest.fixture
def account_dependencies():
    company = Company.objects.create(name="Company", display_name="Company")
    branch = Branch.objects.create(company=company, name="HQ", code="001")
    country = CountryMaster.objects.create(name="India", code="IN")
    state = StateMaster.objects.create(name="Gujarat", code="GJ", country=country)
    city = CityMaster.objects.create(name="Ahmedabad", code="AMD", state=state)
    location = LocationMaster.objects.create(name="Main", company=company)
    return {
        "company": company,
        "branch": branch,
        "country": country,
        "state": state,
        "city": city,
        "location": location,
    }


@pytest.fixture
def user(account_dependencies):
    company = account_dependencies["company"]
    User = get_user_model()
    return User.objects.create_user(
        email="user@example.com",
        username="user",
        password="secret123",
        name="Test User",
        company=company,
    )


@pytest.mark.django_db
def test_list_accounts_returns_nested_data(client, user, account_dependencies):
    deps = account_dependencies
    account = Account.objects.create(
        company=deps["company"],
        branch=deps["branch"],
        account_no="A-001",
        account_name="Alpha Traders",
        group_code="CUSTOMER",
        location=deps["location"],
        remarks="Preferred partner",
        status="ACTIVE",
        created_by=user,
    )
    AccountContact.objects.create(
        account=account,
        address_line="Street 1",
        city=deps["city"].name,
        state=deps["state"].name,
        country=deps["country"].name,
        phone="123456",
    )
    AccountBank.objects.create(account=account, bank_name="SBI", account_number="98765")
    AccountTax.objects.create(account=account, gstin="GST123", pan="PAN123")
    AccountOpeningBalance.objects.create(account=account, amount=1000, amount_drcr="Dr")

    client.force_login(user)
    response = client.get("/api/accounts/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    first = payload["results"][0]
    assert first["account_name"] == "Alpha Traders"
    assert first["contact"]["address_line"] == "Street 1"
    assert first["branch"]["id"] == str(deps["branch"].id)
    assert first["branch"]["name"] == deps["branch"].name
    assert first["location"]["id"] == str(deps["location"].id)
    assert first["contact"]["city"] == deps["city"].name
    assert first["contact"]["state"] == deps["state"].name
    assert first["contact"]["country"] == deps["country"].name
    assert first["bank"]["bank_name"] == "SBI"
    assert first["tax"]["gstin"] == "GST123"
    assert first["opening_balance"]["amount"] == "1000.00"


@pytest.mark.django_db
def test_create_account_with_nested_payload(client, user, account_dependencies):
    deps = account_dependencies
    client.force_login(user)

    payload = {
        "account_no": "A-002",
        "account_name": "Beta Supplies",
        "group_code": "SUPPLIER",
        "branch": {"id": str(deps["branch"].id)},
        "locationId": str(deps["location"].id),
        "status": "ACTIVE",
        "remarks": "New supplier",
        "contact": {
            "address_line": "Road 2",
            "city": deps["city"].name,
            "state": deps["state"].name,
            "country": deps["country"].name,
            "phone": "789012",
            "email": "contact@beta.com",
        },
        "bank": {
            "bank_name": "HDFC",
            "account_number": "111222333",
            "ifsc": "HDFC0001",
        },
        "tax": {
            "gstin": "GST456",
            "pan": "PAN456",
        },
        "opening_balance": {
            "amount": "500.00",
            "amount_drcr": "Cr",
        },
    }

    response = client.post(
        "/api/accounts/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 201
    created = response.json()
    assert created["account_name"] == "Beta Supplies"
    assert created["contact"]["phone"] == "789012"
    assert created["branch"]["id"] == str(deps["branch"].id)
    assert created["location"]["id"] == str(deps["location"].id)
    assert created["contact"]["city"] == deps["city"].name
    assert created["contact"]["state"] == deps["state"].name
    assert created["contact"]["country"] == deps["country"].name
    assert created["bank"]["bank_name"] == "HDFC"
    assert created["tax"]["gstin"] == "GST456"

    account = Account.objects.get(account_no="A-002")
    assert account.company == user.company
    assert account.created_by == user

    assert AccountContact.objects.filter(account=account, phone="789012").exists()
    assert AccountBank.objects.filter(account=account, bank_name="HDFC").exists()
    assert AccountTax.objects.filter(account=account, gstin="GST456").exists()
    assert AccountOpeningBalance.objects.filter(account=account, amount=Decimal("500.00")).exists()


@pytest.mark.django_db
def test_update_account_nested_records(client, user, account_dependencies):
    deps = account_dependencies
    account = Account.objects.create(
        company=deps["company"],
        branch=deps["branch"],
        account_no="A-003",
        account_name="Gamma Corp",
        group_code="CUSTOMER",
        location=deps["location"],
        status="ACTIVE",
        created_by=user,
    )
    AccountContact.objects.create(account=account, address_line="Initial")
    AccountBank.objects.create(account=account, bank_name="Axis")
    AccountTax.objects.create(account=account, gstin="GST789")
    AccountOpeningBalance.objects.create(account=account, amount=0)

    client.force_login(user)

    payload = {
        "account_name": "Gamma Corporation",
        "contact": {"address_line": "Updated Street", "phone": "555666"},
        "bank": {"bank_name": "ICICI", "account_number": "999888"},
        "tax": {"gstin": "GST999", "pan": "PAN999"},
        "opening_balance": {"amount": "750.00", "amount_drcr": "Dr"},
    }

    response = client.patch(
        f"/api/accounts/{account.id}/",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 200
    account.refresh_from_db()
    assert account.account_name == "Gamma Corporation"
    assert account.contact.phone == "555666"
    assert account.bank.bank_name == "ICICI"
    assert account.tax.gstin == "GST999"
    assert str(account.opening_balance.amount) == "750.00"


@pytest.mark.django_db
def test_delete_account_cascades_related(client, user, account_dependencies):
    deps = account_dependencies
    account = Account.objects.create(
        company=deps["company"],
        branch=deps["branch"],
        account_no="A-004",
        account_name="Delta Logistics",
        group_code="SUPPLIER",
        location=deps["location"],
        status="ACTIVE",
        created_by=user,
    )
    AccountContact.objects.create(account=account, address_line="To Remove")

    client.force_login(user)
    response = client.delete(f"/api/accounts/{account.id}/")

    assert response.status_code == 204
    assert not Account.objects.filter(id=account.id).exists()
    assert not AccountContact.objects.filter(account=account).exists()


@pytest.mark.django_db
def test_account_master_lists(client, user, account_dependencies):
    deps = account_dependencies
    other_state = StateMaster.objects.create(
        name="Maharashtra",
        code="MH",
        country=deps["country"],
    )
    CityMaster.objects.create(name="Mumbai", code="BOM", state=other_state)

    client.force_login(user)

    response = client.get("/api/accounts/masters/")
    assert response.status_code == 200
    payload = response.json()

    branch_ids = {item["id"] for item in payload["branches"]}
    assert str(deps["branch"].id) in branch_ids

    location_ids = {item["id"] for item in payload["locations"]}
    assert str(deps["location"].id) in location_ids

    state_ids = {item["id"] for item in payload["states"]}
    assert str(deps["state"].id) in state_ids
    assert str(other_state.id) in state_ids

    country_ids = {item["id"] for item in payload["countries"]}
    assert str(deps["country"].id) in country_ids

    city_ids = {item["id"] for item in payload["cities"]}
    assert str(deps["city"].id) in city_ids
    assert any(city["state_id"] == str(deps["state"].id) for city in payload["cities"])

    filtered = client.get("/api/accounts/masters/", {"state": deps["state"].id})
    assert filtered.status_code == 200
    filtered_payload = filtered.json()
    filtered_city_ids = {item["id"] for item in filtered_payload["cities"]}
    assert str(deps["city"].id) in filtered_city_ids
    assert all(city["state_id"] == str(deps["state"].id) for city in filtered_payload["cities"])
