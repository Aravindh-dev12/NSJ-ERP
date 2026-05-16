"""
Comprehensive tests for tasks/admin.py
Tests admin interface customizations, badges, and save logic.
"""

import pytest
from django.contrib.admin.sites import AdminSite
from django.utils import timezone
from datetime import timedelta
from tasks.admin import TaskAdmin, TaskStatusHistoryAdmin, TaskNotificationAdmin
from tasks.models import Task, TaskStatusHistory, TaskNotification
from users.models import User
from core.models import Company


@pytest.fixture
def company(db):
    """Create a test company"""
    return Company.objects.create(name="Test Company", display_name="Test Company")


@pytest.fixture
def admin_user(db, company):
    """Create an admin user"""
    return User.objects.create(
        name="Admin User",
        email="admin@test.com",
        username="admin_user",
        company=company,
        role="ADMIN",
        task_role="FOUNDER",
    )


@pytest.fixture
def regular_user(db, company):
    """Create a regular user"""
    return User.objects.create(
        name="Regular User",
        email="user@test.com",
        username="regular_user",
        company=company,
        role="EMPLOYEE",
        task_role="INDIVIDUAL",
        department="PRODUCTION",
    )


@pytest.fixture
def task(db, company, admin_user, regular_user):
    """Create a test task"""
    return Task.objects.create(
        title="Test Task",
        description="Test Description",
        company=company,
        created_by=admin_user,
        assigned_to=regular_user,
        department="PRODUCTION",
        urgency="MEDIUM",
        status="PENDING",
        deadline=timezone.now().date() + timedelta(days=7),
    )


@pytest.fixture
def task_admin():
    """Create TaskAdmin instance"""
    return TaskAdmin(Task, AdminSite())


@pytest.fixture
def task_status_history_admin():
    """Create TaskStatusHistoryAdmin instance"""
    return TaskStatusHistoryAdmin(TaskStatusHistory, AdminSite())


@pytest.fixture
def task_notification_admin():
    """Create TaskNotificationAdmin instance"""
    return TaskNotificationAdmin(TaskNotification, AdminSite())


@pytest.mark.django_db
class TestTaskAdmin:
    """Test TaskAdmin customizations"""

    def test_urgency_badge_low(self, task_admin, task):
        """Test urgency badge for LOW urgency"""
        task.urgency = "LOW"
        task.save()
        badge = task_admin.urgency_badge(task)
        assert "#28a745" in badge  # Green color
        assert "Low" in badge

    def test_urgency_badge_medium(self, task_admin, task):
        """Test urgency badge for MEDIUM urgency"""
        task.urgency = "MEDIUM"
        task.save()
        badge = task_admin.urgency_badge(task)
        assert "#ffc107" in badge  # Yellow color
        assert "Medium" in badge

    def test_urgency_badge_high(self, task_admin, task):
        """Test urgency badge for HIGH urgency"""
        task.urgency = "HIGH"
        task.save()
        badge = task_admin.urgency_badge(task)
        assert "#fd7e14" in badge  # Orange color
        assert "High" in badge

    def test_urgency_badge_urgent(self, task_admin, task):
        """Test urgency badge for URGENT urgency"""
        task.urgency = "URGENT"
        task.save()
        badge = task_admin.urgency_badge(task)
        assert "#dc3545" in badge  # Red color
        assert "Urgent" in badge

    def test_status_badge_pending(self, task_admin, task):
        """Test status badge for PENDING status"""
        task.status = "PENDING"
        task.save()
        badge = task_admin.status_badge(task)
        assert "#6c757d" in badge  # Gray color
        assert "Pending" in badge

    def test_status_badge_completed(self, task_admin, task):
        """Test status badge for COMPLETED status"""
        task.status = "COMPLETED"
        task.save()
        badge = task_admin.status_badge(task)
        assert "#28a745" in badge  # Green color
        assert "Completed" in badge

    def test_status_badge_stuck(self, task_admin, task):
        """Test status badge for STUCK status"""
        task.status = "STUCK"
        task.save()
        badge = task_admin.status_badge(task)
        assert "#dc3545" in badge  # Red color
        assert "Stuck" in badge

    def test_status_badge_need_founder(self, task_admin, task):
        """Test status badge for NEED_FOUNDER status"""
        task.status = "NEED_FOUNDER"
        task.save()
        badge = task_admin.status_badge(task)
        assert "#e83e8c" in badge  # Pink color
        assert "Need Founder" in badge

    def test_status_badge_transferred(self, task_admin, task):
        """Test status badge for TRANSFERRED status"""
        task.status = "TRANSFERRED"
        task.save()
        badge = task_admin.status_badge(task)
        assert "#17a2b8" in badge  # Cyan color
        assert "Transferred" in badge

    def test_is_overdue_completed(self, task_admin, task):
        """Test is_overdue for completed task"""
        task.status = "COMPLETED"
        task.save()
        result = task_admin.is_overdue(task)
        assert "✓ Completed" in result
        assert "#28a745" in result

    def test_is_overdue_past_deadline(self, task_admin, task):
        """Test is_overdue for task past deadline"""
        task.deadline = timezone.now().date() - timedelta(days=1)
        task.status = "PENDING"
        task.save()
        result = task_admin.is_overdue(task)
        assert "⚠ Overdue" in result
        assert "#dc3545" in result

    def test_is_overdue_on_track(self, task_admin, task):
        """Test is_overdue for task on track"""
        task.deadline = timezone.now().date() + timedelta(days=7)
        task.status = "PENDING"
        task.save()
        result = task_admin.is_overdue(task)
        assert "On Track" in result
        assert "#6c757d" in result

    def test_save_model_new_task(self, task_admin, admin_user, company):
        """Test save_model for new task creation"""
        from django.test import RequestFactory
        from unittest.mock import Mock

        request = RequestFactory().get("/")
        request.user = admin_user

        new_task = Task(
            title="New Task",
            description="New Description",
            department="PRODUCTION",
            urgency="HIGH",
            status="PENDING",
            deadline=timezone.now().date() + timedelta(days=5),
        )

        task_admin.save_model(request, new_task, Mock(), change=False)

        assert new_task.created_by == admin_user
        assert new_task.company == company

    def test_save_model_status_change_to_completed(self, task_admin, task, admin_user):
        """Test save_model auto-sets completed_at when status changes to COMPLETED"""
        from django.test import RequestFactory
        from unittest.mock import Mock

        request = RequestFactory().get("/")
        request.user = admin_user

        # Simulate form with initial status != COMPLETED
        form = Mock()
        form.initial = {"status": "PENDING"}

        task.status = "COMPLETED"
        task_admin.save_model(request, task, form, change=True)

        assert task.completed_at is not None

    def test_save_model_status_change_from_completed(self, task_admin, task, admin_user):
        """Test save_model clears completed_at when status changes from COMPLETED"""
        from django.test import RequestFactory
        from unittest.mock import Mock

        request = RequestFactory().get("/")
        request.user = admin_user

        # Set task as completed first
        task.status = "COMPLETED"
        task.completed_at = timezone.now()
        task.save()

        # Now change status back to PENDING
        form = Mock()
        form.initial = {"status": "COMPLETED"}
        task.status = "PENDING"

        task_admin.save_model(request, task, form, change=True)

        assert task.completed_at is None


