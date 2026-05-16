"""
Comprehensive tests for tasks/serializers.py
Tests serializer validation, field transformations, and business logic.
"""

import pytest
from datetime import timedelta
from django.utils import timezone
from django.test import RequestFactory
from tasks.serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusUpdateSerializer,
    TaskStatusHistorySerializer,
    TaskNotificationSerializer,
    UserMinimalSerializer,
    convert_hardcoded_ids_to_users,
    convert_hardcoded_id_to_user,
)
from tasks.models import Task, TaskStatusHistory, TaskNotification
from users.models import User
from core.models import Company


@pytest.fixture
def company(db):
    """Create a test company"""
    return Company.objects.create(name="Test Company", display_name="Test Company")


@pytest.fixture
def user(db, company):
    """Create a test user"""
    return User.objects.create(
        name="Test User",
        email="test@example.com",
        username="testuser",
        company=company,
        role="EMPLOYEE",
        task_role="INDIVIDUAL",
        department="PRODUCTION",
    )


@pytest.fixture
def admin_user(db, company):
    """Create an admin user"""
    return User.objects.create(
        name="Admin User",
        email="admin@example.com",
        username="adminuser",
        company=company,
        role="ADMIN",
        task_role="FOUNDER",
    )


@pytest.fixture
def task(db, company, user, admin_user):
    """Create a test task"""
    return Task.objects.create(
        title="Test Task",
        description="Test Description",
        company=company,
        created_by=admin_user,
        assigned_to=user,
        department="PRODUCTION",
        urgency="MEDIUM",
        status="PENDING",
        deadline=timezone.now().date() + timedelta(days=7),
    )


@pytest.mark.django_db
class TestUserMinimalSerializer:
    """Test UserMinimalSerializer"""

    def test_serialize_user(self, user):
        """Test basic user serialization"""
        serializer = UserMinimalSerializer(user)
        data = serializer.data

        assert data["id"] == str(user.id)
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"

    def test_serialize_multiple_users(self, user, admin_user):
        """Test serializing multiple users"""
        serializer = UserMinimalSerializer([user, admin_user], many=True)
        data = serializer.data

        assert len(data) == 2
        assert data[0]["name"] == "Test User"
        assert data[1]["name"] == "Admin User"


@pytest.mark.django_db
class TestTaskSerializer:
    """Test TaskSerializer"""

    def test_serialize_task(self, task):
        """Test basic task serialization"""
        serializer = TaskSerializer(task)
        data = serializer.data

        assert data["title"] == "Test Task"
        assert data["description"] == "Test Description"
        assert data["status"] == "PENDING"
        assert data["status_display"] == "Pending"
        assert data["urgency"] == "MEDIUM"
        assert data["urgency_display"] == "Medium"

    def test_assigned_to_details(self, task):
        """Test assigned_to_details nested serialization"""
        serializer = TaskSerializer(task)
        data = serializer.data

        assert "assigned_to_details" in data
        assert data["assigned_to_details"]["name"] == "Test User"

    def test_created_by_details(self, task):
        """Test created_by_details nested serialization"""
        serializer = TaskSerializer(task)
        data = serializer.data

        assert "created_by_details" in data
        assert data["created_by_details"]["name"] == "Admin User"

    def test_is_overdue_false_for_future_deadline(self, task):
        """Test is_overdue is False for future deadline"""
        task.deadline = timezone.now().date() + timedelta(days=7)
        task.save()

        serializer = TaskSerializer(task)
        assert serializer.data["is_overdue"] is False

    def test_is_overdue_true_for_past_deadline(self, task):
        """Test is_overdue is True for past deadline"""
        task.deadline = timezone.now().date() - timedelta(days=1)
        task.save()

        serializer = TaskSerializer(task)
        assert serializer.data["is_overdue"] is True

    def test_is_overdue_false_for_completed_task(self, task):
        """Test is_overdue is False for completed tasks regardless of deadline"""
        task.deadline = timezone.now().date() - timedelta(days=1)
        task.status = "COMPLETED"
        task.save()

        serializer = TaskSerializer(task)
        assert serializer.data["is_overdue"] is False

    def test_assigned_person_name_with_user(self, task):
        """Test assigned_person_name returns user name"""
        serializer = TaskSerializer(task)
        assert serializer.data["assigned_person_name"] == "Test User"

    def test_assigned_person_name_with_name_only(self, task):
        """Test assigned_person_name returns assigned_to_name when no user"""
        task.assigned_to = None
        task.assigned_to_name = "External Person"
        task.save()

        serializer = TaskSerializer(task)
        assert serializer.data["assigned_person_name"] == "External Person"

    def test_assigned_person_name_unassigned(self, task):
        """Test assigned_person_name returns 'Unassigned' when no assignment"""
        task.assigned_to = None
        task.assigned_to_name = None
        task.save()

        serializer = TaskSerializer(task)
        assert serializer.data["assigned_person_name"] == "Unassigned"

    def test_completion_proof_url(self, task):
        """Test completion_proof_url with request context"""
        factory = RequestFactory()
        request = factory.get("/")

        serializer = TaskSerializer(task, context={"request": request})
        # Should be None when no proof uploaded
        assert serializer.data["completion_proof_url"] is None


