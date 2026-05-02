"""
Tests for voucher history timeline endpoint.
"""

import pytest
from datetime import date, timedelta
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
class TestVoucherHistoryEndpoint:
    """Test cases for voucher history timeline endpoint."""

    def test_history_endpoint_exists(self, api_client, user, account):
        """Test that the history endpoint is accessible."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-001",
            item_name="Gold Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)

        assert response.status_code == 200

    def test_history_returns_required_fields(self, api_client, user, account):
        """Test that history response contains all required fields."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-002",
            item_name="Silver Necklace",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        # Check required fields
        assert "order_id" in data
        assert "bill_no" in data
        assert "timeline" in data
        assert "current_status" in data
        assert "customer_name" in data
        assert "item" in data
        assert "advance_payment" in data
        assert "days_since_order" in data

    def test_history_timeline_structure(self, api_client, user, account):
        """Test that timeline events have correct structure."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-003",
            item_name="Diamond Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert isinstance(data["timeline"], list)
        assert len(data["timeline"]) > 0

        # Check first event structure
        event = data["timeline"][0]
        assert "date" in event
        assert "event" in event
        assert "description" in event
        assert "status" in event

    def test_history_with_advance_payment(self, api_client, user, account):
        """Test history for order with advance payment."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-004",
            item_name="Gold Bracelet",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["advance_payment"] == "YES"
        assert data["current_status"] == "Active"
        assert "days_since_advance" in data
        assert data["days_since_advance"] is not None

    def test_history_without_advance_payment(self, api_client, user, account):
        """Test history for order without advance payment."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-005",
            item_name="Silver Ring",
            date=date.today(),
            advance_payment_received="NO",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["advance_payment"] == "NO"
        assert data["current_status"] == "Pending Advance"
        assert data["days_since_advance"] is None

    def test_history_days_calculation(self, api_client, user, account):
        """Test that days since order is calculated correctly."""
        past_date = date.today() - timedelta(days=5)
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-006",
            item_name="Gold Chain",
            date=past_date,
            advance_payment_received="YES",
            created_by=user,
        )
        # Manually set created_at to past date
        voucher.created_at = voucher.created_at - timedelta(days=5)
        voucher.save()

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["days_since_order"] >= 5

    def test_history_customer_name_display(self, api_client, user, account):
        """Test that customer name is displayed correctly."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-007",
            item_name="Diamond Earrings",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["customer_name"] == "Test Customer"

    def test_history_not_found(self, api_client):
        """Test history endpoint returns 404 for non-existent voucher."""
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/history/"
        response = api_client.get(url)

        assert response.status_code == 404

    def test_history_requires_authentication(self):
        """Test that history endpoint requires authentication."""
        from django.test import Client

        client = Client()
        import uuid

        fake_id = uuid.uuid4()
        url = f"/api/vouchers/{fake_id}/history/"
        response = client.get(url)

        # Should redirect to login or return 401/403
        assert response.status_code in [302, 401, 403]

    def test_history_company_isolation(self, api_client, user, account, company):
        """Test that users can only see history for their company's vouchers."""
        # Create another company and user
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

        # Create voucher for other company
        other_voucher = Voucher.objects.create(
            company=other_company,
            account=other_account,
            bill_no="OTHER-001",
            item_name="Other Item",
            date=date.today(),
            advance_payment_received="YES",
            created_by=other_user,
        )

        # Try to access with original user
        url = f"/api/vouchers/{other_voucher.id}/history/"
        response = api_client.get(url)

        # Should return 404 (not found) to prevent information leakage
        assert response.status_code == 404

    def test_history_timeline_order(self, api_client, user, account):
        """Test that timeline events are ordered by date."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-008",
            item_name="Gold Pendant",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        timeline = data["timeline"]
        if len(timeline) > 1:
            # Check that dates are in ascending order
            dates = [event["date"] for event in timeline]
            assert dates == sorted(dates)

    def test_history_with_item_name(self, api_client, user, account):
        """Test that item name is included in history."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-009",
            item_name="Platinum Ring",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["item"] == "Platinum Ring"

    def test_history_without_item_name(self, api_client, user, account):
        """Test history when item name is not provided."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-010",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)
        data = response.json()

        assert data["item"] == "—"

    def test_history_json_format(self, api_client, user, account):
        """Test that response is valid JSON."""
        voucher = Voucher.objects.create(
            company=user.company,
            account=account,
            bill_no="TEST-011",
            item_name="Gold Bangle",
            date=date.today(),
            advance_payment_received="YES",
            created_by=user,
        )

        url = f"/api/vouchers/{voucher.id}/history/"
        response = api_client.get(url)

        assert response["Content-Type"] == "application/json"
        # Should not raise exception
        data = response.json()
        assert isinstance(data, dict)
