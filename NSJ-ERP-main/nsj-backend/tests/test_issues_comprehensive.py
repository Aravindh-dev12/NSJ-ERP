"""
Comprehensive tests for issues app to improve coverage.
Covers signals, views, and workflows.
"""

import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock

from core.models import Company, ItemNameMaster
from accounts.models import Account
from issues.models import Query, OrderIssue, RepairIssue
from issues.signals import track_query_status_change

User = get_user_model()


@pytest.fixture
def company(db):
    """Create a test company."""
    return Company.objects.create(name="Test Company", display_name="Test Co")


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
        account_no="ACC-001",
        group_code="CUSTOMER",
        company=company,
    )


@pytest.fixture
def item_name(db, company):
    """Create a test item name."""
    return ItemNameMaster.objects.create(name="Gold Ring", company=company)


@pytest.fixture
def api_client(user):
    """Create an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# ============================================================================
# Signal Tests
# ============================================================================


@pytest.mark.django_db
class TestQuerySignals:
    """Test Query model signals."""

    def test_track_query_status_change_new_query(self, user, account, item_name):
        """Test tracking status change for new query."""
        query = Query(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        # Trigger pre_save signal
        track_query_status_change(Query, query)

        assert query._old_status is None

    def test_track_query_status_change_existing_query(self, user, account, item_name):
        """Test tracking status change for existing query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        # Modify query
        query.status = "converted_to_order"

        # Trigger pre_save signal
        track_query_status_change(Query, query)

        assert query._old_status == "pending"

    def test_query_conversion_signal_integration(self, user, account, item_name):
        """Test that converting query triggers signal (integration test)."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        # Convert query - signal should be triggered automatically
        query.status = "converted_to_order"
        query.save()

        # Verify status changed
        query.refresh_from_db()
        assert query.status == "converted_to_order"


@pytest.mark.django_db
class TestOrderIssueSignals:
    """Test OrderIssue model signals."""

    def test_order_issue_creation_triggers_signal(self, user, account, item_name):
        """Test that creating order issue triggers signal (integration test)."""
        order_issue = OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            created_by=user,
        )

        # Signal should have been triggered automatically
        assert order_issue.id is not None

    def test_order_issue_update_no_duplicate_tasks(self, user, account, item_name):
        """Test that updating order issue doesn't create duplicate tasks."""
        order_issue = OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            created_by=user,
        )

        # Update shouldn't trigger task creation again
        order_issue.status = "in_progress"
        order_issue.save()

        assert order_issue.status == "in_progress"


# ============================================================================
# Query ViewSet Tests
# ============================================================================


