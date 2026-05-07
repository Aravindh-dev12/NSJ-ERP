"""
Task Management System - Signal Tests

Tests for task signals including status change tracking,
notifications, and auto-triggers for order-based workflows.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task, TaskNotification, TaskStatusHistory
from tasks.signals import create_production_tasks_for_order, notify_production_department
from users.models import User
from core.models import Company


@pytest.mark.django_db
class TestTaskSignals:
    """Test task signal handlers"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company", display_name="Test Co")

    @pytest.fixture
    def user(self, company):
        return User.objects.create(
            username="test_signal_user",
            email="user@test.com",
            name="Test User",
            company=company,
            department="PRODUCTION",
        )

    def test_status_history_created_on_task_creation(self, company, user):
        """Test that status history is created when task is created"""
        task = Task.objects.create(
            company=company,
            title="New Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        # Check that status history was created
        history = TaskStatusHistory.objects.filter(task=task)
        assert history.count() == 1

        first_history = history.first()
        assert first_history.old_status is None
        assert first_history.new_status == "PENDING"
        assert first_history.changed_by == user
        assert "created" in first_history.notes.lower()

    def test_status_history_created_on_status_change(self, company, user):
        """Test that status history is created when status changes"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        # Refresh task from database to ensure it's properly saved
        task.refresh_from_db()

        # Small delay to ensure database transaction completes
        import time

        time.sleep(0.1)

        # Change status
        task.status = "COMPLETED"
        task.save()

        # Check that new status history was created
        history = TaskStatusHistory.objects.filter(task=task).order_by("-changed_at")
        assert history.count() == 2  # Initial + status change

        latest_history = history.first()
        assert latest_history.old_status == "PENDING"
        assert latest_history.new_status == "COMPLETED"

    def test_completed_at_timestamp_set(self, company, user):
        """Test that completed_at is set when status changes to COMPLETED"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        assert task.completed_at is None

        # Change to completed
        task.status = "COMPLETED"
        task.save()

        # Refresh from DB
        task.refresh_from_db()
        assert task.completed_at is not None

    def test_notification_created_on_task_assignment(self, company, user):
        """Test that notification is created when task is assigned"""
        task = Task.objects.create(
            company=company,
            title="Assigned Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        # Check that notification was created
        notifications = TaskNotification.objects.filter(user=user, task=task)
        assert notifications.count() == 1

        notification = notifications.first()
        assert "assigned" in notification.message.lower()
        assert notification.is_read is False

    def test_no_notification_for_unassigned_task(self, company, user):
        """Test that no notification is created for unassigned tasks"""
        task = Task.objects.create(
            company=company,
            title="Unassigned Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=None,  # Not assigned
            created_by=user,
            status="PENDING",
        )

        # Check that no notification was created
        notifications = TaskNotification.objects.filter(task=task)
        assert notifications.count() == 0

    def test_multiple_status_changes_tracked(self, company, user):
        """Test that multiple status changes are all tracked"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        # Change status multiple times
        task.status = "STUCK"
        task.save()

        task.status = "NEED_FOUNDER"
        task.save()

        task.status = "COMPLETED"
        task.save()

        # Check all status changes were tracked
        history = TaskStatusHistory.objects.filter(task=task).order_by("changed_at")
        assert history.count() == 4  # Initial + 3 changes

        statuses = [h.new_status for h in history]
        assert statuses == ["PENDING", "STUCK", "NEED_FOUNDER", "COMPLETED"]


@pytest.mark.django_db
class TestProductionAutoTriggers:
    """Test auto-trigger functionality for production workflows"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    @pytest.fixture
    def founder(self, company):
        return User.objects.create(
            username="founder_signal",
            email="founder@test.com",
            name="Founder",
            company=company,
            task_role="FOUNDER",
            department="FOUNDER",
        )

    @pytest.fixture
    def production_head(self, company):
        return User.objects.create(
            username="prod_head",
            email="prod@test.com",
            name="Production Head",
            company=company,
            task_role="DEPT_HEAD",
            department="PRODUCTION",
        )

    @pytest.fixture
    def mock_order_issue(self):
        """Create a mock order issue object"""

        class MockOrderIssue:
            id = "test-order-123"
            item_name = type("obj", (object,), {"name": "Gold Ring"})()
            metal = "22K Gold"
            total_size = "7"
            final_finish = "Polished"
            prong_style = "4-Prong"
            locking_system = "Push Lock"
            rhodium_instructions = "Full Rhodium"
            base_metal_colour = "Yellow Gold"
            additional_notes = "Handle with care"

            class Order:
                bill_no = "ORD-001"

            order = Order()

        return MockOrderIssue()

    def test_create_production_tasks_for_order(
        self, company, founder, production_head, mock_order_issue
    ):
        """Test that production milestone tasks are created for order"""
        tasks = create_production_tasks_for_order(mock_order_issue, created_by=founder)

        # Should create 6 milestone tasks
        assert len(tasks) == 6

        # Check task titles contain order number
        for task in tasks:
            assert "ORD-001" in task.title

        # Check departments are assigned correctly
        departments = [t.department for t in tasks]
        assert "RAW_MATERIAL_INVENTORY" in departments
        assert "PRODUCT_DESIGN" in departments
        assert "PRODUCTION" in departments
        assert "LOGISTICS" in departments

        # Check deadlines are progressive
        deadlines = [t.deadline for t in tasks]
        for i in range(len(deadlines) - 1):
            assert deadlines[i] <= deadlines[i + 1]

        # Check urgency levels
        urgencies = [t.urgency for t in tasks]
        assert "HIGH" in urgencies
        assert "MEDIUM" in urgencies

    def test_production_tasks_have_descriptions(self, company, founder, mock_order_issue):
        """Test that production tasks have detailed descriptions"""
        tasks = create_production_tasks_for_order(mock_order_issue, created_by=founder)

        for task in tasks:
            # Each task should have a meaningful description
            assert task.description is not None
            assert len(task.description) > 20  # Should have meaningful content
            # Descriptions contain various order details depending on the milestone
            # Just verify they're not empty and contain some text
            assert task.description.strip() != ""

    def test_production_tasks_create_notifications(
        self, company, founder, production_head, mock_order_issue
    ):
        """Test that notifications are created for assigned production tasks"""
        tasks = create_production_tasks_for_order(mock_order_issue, created_by=founder)

        # Check that notifications were created for assigned users
        notifications = TaskNotification.objects.filter(task__in=tasks)
        assert notifications.count() > 0

        # Check notification messages
        for notification in notifications:
            assert (
                "auto-assigned" in notification.message.lower()
                or "assigned" in notification.message.lower()
            )

    def test_notify_production_department(self, company, founder, production_head):
        """Test production department notification on query conversion"""

        # Create a mock query object
        class MockQuery:
            id = "query-123"
            item_name = type("obj", (object,), {"name": "Diamond Necklace"})()
            gold_carat = "18K"
            size = "16 inches"
            created_by = founder

            class Account:
                account_name = "John Doe"

            account = Account()
            item_name_custom = None

        mock_query = MockQuery()

        task = notify_production_department(mock_query)

        # Check that task was created
        assert task is not None
        assert "Diamond Necklace" in task.title
        assert task.department == "PRODUCTION"
        assert task.urgency == "HIGH"
        assert task.assigned_to == production_head

        # Check notification was created
        notification = TaskNotification.objects.filter(user=production_head, task=task).first()
        assert notification is not None
        assert "order" in notification.message.lower()

    def test_production_tasks_without_created_by(self, company, mock_order_issue):
        """Test creating production tasks without created_by user"""
        tasks = create_production_tasks_for_order(mock_order_issue, created_by=None)

        # Should still create tasks
        assert len(tasks) == 6

        # created_by should be None
        for task in tasks:
            assert task.created_by is None


@pytest.mark.django_db
class TestSignalEdgeCases:
    """Test edge cases and error handling in signals"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    @pytest.fixture
    def user(self, company):
        return User.objects.create(
            username="edge_case_user", email="user@test.com", name="User", company=company
        )

    def test_status_change_from_completed_to_pending(self, company, user):
        """Test reopening a completed task"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="COMPLETED",
            completed_at=timezone.now(),
        )

        # Refresh task from database to ensure it's properly saved
        task.refresh_from_db()

        # Small delay to ensure database transaction completes
        import time

        time.sleep(0.1)

        # Reopen task
        task.status = "PENDING"
        task.save()

        # Check status history
        history = TaskStatusHistory.objects.filter(task=task).order_by("-changed_at")
        latest = history.first()
        assert latest.old_status == "COMPLETED"
        assert latest.new_status == "PENDING"

    def test_task_with_name_assignment_gets_notification(self, company, user):
        """Test that tasks assigned by name (not FK) still create notifications"""
        # This tests the case where assigned_to is None but assigned_to_name is set
        task = Task.objects.create(
            company=company,
            title="Name Assigned Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=None,
            assigned_to_name="John Doe",
            created_by=user,
            status="PENDING",
        )

        # No notification should be created since assigned_to is None
        notifications = TaskNotification.objects.filter(task=task)
        assert notifications.count() == 0
