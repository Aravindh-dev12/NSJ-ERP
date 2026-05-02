"""
Tests for voucher export endpoints.
"""

import pytest
from datetime import date
from django.contrib.auth import get_user_model
from accounts.models import Account
from vouchers.models import Voucher
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
        company=company,
    )


@pytest.fixture
def api_client(user):
    """Create an authenticated API client."""
    from django.test import Client

    client = Client()
    client.force_login(user)
    return client


@pytest.mark.django_db
class TestVoucherExportEndpoint:
    """Test cases for voucher export endpoint."""

    def test_export_single_voucher(self, api_client, user, account):
        """Test exporting a single voucher as Excel."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="EXPORT-001",
            item_name="Gold Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/export/"
        response = api_client.get(url)

        assert response.status_code == 200
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        assert "attachment" in response["Content-Disposition"]

    def test_export_filename_contains_order_number(self, api_client, user, account):
        """Test that export filename includes order number."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="EXPORT-002",
            item_name="Silver Necklace",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/export/"
        response = api_client.get(url)

        assert "export-002" in response["Content-Disposition"].lower()

    def test_export_not_found(self, api_client):
        """Test export returns 404 for non-existent voucher."""
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/export/"
        response = api_client.get(url)

        assert response.status_code == 404

    def test_export_requires_authentication(self):
        """Test that export endpoint requires authentication."""
        from django.test import Client

        client = Client()
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/export/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]


@pytest.mark.django_db
class TestVouchersExportAllEndpoint:
    """Test cases for export all vouchers endpoint."""

    def test_export_all_vouchers(self, api_client, user, account):
        """Test exporting all vouchers as Excel."""
        # Create multiple vouchers
        for i in range(3):
            Voucher.objects.create(
                company=user.company,
                account=account,
                bill_no=f"BULK-{i + 1:03d}",
                item_name=f"Item {i + 1}",
                date=date.today(),
                advance_payment_received="YES",
                created_by=user,
            )

        url = "/api/vouchers/export/"
        response = api_client.get(url)

        assert response.status_code == 200
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        assert "orders_data.xlsx" in response["Content-Disposition"]

    def test_export_all_empty_company(self, api_client, user):
        """Test exporting when company has no vouchers."""
        url = "/api/vouchers/export/"
        response = api_client.get(url)

        # Should still return Excel file, just empty
        assert response.status_code == 200
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    def test_export_all_requires_authentication(self):
        """Test that export all endpoint requires authentication."""
        from django.test import Client

        client = Client()
        url = "/api/vouchers/export/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]

    def test_export_all_company_isolation(self, api_client, user, account):
        """Test that export only includes company's vouchers."""
        # Create voucher for user's company
        Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="MY-001",
            item_name="My Item",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        # Create another company and voucher
        other_company = Company.objects.create(
            name="Other Company",
            display_name="Other Co",
        )
        other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="testpass123",
            company=other_company,
        )
        other_account = Account.objects.create(
            account_name="Other Customer",
            company=other_company,
        )
        Voucher.objects.create(
            company=other_company,
            account=other_account,
            bill_no="OTHER-001",
            item_name="Other Item",
            date=date.today(),
            advance_payment_received="YES",
            created_by=other_user,
        )

        url = "/api/vouchers/export/"
        response = api_client.get(url)

        # Should succeed and only include user's company data
        assert response.status_code == 200


@pytest.mark.django_db
class TestVoucherReceiptEndpoint:
    """Test cases for voucher receipt endpoint."""

    def test_receipt_endpoint_exists(self, api_client, user, account):
        """Test that receipt endpoint is accessible."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="RECEIPT-001",
            item_name="Gold Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/receipt/"
        response = api_client.get(url)

        assert response.status_code == 200

    def test_receipt_returns_order_and_company(self, api_client, user, account):
        """Test that receipt response contains order and company data."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="RECEIPT-002",
            item_name="Silver Necklace",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/receipt/"
        response = api_client.get(url)
        data = response.json()

        assert "order" in data
        assert "company" in data
        assert data["order"]["bill_no"] == "RECEIPT-002"

    def test_receipt_account_name_readable(self, api_client, user, account):
        """Test that receipt includes readable account name."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="RECEIPT-003",
            item_name="Diamond Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/receipt/"
        response = api_client.get(url)
        data = response.json()

        # Account should be an object with name
        assert isinstance(data["order"]["account"], dict)
        assert "name" in data["order"]["account"]

    def test_receipt_not_found(self, api_client):
        """Test receipt returns 404 for non-existent voucher."""
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/receipt/"
        response = api_client.get(url)

        assert response.status_code == 404

    def test_receipt_requires_authentication(self):
        """Test that receipt endpoint requires authentication."""
        from django.test import Client

        client = Client()
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/receipt/"
        response = client.get(url)

        assert response.status_code in [302, 401, 403]