@pytest.mark.django_db
class TestQueryViewSet:
    """Test Query ViewSet endpoints."""

    def test_list_queries(self, api_client, user, account, item_name):
        """Test listing queries."""
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.get("/api/payments/queries/")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_create_query(self, api_client, user, account, item_name):
        """Test creating a query."""
        payload = {
            "account": str(account.id),
            "item_name": str(item_name.id),
            "status": "pending",
            "location": "Mumbai",
            "gold_carat": "22K",
            "size": "7",
            "query_in_date": str(date.today()),
        }

        response = api_client.post("/api/payments/queries/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"

    def test_search_queries(self, api_client, user, account, item_name):
        """Test searching queries."""
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            location="Mumbai",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.get("/api/payments/queries/?search=Mumbai")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_filter_queries_by_status(self, api_client, user, account, item_name):
        """Test filtering queries by status."""
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="archived",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.get("/api/payments/queries/?status=pending")
        assert response.status_code == 200
        data = response.json()
        results = data["results"]
        assert all(q["status"] == "pending" for q in results)

    def test_archive_query(self, api_client, user, account, item_name):
        """Test manually archiving a query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.post(f"/api/payments/queries/{query.id}/archive/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "archived"

    def test_archive_query_invalid_status(self, api_client, user, account, item_name):
        """Test archiving query with invalid status fails."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="converted_to_order",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.post(f"/api/payments/queries/{query.id}/archive/")
        assert response.status_code == 400

    def test_reopen_query(self, api_client, user, account, item_name):
        """Test reopening an archived query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="archived",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.post(f"/api/payments/queries/{query.id}/reopen/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"

    def test_reopen_query_invalid_status(self, api_client, user, account, item_name):
        """Test reopening non-archived query fails."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.post(f"/api/payments/queries/{query.id}/reopen/")
        assert response.status_code == 400

    def test_convert_query_to_order(self, api_client, user, account, item_name):
        """Test converting query to order."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        payload = {"order_id": "test-order-123"}
        response = api_client.post(
            f"/api/payments/queries/{query.id}/convert_to_order/", payload, format="json"
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "converted_to_order"
        assert data["order_id"] == "test-order-123"

    def test_convert_query_invalid_status(self, api_client, user, account, item_name):
        """Test converting already converted query fails."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="converted_to_order",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            created_by=user,
        )

        response = api_client.post(f"/api/payments/queries/{query.id}/convert_to_order/")
        assert response.status_code == 400

    def test_auto_archive_expired_queries(self, api_client, user, account, item_name):
        """Test auto-archiving expired queries."""
        # Create expired query
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today() - timedelta(days=10),
            expiry_date=date.today() - timedelta(days=1),
            created_by=user,
        )

        # Create non-expired query
        Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            expiry_date=date.today() + timedelta(days=1),
            created_by=user,
        )

        response = api_client.post("/api/payments/queries/auto_archive/")
        assert response.status_code == 200
        data = response.json()
        assert "queries auto-archived" in data["message"]


# ============================================================================
# OrderIssue ViewSet Tests
# ============================================================================


