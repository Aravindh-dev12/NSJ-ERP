"""
Tests for Order Issues API endpoints
"""

import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from core.models import Company, ItemNameMaster
from accounts.models import Account
from vouchers.models import Order
from issues.models import OrderIssue

User = get_user_model()


class OrderIssueAPITestCase(TestCase):
    """Test suite for Order Issue API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create company
        self.company = Company.objects.create(
            name="Test Company",
            display_name="Test Company Inc.",
            is_active=True,
        )

        # Create user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

        # Create account
        self.account = Account.objects.create(
            company=self.company,
            account_name="Test Account",
            account_no="ACC001",
            group_code="CUSTOMER",
        )

        # Create item name master
        self.item_name = ItemNameMaster.objects.create(
            company=self.company,
            name="Pendant",
        )

        # Create order
        self.order = Order.objects.create(
            company=self.company,
            account=self.account,
            series="DEFAULT",
            bill_no=f"V-{uuid.uuid4().hex[:10].upper()}",
            item_name="Pendant",
            item_name_fk=self.item_name,
            design="Custom Design",
            job_no=f"JOB-{uuid.uuid4().hex[:8].upper()}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    def test_create_order_issue(self):
        """Test creating an order issue from an order"""
        url = "/api/order-issues/"
        data = {"order_id": str(self.order.id)}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["order"]["bill_no"], self.order.bill_no)
        self.assertEqual(response.data["account"]["id"], str(self.account.id))
        self.assertEqual(response.data["item_name"]["name"], "Pendant")

    def test_create_order_issue_without_order_id(self):
        """Test creating order issue without order_id returns error"""
        url = "/api/order-issues/"
        data = {}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("order_id", str(response.data))

    def test_list_order_issues(self):
        """Test listing all order issues"""
        # Create some order issues
        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="in_progress",
            created_by=self.user,
        )

        url = "/api/order-issues/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_order_issues_with_search(self):
        """Test searching order issues by bill_no"""
        # Create order issue
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/?search={self.order.bill_no}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(order_issue.id))

    def test_list_order_issues_with_status_filter(self):
        """Test filtering order issues by status"""
        # Create order issues with different statuses
        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="in_progress",
            created_by=self.user,
        )

        url = "/api/order-issues/?status=pending"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["status"], "pending")

    def test_get_order_issue_detail(self):
        """Test retrieving a specific order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            description="Sample issue",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(order_issue.id))
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["description"], "Sample issue")

    def test_update_order_issue(self):
        """Test updating an order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        data = {
            "status": "in_progress",
            "order_ref": "ORD-2025-001",
            "description": "Working on this issue",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["order_ref"], "ORD-2025-001")
        self.assertEqual(response.data["description"], "Working on this issue")

    def test_delete_order_issue(self):
        """Test deleting an order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify it's deleted
        self.assertFalse(OrderIssue.objects.filter(id=order_issue.id).exists())

    def test_order_issue_serialization(self):
        """Test that order issue is properly serialized with related objects"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="resolved",
            order_ref="REF-001",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.get(url)

        # Check nested objects are properly serialized
        self.assertEqual(response.data["order"]["id"], str(self.order.id))
        self.assertEqual(response.data["account"]["account_name"], "Test Account")
        self.assertEqual(response.data["item_name"]["name"], "Pendant")

    def test_create_order_issue(self):
        """Test creating an order issue from an order"""
        url = "/api/order-issues/"
        data = {"order_id": str(self.order.id)}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["order"]["bill_no"], self.order.bill_no)
        self.assertEqual(response.data["account"]["id"], str(self.account.id))
        self.assertEqual(response.data["item_name"]["name"], "Pendant")

    def test_create_order_issue_without_order_id(self):
        """Test creating order issue without order_id returns error"""
        url = "/api/order-issues/"
        data = {}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("order_id", str(response.data))

    def test_list_order_issues(self):
        """Test listing all order issues"""
        # Create some order issues
        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="in_progress",
            created_by=self.user,
        )

        url = "/api/order-issues/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_order_issues_with_search(self):
        """Test searching order issues by bill_no"""
        # Create order issue
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/?search={self.order.bill_no}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(order_issue.id))

    def test_list_order_issues_with_status_filter(self):
        """Test filtering order issues by status"""
        # Create order issues with different statuses
        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="in_progress",
            created_by=self.user,
        )

        url = "/api/order-issues/?status=pending"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["status"], "pending")

    def test_get_order_issue_detail(self):
        """Test retrieving a specific order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            description="Sample issue",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(order_issue.id))
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["description"], "Sample issue")

    def test_update_order_issue(self):
        """Test updating an order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        data = {
            "status": "in_progress",
            "order_ref": "ORD-2025-001",
            "description": "Working on this issue",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["order_ref"], "ORD-2025-001")
        self.assertEqual(response.data["description"], "Working on this issue")

    def test_delete_order_issue(self):
        """Test deleting an order issue"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="pending",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify it's deleted
        self.assertFalse(OrderIssue.objects.filter(id=order_issue.id).exists())

    def test_order_issue_serialization(self):
        """Test that order issue is properly serialized with related objects"""
        order_issue = OrderIssue.objects.create(
            order=self.order,
            account=self.account,
            item_name=self.item_name,
            status="resolved",
            order_ref="REF-001",
            created_by=self.user,
        )

        url = f"/api/order-issues/{order_issue.id}/"
        response = self.client.get(url)

        # Check nested objects are properly serialized
        self.assertEqual(response.data["order"]["id"], str(self.order.id))
        self.assertEqual(response.data["account"]["account_name"], "Test Account")
        self.assertEqual(response.data["item_name"]["name"], "Pendant")