@pytest.mark.django_db
class TestTaskStatusHistoryAdmin:
    """Test TaskStatusHistoryAdmin customizations"""

    def test_old_status_badge_initial(self, task_status_history_admin, task, admin_user):
        """Test old_status_badge for initial status (None)"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status=None,
            new_status="PENDING",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.old_status_badge(history)
        assert "Initial" in badge
        assert "#6c757d" in badge

    def test_old_status_badge_pending(self, task_status_history_admin, task, admin_user):
        """Test old_status_badge for PENDING status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="COMPLETED",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.old_status_badge(history)
        assert "Pending" in badge
        assert "#6c757d" in badge

    def test_old_status_badge_completed(self, task_status_history_admin, task, admin_user):
        """Test old_status_badge for COMPLETED status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="COMPLETED",
            new_status="PENDING",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.old_status_badge(history)
        assert "Completed" in badge
        assert "#28a745" in badge

    def test_new_status_badge_pending(self, task_status_history_admin, task, admin_user):
        """Test new_status_badge for PENDING status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status=None,
            new_status="PENDING",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.new_status_badge(history)
        assert "Pending" in badge
        assert "#6c757d" in badge

    def test_new_status_badge_completed(self, task_status_history_admin, task, admin_user):
        """Test new_status_badge for COMPLETED status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="COMPLETED",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.new_status_badge(history)
        assert "Completed" in badge
        assert "#28a745" in badge

    def test_new_status_badge_stuck(self, task_status_history_admin, task, admin_user):
        """Test new_status_badge for STUCK status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="STUCK",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.new_status_badge(history)
        assert "Stuck" in badge
        assert "#dc3545" in badge

    def test_new_status_badge_need_founder(self, task_status_history_admin, task, admin_user):
        """Test new_status_badge for NEED_FOUNDER status"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="NEED_FOUNDER",
            changed_by=admin_user,
        )
        badge = task_status_history_admin.new_status_badge(history)
        assert "Need Founder" in badge
        assert "#e83e8c" in badge


@pytest.mark.django_db
class TestTaskNotificationAdmin:
    """Test TaskNotificationAdmin customizations"""

    def test_message_preview_short(self, task_notification_admin, task, regular_user):
        """Test message_preview for short message"""
        notification = TaskNotification.objects.create(
            user=regular_user,
            task=task,
            message="Short message",
        )
        preview = task_notification_admin.message_preview(notification)
        assert preview == "Short message"

    def test_message_preview_long(self, task_notification_admin, task, regular_user):
        """Test message_preview for long message (truncated)"""
        long_message = "A" * 100
        notification = TaskNotification.objects.create(
            user=regular_user,
            task=task,
            message=long_message,
        )
        preview = task_notification_admin.message_preview(notification)
        assert len(preview) == 53  # 50 chars + "..."
        assert preview.endswith("...")