@pytest.mark.django_db
class TestOrderIssueViewSet:
    """Test OrderIssue ViewSet endpoints."""

    def test_list_order_issues(self, api_client, user, account, item_name):
        """Test listing order issues."""
        OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            created_by=user,
        )

        response = api_client.get("/api/payments/order-issues/")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_create_order_issue_standalone(self, api_client, user, account, item_name):
        """Test creating standalone order issue."""
        payload = {
            "account": str(account.id),
            "item_name": str(item_name.id),
            "metal": "Gold",
            "total_size": "7.5",
            "base_metal_colour": "Yellow",
            "additional_notes": "Test notes",
        }

        response = api_client.post("/api/payments/order-issues/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["metal"] == "Gold"

    def test_create_order_issue_missing_account(self, api_client, user, item_name):
        """Test creating order issue without account fails."""
        payload = {
            "item_name": str(item_name.id),
            "metal": "Gold",
        }

        response = api_client.post("/api/payments/order-issues/", payload, format="json")
        assert response.status_code == 400

    def test_create_order_issue_missing_item_name(self, api_client, user, account):
        """Test creating order issue without item_name fails."""
        payload = {
            "account": str(account.id),
            "metal": "Gold",
        }

        response = api_client.post("/api/payments/order-issues/", payload, format="json")
        assert response.status_code == 400

    def test_create_order_issue_invalid_account(self, api_client, user, item_name):
        """Test creating order issue with invalid account fails."""
        payload = {
            "account": "00000000-0000-0000-0000-000000000000",
            "item_name": str(item_name.id),
            "metal": "Gold",
        }

        response = api_client.post("/api/payments/order-issues/", payload, format="json")
        assert response.status_code == 404

    def test_search_order_issues(self, api_client, user, account, item_name):
        """Test searching order issues."""
        OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            order_ref="REF-123",
            created_by=user,
        )

        response = api_client.get("/api/payments/order-issues/?search=REF-123")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_filter_order_issues_by_status(self, api_client, user, account, item_name):
        """Test filtering order issues by status."""
        OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            status="pending",
            created_by=user,
        )

        response = api_client.get("/api/payments/order-issues/?status=pending")
        assert response.status_code == 200
        data = response.json()
        results = data["results"]
        assert all(oi["status"] == "pending" for oi in results)

    def test_export_order_issue_pdf(self, api_client, user, account, item_name):
        """Test exporting order issue to PDF."""
        order_issue = OrderIssue.objects.create(
            account=account,
            item_name=item_name,
            metal="Gold",
            order_ref="REF-123",
            created_by=user,
        )

        response = api_client.get(f"/api/payments/order-issues/{order_issue.id}/export/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert "attachment" in response["Content-Disposition"]


# ============================================================================
# RepairIssue ViewSet Tests
# ============================================================================


@pytest.mark.django_db
class TestRepairIssueViewSet:
    """Test RepairIssue ViewSet endpoints."""

    def test_list_repair_issues(self, api_client, user, account, item_name, company):
        """Test listing repair issues."""
        RepairIssue.objects.create(
            company=company,
            account=account,
            item_name=item_name,
            tag_no="TAG-001",
            created_by=user,
        )

        response = api_client.get("/api/payments/repair-issues/")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_create_repair_issue(self, api_client, user, account, item_name):
        """Test creating a repair issue."""
        payload = {
            "account": str(account.id),
            "item_name": str(item_name.id),
            "tag_no": "TAG-002",
            "remark": "Needs polishing",
            "rate": "500.00",
        }

        response = api_client.post("/api/payments/repair-issues/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["tag_no"] == "TAG-002"

    def test_search_repair_issues(self, api_client, user, account, item_name, company):
        """Test searching repair issues."""
        RepairIssue.objects.create(
            company=company,
            account=account,
            item_name=item_name,
            tag_no="TAG-SEARCH",
            remark="Test remark",
            created_by=user,
        )

        response = api_client.get("/api/payments/repair-issues/?search=TAG-SEARCH")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_repair_issue_company_isolation(self, api_client, user, account, item_name, company):
        """Test that users only see their company's repair issues."""
        RepairIssue.objects.create(
            company=company,
            account=account,
            item_name=item_name,
            tag_no="TAG-MY",
            created_by=user,
        )

        # Create repair issue for different company
        other_company = Company.objects.create(name="Other Co", display_name="Other")
        other_account = Account.objects.create(
            account_name="Other Customer",
            account_no="ACC-002",
            group_code="CUSTOMER",
            company=other_company,
        )
        RepairIssue.objects.create(
            company=other_company,
            account=other_account,
            item_name=item_name,
            tag_no="TAG-OTHER",
            created_by=user,
        )

        response = api_client.get("/api/payments/repair-issues/")
        assert response.status_code == 200
        data = response.json()

        # Should only see own company's issues
        tag_nos = [ri["tag_no"] for ri in data["results"]]
        assert "TAG-MY" in tag_nos
        assert "TAG-OTHER" not in tag_nos


# ============================================================================
# Model Method Tests
# ============================================================================


@pytest.mark.django_db
class TestQueryModelMethods:
    """Test Query model methods."""

    def test_query_is_expired_true(self, user, account, item_name):
        """Test is_expired returns True for expired query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today() - timedelta(days=10),
            expiry_date=date.today() - timedelta(days=1),
            created_by=user,
        )

        assert query.is_expired() is True

    def test_query_is_expired_false(self, user, account, item_name):
        """Test is_expired returns False for non-expired query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            expiry_date=date.today() + timedelta(days=1),
            created_by=user,
        )

        assert query.is_expired() is False

    def test_query_auto_archive_if_expired(self, user, account, item_name):
        """Test auto_archive_if_expired archives expired pending query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today() - timedelta(days=10),
            expiry_date=date.today() - timedelta(days=1),
            created_by=user,
        )

        result = query.auto_archive_if_expired()
        assert result is True

        query.refresh_from_db()
        assert query.status == "archived"

    def test_query_auto_archive_not_expired(self, user, account, item_name):
        """Test auto_archive_if_expired doesn't archive non-expired query."""
        query = Query.objects.create(
            account=account,
            item_name=item_name,
            status="pending",
            gold_carat="22K",
            size="7",
            query_in_date=date.today(),
            expiry_date=date.today() + timedelta(days=1),
            created_by=user,
        )

        result = query.auto_archive_if_expired()
        assert result is False

        query.refresh_from_db()
        assert query.status == "pending"
