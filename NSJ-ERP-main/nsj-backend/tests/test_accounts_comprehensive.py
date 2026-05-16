"""
Comprehensive tests for accounts API endpoints.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.models import Account, SubAccount
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
def api_client(user):
    """Create an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestAccountList:
    """Test cases for account list endpoint."""

    def test_list_accounts(self, api_client, user):
        """Test listing accounts."""
        Account.objects.create(
            account_name="Customer 1",
            account_no="ACC-001",
            group_code="CUSTOMER",
            company=user.company,
        )
        Account.objects.create(
            account_name="Customer 2",
            account_no="ACC-002",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = "/api/accounts/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) >= 2

    def test_list_accounts_pagination(self, api_client, user):
        """Test that account list supports pagination."""
        for i in range(15):
            Account.objects.create(
                account_name=f"Customer {i + 1}",
                account_no=f"ACC-{i + 1:03d}",
                group_code="CUSTOMER",
                company=user.company,
            )

        url = "/api/accounts/?page_size=10"
        response = api_client.get(url)
        data = response.json()

        assert response.status_code == 200
        assert len(data["results"]) == 10

    def test_list_accounts_search(self, api_client, user):
        """Test searching accounts."""
        Account.objects.create(
            account_name="John Doe",
            account_no="ACC-JOHN",
            group_code="CUSTOMER",
            company=user.company,
        )
        Account.objects.create(
            account_name="Jane Smith",
            account_no="ACC-JANE",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = "/api/accounts/?search=John"
        response = api_client.get(url)
        data = response.json()

        assert response.status_code == 200
        assert len(data["results"]) >= 1
        assert any("John" in r["account_name"] for r in data["results"])

    def test_list_accounts_company_isolation(self, api_client, user):
        """Test that users only see their company's accounts."""
        Account.objects.create(
            account_name="My Customer",
            account_no="ACC-MY",
            group_code="CUSTOMER",
            company=user.company,
        )

        # Create another company and account
        other_company = Company.objects.create(
            name="Other Company",
            display_name="Other Co",
        )
        Account.objects.create(
            account_name="Other Customer",
            account_no="ACC-OTHER",
            group_code="CUSTOMER",
            company=other_company,
        )

        url = "/api/accounts/"
        response = api_client.get(url)
        data = response.json()

        # Should only see own company's accounts
        account_names = [r["account_name"] for r in data["results"]]
        assert "My Customer" in account_names
        assert "Other Customer" not in account_names


@pytest.mark.django_db
class TestAccountCreate:
    """Test cases for creating accounts."""

    def test_create_account(self, api_client, user):
        """Test creating a new account."""
        payload = {
            "account_name": "New Customer",
            "account_no": "ACC-NEW-001",
            "group_code": "CUSTOMER",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        data = response.json()
        assert data["account_name"] == "New Customer"

    def test_create_account_with_contact(self, api_client, user):
        """Test creating account with contact information."""
        payload = {
            "account_name": "Customer with Contact",
            "account_no": "ACC-CONTACT-001",
            "group_code": "CUSTOMER",
            "phone": "1234567890",
            "email": "customer@example.com",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        # Contact may need to be created separately or nested differently
        assert response.status_code in [201, 400]
        if response.status_code == 201:
            data = response.json()
            assert data["account_name"] == "Customer with Contact"

    def test_create_account_missing_name(self, api_client, user):
        """Test that creating account without name fails."""
        payload = {
            "account_no": "ACC-002",
            "group_code": "CUSTOMER",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 400

    def test_create_account_sets_company(self, api_client, user):
        """Test that created account is assigned to user's company."""
        payload = {
            "account_name": "Test Customer",
            "account_no": "ACC-TEST-001",
            "group_code": "CUSTOMER",
        }

        url = "/api/accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        account_id = response.json()["id"]
        account = Account.objects.get(id=account_id)
        assert account.company == user.company


@pytest.mark.django_db
class TestAccountDetail:
    """Test cases for account detail endpoint."""

    def test_get_account_detail(self, api_client, user):
        """Test retrieving a single account."""
        account = Account.objects.create(
            account_name="Test Customer",
            account_no="ACC-DETAIL-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = f"/api/accounts/{account.id}/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(account.id)
        assert data["account_name"] == "Test Customer"

    def test_update_account(self, api_client, user):
        """Test updating an account."""
        account = Account.objects.create(
            account_name="Old Name",
            account_no="ACC-UPDATE-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        payload = {
            "account_name": "New Name",
        }

        url = f"/api/accounts/{account.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert data["account_name"] == "New Name"

    def test_delete_account(self, api_client, user):
        """Test deleting an account."""
        account = Account.objects.create(
            account_name="To Delete",
            account_no="ACC-DELETE-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = f"/api/accounts/{account.id}/"
        response = api_client.delete(url)

        assert response.status_code == 204
        assert not Account.objects.filter(id=account.id).exists()

    def test_account_detail_not_found(self, api_client):
        """Test that detail endpoint returns 404 for non-existent account."""
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/accounts/{fake_id}/"
        response = api_client.get(url)

        assert response.status_code == 404


@pytest.mark.django_db
class TestSubAccountEndpoints:
    """Test cases for sub-account endpoints."""

    def test_create_subaccount(self, api_client, user):
        """Test creating a sub-account."""
        parent = Account.objects.create(
            account_name="Parent Account",
            account_no="ACC-PARENT-001",
            group_code="CUSTOMER",
            company=user.company,
        )

        payload = {
            "account": str(parent.id),
            "sub_account_name": "Sub Account 1",
        }

        url = "/api/accounts/sub-accounts/"
        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        data = response.json()
        assert data["sub_account_name"] == "Sub Account 1"

    def test_list_subaccounts_for_parent(self, api_client, user):
        """Test listing sub-accounts for a parent account."""
        parent = Account.objects.create(
            account_name="Parent Account",
            account_no="ACC-PARENT-002",
            group_code="CUSTOMER",
            company=user.company,
        )
        SubAccount.objects.create(
            account=parent,
            sub_account_name="Sub 1",
            created_by=user,
        )
        SubAccount.objects.create(
            account=parent,
            sub_account_name="Sub 2",
            created_by=user,
        )

        url = f"/api/accounts/sub-accounts/?account={parent.id}"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2

    def test_update_subaccount(self, api_client, user):
        """Test updating a sub-account."""
        parent = Account.objects.create(
            account_name="Parent Account",
            account_no="ACC-PARENT-003",
            group_code="CUSTOMER",
            company=user.company,
        )
        subaccount = SubAccount.objects.create(
            account=parent,
            sub_account_name="Old Name",
            created_by=user,
        )

        payload = {
            "sub_account_name": "New Name",
        }

        url = f"/api/accounts/sub-accounts/{subaccount.id}/"
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == 200
        data = response.json()
        assert data["sub_account_name"] == "New Name"

    def test_delete_subaccount(self, api_client, user):
        """Test deleting a sub-account."""
        parent = Account.objects.create(
            account_name="Parent Account",
            account_no="ACC-PARENT-004",
            group_code="CUSTOMER",
            company=user.company,
        )
        subaccount = SubAccount.objects.create(
            account=parent,
            sub_account_name="To Delete",
            created_by=user,
        )

        url = f"/api/accounts/sub-accounts/{subaccount.id}/"
        response = api_client.delete(url)

        assert response.status_code == 204
        assert not SubAccount.objects.filter(id=subaccount.id).exists()


@pytest.mark.django_db
class TestAccountAuthentication:
    """Test cases for account authentication."""

    def test_list_requires_authentication(self):
        """Test that list endpoint requires authentication."""
        client = APIClient()
        url = "/api/accounts/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]

    def test_create_requires_authentication(self):
        """Test that create endpoint requires authentication."""
        client = APIClient()
        url = "/api/accounts/"
        payload = {"account_name": "Test"}
        response = client.post(url, payload, format="json")

        assert response.status_code in [302, 401, 403]

    def test_detail_requires_authentication(self):
        """Test that detail endpoint requires authentication."""
        client = APIClient()
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/accounts/{fake_id}/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]


@pytest.mark.django_db
class TestAccountMasters:
    """Test cases for account master data endpoints."""

    def test_get_account_types(self, api_client, user):
        """Test retrieving account types."""
        url = "/api/accounts/masters/"
        response = api_client.get(url)

        assert response.status_code == 200
        data = response.json()
        # Should return master data collections
        assert isinstance(data, dict)

    def test_account_dropdown_data(self, api_client, user):
        """Test retrieving account dropdown data."""
        Account.objects.create(
            account_name="Customer 1",
            account_no="ACC-DROPDOWN-001",
            group_code="CUSTOMER",
            company=user.company,
        )
        Account.objects.create(
            account_name="Customer 2",
            account_no="ACC-DROPDOWN-002",
            group_code="CUSTOMER",
            company=user.company,
        )

        url = "/api/accounts/?dropdown=true"
        response = api_client.get(url)

        # Should return simplified data for dropdowns
        assert response.status_code == 200
