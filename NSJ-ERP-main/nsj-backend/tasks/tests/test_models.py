"""
Task Management System - Model Tests

Tests for Task, TaskStatusHistory, and TaskNotification models.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task, TaskStatusHistory, TaskNotification
from users.models import User
from core.models import Company


@pytest.mark.django_db
class TestTaskModel:
    """Test Task model functionality"""

    @pytest.fixture
    def company(self):
        """Create a test company"""
        return Company.objects.create(name="Test Company", display_name="Test Co")

    @pytest.fixture
    def user(self, company):
        """Create a test user"""
        return User.objects.create(
            username="test_model_user",
            email="test@example.com",
            name="Test User",
            company=company,
            task_role="INDIVIDUAL",
            department="PRODUCTION",
        )

    @pytest.fixture
    def founder(self, company):
        """Create a founder user"""
        return User.objects.create(
            username="founder_model",
            email="founder@example.com",
            name="Founder",
            company=company,
            task_role="FOUNDER",
            department="FOUNDER",
        )

    def test_create_task(self, company, user):
        """Test creating a basic task"""
        task = Task.objects.create(
            company=company,
            title="Test Task",
            description="Test Description",
            deadline=timezone.now().date() + timedelta(days=7),
            urgency="MEDIUM",
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="PENDING",
        )

        assert task.title == "Test Task"
        assert task.status == "PENDING"
        assert task.urgency == "MEDIUM"
        assert task.assigned_to == user
        assert str(task) == f"Test Task - {user.name}"

    def test_task_with_sub_department(self, company, user):
        """Test task with sub-department"""
        task = Task.objects.create(
            company=company,
            title="Sub Dept Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            sub_department="VENDOR_HANDLING",
            assigned_to=user,
            created_by=user,
        )

        assert task.sub_department == "VENDOR_HANDLING"

    def test_task_with_name_assignment(self, company, user):
        """Test task assigned by name instead of FK"""
        task = Task.objects.create(
            company=company,
            title="Name Assigned Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to_name="John Doe",
            created_by=user,
        )

        assert task.assigned_to_name == "John Doe"
        assert task.assigned_to is None

    def test_task_status_choices(self, company, user):
        """Test all valid task statuses"""
        statuses = ["PENDING", "COMPLETED", "STUCK", "NEED_FOUNDER", "TRANSFERRED"]

        for status in statuses:
            task = Task.objects.create(
                company=company,
                title=f"Task {status}",
                description="Test",
                deadline=timezone.now().date() + timedelta(days=7),
                department="PRODUCTION",
                assigned_to=user,
                created_by=user,
                status=status,
            )
            assert task.status == status

    def test_task_urgency_levels(self, company, user):
        """Test all urgency levels"""
        urgencies = ["LOW", "MEDIUM", "HIGH", "URGENT"]

        for urgency in urgencies:
            task = Task.objects.create(
                company=company,
                title=f"Task {urgency}",
                description="Test",
                deadline=timezone.now().date() + timedelta(days=7),
                department="PRODUCTION",
                assigned_to=user,
                created_by=user,
                urgency=urgency,
            )
            assert task.urgency == urgency

    def test_task_with_attachment(self, company, user):
        """Test task with file attachment"""
        from django.core.files.uploadedfile import SimpleUploadedFile

        file = SimpleUploadedFile("test.txt", b"file content", content_type="text/plain")

        task = Task.objects.create(
            company=company,
            title="Task with Attachment",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            attachment=file,
        )

        assert task.attachment is not None
        assert "test" in task.attachment.name

    def test_task_completed_at_timestamp(self, company, user):
        """Test completed_at timestamp is set"""
        task = Task.objects.create(
            company=company,
            title="Completed Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
            status="COMPLETED",
            completed_at=timezone.now(),
        )

        assert task.completed_at is not None
        assert task.status == "COMPLETED"


@pytest.mark.django_db
class TestTaskStatusHistory:
    """Test TaskStatusHistory model"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    @pytest.fixture
    def user(self, company):
        return User.objects.create(
            username="history_user", email="test@example.com", name="Test User", company=company
        )

    @pytest.fixture
    def task(self, company, user):
        return Task.objects.create(
            company=company,
            title="Test Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
        )

    def test_create_status_history(self, task, user):
        """Test creating status history entry"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="COMPLETED",
            changed_by=user,
            notes="Task completed successfully",
        )

        assert history.task == task
        assert history.old_status == "PENDING"
        assert history.new_status == "COMPLETED"
        assert history.changed_by == user
        assert history.notes == "Task completed successfully"

    def test_status_history_ordering(self, task, user):
        """Test status history is ordered by changed_at descending"""
        import time

        # Clear any existing history created by signals
        TaskStatusHistory.objects.filter(task=task).delete()

        # Create multiple history entries with small delay
        history1 = TaskStatusHistory.objects.create(
            task=task, old_status=None, new_status="PENDING", changed_by=user
        )

        time.sleep(0.01)  # Small delay to ensure different timestamps

        history2 = TaskStatusHistory.objects.create(
            task=task, old_status="PENDING", new_status="COMPLETED", changed_by=user
        )

        # Get all history for task
        history = TaskStatusHistory.objects.filter(task=task)

        # Most recent should be first
        assert history.count() == 2
        assert history.first() == history2
        assert history.last() == history1


@pytest.mark.django_db
class TestTaskNotification:
    """Test TaskNotification model"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    @pytest.fixture
    def user(self, company):
        return User.objects.create(
            username="notif_user", email="test@example.com", name="Test User", company=company
        )

    @pytest.fixture
    def task(self, company, user):
        return Task.objects.create(
            company=company,
            title="Test Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=user,
            created_by=user,
        )

    def test_create_notification(self, user, task):
        """Test creating a task notification"""
        notification = TaskNotification.objects.create(
            user=user, task=task, message="You have been assigned a new task", is_read=False
        )

        assert notification.user == user
        assert notification.task == task
        assert notification.is_read is False
        assert "new task" in notification.message

    def test_mark_notification_as_read(self, user, task):
        """Test marking notification as read"""
        notification = TaskNotification.objects.create(
            user=user, task=task, message="Test notification"
        )

        assert notification.is_read is False

        notification.is_read = True
        notification.save()

        assert notification.is_read is True

    def test_notification_ordering(self, user, task):
        """Test notifications are ordered by created_at descending"""
        import time

        # Clear any existing notifications created by signals
        TaskNotification.objects.filter(user=user).delete()

        notif1 = TaskNotification.objects.create(user=user, task=task, message="First notification")

        time.sleep(0.01)  # Small delay to ensure different timestamps

        notif2 = TaskNotification.objects.create(
            user=user, task=task, message="Second notification"
        )

        notifications = TaskNotification.objects.filter(user=user)

        # Most recent should be first
        assert notifications.count() == 2
        assert notifications.first() == notif2
        assert notifications.last() == notif1
