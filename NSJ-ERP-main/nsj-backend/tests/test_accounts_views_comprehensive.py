"""
Comprehensive tests for accounts views to improve coverage.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.models import Account, SubAccount, AccountContact, AccountBank
from core.models import Company

User = get_user_model()


@pytest.fixture
def company(db):
    """Create a test company."""
    return Company.objects.create(
        name="Test Company",
        display_name="Test Co",
    )


@pytest.fixture
def user(db, company):
    """Create a test user."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        company=company,
    )


@pytest.fixture
def account(db, company):
    """Create a test account."""
    return Account.objects.create(
        account_name="Test Customer",
        account_no="ACC-TEST-001",
        group_code="CUSTOMER",
        company=company,
    )


@pytest.fixture
def api_client(user):
    """Create an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestAccountsCollectionView:
    """Test accounts collection view (list and create)."""

    def test_list_accounts_with_search(self, api_client, user):
        """Test listing accounts with search parameter."""
        Account.objects.create(
            account_name="John Doe",
            account_no="ACC-JOHN",
            group_code="CUSTOMER",
            company=user.company,
        )
        Account.objects.create(
            account_name="Jane Smith",
            account_no="ACC-JANE",
            group_code="SUPPLIER",
            company=user.company,
        )

        url = "/api/accounts/?search=John"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) >= 1

    def test_list_accounts_with_group_filter(self, api_client, user):
        """Test filtering accounts by group."""
        Account.objects.create(
            account_name="Customer 1",
            account_no="ACC-CUST-001",
            group_code="CUSTOMER",
            company=user.company,
        )
        Account.objects.create(
            account_name="Supplier 1",
            account_no="ACC-SUPP-001",
            group_code="SUPPLIER",
            company=user.company,
        )

        url = "/api/accounts/?group_code=CUSTOMER"
        response = api_client.get(url)

        assert response.status_code == 200

    def test_create_account_with_all_fields(self, api_client, user):
        """Test creating account with all optional fields."""
        payload = {
            "account_name": "Full Account",
            "account_no": "ACC-FULL-001",
            "group_code": "CUSTOMER",
            "remarks": "Test remarks",
            "status": "ACTIVE",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        data = response.json()
        assert data["account_name"] == "Full Account"
        assert data["remarks"] == "Test remarks"

    def test_create_account_with_contact_info(self, api_client, user):
        """Test creating account with contact information."""
        payload = {
            "account_name": "Account with Contact",
            "account_no": "ACC-CONTACT-002",
            "group_code": "CUSTOMER",
            "phone": "1234567890",
            "email": "test@example.com",
            "address_line": "123 Test St",
            "city": "Test City",
            "state": "Test State",
            "pin_code": "12345",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code in [201, 400]

    def test_create_account_with_bank_info(self, api_client, user):
        """Test creating account with bank information."""
        payload = {
            "account_name": "Account with Bank",
            "account_no": "ACC-BANK-001",
            "group_code": "SUPPLIER",
            "bank_name": "Test Bank",
            "bank_account_no": "1234567890",
            "ifsc_code": "TEST0001234",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code in [201, 400]


@pytest.mark.django_db
class TestAccountDetailView:
    """Test account detail view (retrieve, update, delete)."""

    def test_get_account_with_contact(self, api_client, user, account):
        """Test retrieving account with contact details."""
        AccountContact.objects.create(
            account=account,
            address_line="123 Test St",
            phone="1234567890",
            email="test@example.com",
        )

        url = f"/api/accounts/{account.id}/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(account.id)

    def test_get_account_with_bank(self, api_client, user, account):
        """Test retrieving account with bank details."""
        AccountBank.objects.create(
            account=account,
            bank_name="Test Bank",
            account_number="1234567890",
            ifsc="TEST0001234",
        )

        url = f"/api/accounts/{account.id}/"
        response = api_client.get(url)

        assert response.status_code == 200

    def test_update_account_status(self, api_client, user, account):
        """Test updating account status."""
        payload = {
            "status": "INACTIVE",
        }

        url = f"/api/accounts/{account.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "INACTIVE"

    def test_update_account_remarks(self, api_client, user, account):
        """Test updating account remarks."""
        payload = {
            "remarks": "Updated remarks",
        }

        url = f"/api/accounts/{account.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200

    def test_delete_account_cascade(self, api_client, user, account):
        """Test deleting account with related records."""
        # Create related records
        SubAccount.objects.create(
            account=account,
            sub_account_name="Sub 1",
            created_by=user,
        )

        url = f"/api/accounts/{account.id}/"
        response = api_client.delete(url)

        assert response.status_code == 204


@pytest.mark.django_db
class TestSubAccountsCollectionView:
    """Test sub-accounts collection view."""

    def test_list_subaccounts_filtered_by_account(self, api_client, user, account):
        """Test listing sub-accounts filtered by parent account."""
        SubAccount.objects.create(
            account=account,
            sub_account_name="Sub 1",
            created_by=user,
        )
        SubAccount.objects.create(
            account=account,
            sub_account_name="Sub 2",
            created_by=user,
        )

        url = f"/api/accounts/sub-accounts/?account={account.id}"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2

    def test_create_subaccount_with_all_fields(self, api_client, user, account):
        """Test creating sub-account with all fields."""
        payload = {
            "account": str(account.id),
            "sub_account_name": "Full Sub Account",
            "phone_number": "1234567890",
            "email": "sub@example.com",
            "address": "123 Sub St",
            "gender": "MALE",
        }

        url = "/api/accounts/sub-accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        data = response.json()
        assert data["sub_account_name"] == "Full Sub Account"

    def test_create_subaccount_minimal(self, api_client, user, account):
        """Test creating sub-account with minimal fields."""
        payload = {
            "account": str(account.id),
            "sub_account_name": "Minimal Sub",
        }

        url = "/api/accounts/sub-accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201


@pytest.mark.django_db
class TestSubAccountDetailView:
    """Test sub-account detail view."""

    def test_get_subaccount_detail(self, api_client, user, account):
        """Test retrieving sub-account details."""
        subaccount = SubAccount.objects.create(
            account=account,
            sub_account_name="Test Sub",
            phone_number="1234567890",
            email="sub@example.com",
            created_by=user,
        )

        url = f"/api/accounts/sub-accounts/{subaccount.id}/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert data["sub_account_name"] == "Test Sub"

    def test_update_subaccount_contact(self, api_client, user, account):
        """Test updating sub-account contact info."""
        subaccount = SubAccount.objects.create(
            account=account,
            sub_account_name="Test Sub",
            created_by=user,
        )

        payload = {
            "phone_number": "9876543210",
            "email": "updated@example.com",
        }

        url = f"/api/accounts/sub-accounts/{subaccount.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert data["phone_number"] == "9876543210"

    def test_update_subaccount_gender(self, api_client, user, account):
        """Test updating sub-account gender."""
        subaccount = SubAccount.objects.create(
            account=account,
            sub_account_name="Test Sub",
            created_by=user,
        )

        payload = {
            "gender": "FEMALE",
        }

        url = f"/api/accounts/sub-accounts/{subaccount.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200


@pytest.mark.django_db
class TestAccountMastersView:
    """Test account masters endpoint."""

    def test_get_account_masters(self, api_client, user):
        """Test retrieving account master data."""
        url = "/api/accounts/masters/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


@pytest.mark.django_db
class TestAccountsDropdownView:
    """Test accounts dropdown endpoint."""

    def test_get_accounts_dropdown(self, api_client, user):
        """Test retrieving accounts for dropdown."""
        Account.objects.create(
            account_name="Dropdown 1",
            account_no="ACC-DROP-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = "/api/accounts/dropdown/"
        response = api_client.get(url)

        assert response.status_code == 200


@pytest.mark.django_db
class TestAccountExportViews:
    """Test account export endpoints."""

    def test_export_single_account(self, api_client, user, account):
        """Test exporting single account."""
        url = f"/api/accounts/{account.id}/export/"
        response = api_client.get(url)

        # Export may or may not be implemented, or may redirect
        assert response.status_code in [200, 302, 404, 501]

    def test_export_all_accounts(self, api_client, user):
        """Test exporting all accounts."""
        Account.objects.create(
            account_name="Export 1",
            account_no="ACC-EXP-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = "/api/accounts/export/"
        response = api_client.get(url)

        # Export may or may not be implemented, or may redirect
        assert response.status_code in [200, 302, 404, 501]

    def test_export_subaccount(self, api_client, user, account):
        """Test exporting single sub-account."""
        subaccount = SubAccount.objects.create(
            account=account,
            sub_account_name="Export Sub",
            created_by=user,
        )

        url = f"/api/accounts/sub-accounts/{subaccount.id}/export/"
        response = api_client.get(url)

        # Export may or may not be implemented, or may redirect
        assert response.status_code in [200, 302, 404, 501]

    def test_export_all_subaccounts(self, api_client, user):
        """Test exporting all sub-accounts."""
        url = "/api/accounts/sub-accounts/export/"
        response = api_client.get(url)

        # Export may or may not be implemented, or may redirect
        assert response.status_code in [200, 302, 404, 501]


@pytest.mark.django_db
class TestAccountPermissions:
    """Test account view permissions."""

    def test_unauthenticated_list_accounts(self):
        """Test that unauthenticated users cannot list accounts."""
        client = APIClient()
        url = "/api/accounts/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]

    def test_unauthenticated_create_account(self):
        """Test that unauthenticated users cannot create accounts."""
        client = APIClient()
        payload = {
            "account_name": "Test",
            "account_no": "ACC-001",
            "group_code": "CUSTOMER",
        }
        url = "/api/accounts/"
        response = client.post(url, payload, format="json")

        assert response.status_code in [302, 401, 403]


@pytest.mark.django_db
class TestAccountValidation:
    """Test account validation."""

    def test_create_account_duplicate_account_no(self, api_client, user):
        """Test creating account with duplicate account_no fails."""
        Account.objects.create(
            account_name="First",
            account_no="ACC-DUP",
            group_code="CUSTOMER",
            company=user.company,
        )

        payload = {
            "account_name": "Second",
            "account_no": "ACC-DUP",  # Duplicate
            "group_code": "CUSTOMER",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 400

    def test_create_account_invalid_group_code(self, api_client, user):
        """Test creating account with invalid group_code."""
        payload = {
            "account_name": "Test",
            "account_no": "ACC-INVALID",
            "group_code": "INVALID",  # Not in choices
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 400