@pytest.mark.django_db
class TestTaskCreateSerializer:
    """Test TaskCreateSerializer"""

    def test_create_task_minimal(self, company, admin_user):
        """Test creating task with minimal required fields"""
        data = {
            "title": "New Task",
            "description": "New Description",
            "deadline": (timezone.now().date() + timedelta(days=5)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
        }

        factory = RequestFactory()
        request = factory.post("/")
        request.user = admin_user

        serializer = TaskCreateSerializer(data=data, context={"request": request})
        assert serializer.is_valid(), serializer.errors

        task = serializer.save()
        assert task.title == "New Task"
        assert task.created_by == admin_user
        assert task.company == company

    def test_validate_title_empty(self):
        """Test validation fails for empty title"""
        data = {
            "title": "   ",
            "deadline": (timezone.now().date() + timedelta(days=5)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
        }

        serializer = TaskCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "title" in serializer.errors

    def test_validate_deadline_past(self):
        """Test validation fails for past deadline"""
        data = {
            "title": "Test Task",
            "deadline": (timezone.now().date() - timedelta(days=1)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
        }

        serializer = TaskCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "deadline" in serializer.errors

    def test_create_task_with_assignees(self, company, admin_user, user):
        """Test creating task with multiple assignees"""
        # Create a user named "Niti" for hardcoded ID mapping
        niti = User.objects.create(
            name="Niti",
            email="niti@test.com",
            username="niti",
            company=company,
            role="ADMIN",
        )

        data = {
            "title": "Multi-Assignee Task",
            "description": "Test",
            "deadline": (timezone.now().date() + timedelta(days=5)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
            "assignees": ["1"],  # Hardcoded ID for "Niti"
        }

        factory = RequestFactory()
        request = factory.post("/")
        request.user = admin_user

        serializer = TaskCreateSerializer(data=data, context={"request": request})
        assert serializer.is_valid(), serializer.errors

        task = serializer.save()
        assert task.assignees.count() == 1
        assert niti in task.assignees.all()

    def test_validate_assignees_nonexistent(self):
        """Test validation fails for non-existent assignees"""
        data = {
            "title": "Test Task",
            "deadline": (timezone.now().date() + timedelta(days=5)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
            "assignees": ["999"],  # Non-existent hardcoded ID
        }

        serializer = TaskCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "assignees" in serializer.errors


@pytest.mark.django_db
class TestTaskUpdateSerializer:
    """Test TaskUpdateSerializer"""

    def test_update_task_title(self, task, admin_user):
        """Test updating task title"""
        data = {"title": "Updated Title"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = admin_user

        serializer = TaskUpdateSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        assert serializer.is_valid(), serializer.errors

        updated_task = serializer.save()
        assert updated_task.title == "Updated Title"

    def test_update_status_creates_history(self, task, admin_user):
        """Test updating status creates history entry"""
        data = {"status": "COMPLETED"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = admin_user

        serializer = TaskUpdateSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        assert serializer.is_valid()

        updated_task = serializer.save()
        assert updated_task.status == "COMPLETED"

        # Check history was created
        history = TaskStatusHistory.objects.filter(task=task).first()
        assert history is not None
        assert history.old_status == "PENDING"
        assert history.new_status == "COMPLETED"

    def test_update_status_to_completed_sets_timestamp(self, task, admin_user):
        """Test updating to COMPLETED sets completed_at"""
        data = {"status": "COMPLETED"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = admin_user

        serializer = TaskUpdateSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        assert serializer.is_valid()

        updated_task = serializer.save()
        assert updated_task.completed_at is not None

    def test_update_status_from_completed_clears_timestamp(self, task, admin_user):
        """Test updating from COMPLETED clears completed_at"""
        task.status = "COMPLETED"
        task.completed_at = timezone.now()
        task.save()

        data = {"status": "PENDING"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = admin_user

        serializer = TaskUpdateSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        assert serializer.is_valid()

        updated_task = serializer.save()
        assert updated_task.completed_at is None

    def test_update_to_need_founder_notifies_admins(self, task, admin_user, company):
        """Test updating to NEED_FOUNDER creates admin notifications"""
        data = {"status": "NEED_FOUNDER"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = task.assigned_to  # Not admin

        serializer = TaskUpdateSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        assert serializer.is_valid()

        serializer.save()

        # Check admin notification was created
        notification = TaskNotification.objects.filter(user=admin_user, task=task).first()
        assert notification is not None
        assert "needs founder intervention" in notification.message.lower()


@pytest.mark.django_db
class TestTaskStatusUpdateSerializer:
    """Test TaskStatusUpdateSerializer"""

    def test_update_status_with_notes(self, task, admin_user):
        """Test updating status with notes creates history"""
        data = {"status": "STUCK", "notes": "Blocked by external dependency"}

        factory = RequestFactory()
        request = factory.patch("/")
        request.user = admin_user

        serializer = TaskStatusUpdateSerializer(task, data=data, context={"request": request})
        assert serializer.is_valid()

        updated_task = serializer.save()
        assert updated_task.status == "STUCK"

        # Check history was created with the status change
        history = TaskStatusHistory.objects.filter(task=task, new_status="STUCK").first()
        assert history is not None
        assert history.old_status == "PENDING"
        assert history.new_status == "STUCK"

    def test_validate_status_invalid(self, task):
        """Test validation fails for invalid status"""
        data = {"status": "INVALID_STATUS"}

        serializer = TaskStatusUpdateSerializer(task, data=data)
        assert not serializer.is_valid()
        assert "status" in serializer.errors

    def test_validate_completion_proof_required(self, task):
        """Test validation fails when completion proof required but not provided"""
        task.requires_completion_proof = True
        task.save()

        data = {"status": "COMPLETED"}

        serializer = TaskStatusUpdateSerializer(task, data=data)
        assert not serializer.is_valid()
        assert "completion_proof" in serializer.errors

    def test_completion_proof_not_required_when_already_uploaded(self, task):
        """Test validation passes when proof already exists"""
        task.requires_completion_proof = True
        task.completion_proof = "path/to/proof.jpg"
        task.save()

        data = {"status": "COMPLETED"}

        serializer = TaskStatusUpdateSerializer(task, data=data)
        assert serializer.is_valid()


@pytest.mark.django_db
class TestTaskStatusHistorySerializer:
    """Test TaskStatusHistorySerializer"""

    def test_serialize_status_history(self, task, admin_user):
        """Test basic status history serialization"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status="PENDING",
            new_status="COMPLETED",
            changed_by=admin_user,
            notes="Task completed successfully",
        )

        serializer = TaskStatusHistorySerializer(history)
        data = serializer.data

        assert data["old_status"] == "PENDING"
        assert data["old_status_display"] == "Pending"
        assert data["new_status"] == "COMPLETED"
        assert data["new_status_display"] == "Completed"
        assert data["notes"] == "Task completed successfully"

    def test_old_status_display_initial(self, task, admin_user):
        """Test old_status_display shows 'Initial' for None"""
        history = TaskStatusHistory.objects.create(
            task=task,
            old_status=None,
            new_status="PENDING",
            changed_by=admin_user,
        )

        serializer = TaskStatusHistorySerializer(history)
        assert serializer.data["old_status_display"] == "Initial"


@pytest.mark.django_db
class TestTaskNotificationSerializer:
    """Test TaskNotificationSerializer"""

    def test_serialize_notification(self, task, user):
        """Test basic notification serialization"""
        notification = TaskNotification.objects.create(
            user=user,
            task=task,
            message="You have been assigned a new task",
        )

        serializer = TaskNotificationSerializer(notification)
        data = serializer.data

        assert data["task_title"] == "Test Task"
        assert data["task_id"] == str(task.id)
        assert data["message"] == "You have been assigned a new task"
        assert data["is_read"] is False


@pytest.mark.django_db
class TestHardcodedUserMapping:
    """Test hardcoded user ID conversion functions"""

    def test_convert_hardcoded_id_to_user(self, company):
        """Test converting hardcoded ID to user"""
        niti = User.objects.create(
            name="Niti",
            email="niti@test.com",
            username="niti",
            company=company,
        )

        user = convert_hardcoded_id_to_user("1")
        assert user == niti

    def test_convert_hardcoded_id_nonexistent(self):
        """Test converting non-existent hardcoded ID returns None"""
        user = convert_hardcoded_id_to_user("1")
        assert user is None

    def test_convert_hardcoded_id_invalid(self):
        """Test converting invalid hardcoded ID returns None"""
        user = convert_hardcoded_id_to_user("999")
        assert user is None

    def test_convert_hardcoded_ids_to_users(self, company):
        """Test converting multiple hardcoded IDs to users"""
        niti = User.objects.create(
            name="Niti",
            email="niti@test.com",
            username="niti",
            company=company,
        )
        mehul = User.objects.create(
            name="Mehul",
            email="mehul@test.com",
            username="mehul",
            company=company,
        )

        users = convert_hardcoded_ids_to_users(["1", "2"])
        assert len(users) == 2
        assert niti in users
        assert mehul in users

    def test_convert_hardcoded_ids_empty_list(self):
        """Test converting empty list returns empty queryset"""
        users = convert_hardcoded_ids_to_users([])
        assert len(users) == 0

    def test_convert_hardcoded_ids_none(self):
        """Test converting None returns empty queryset"""
        users = convert_hardcoded_ids_to_users(None)
        assert len(users) == 0
