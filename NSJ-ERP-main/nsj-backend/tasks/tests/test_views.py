"""
Task Management System - View Tests

Tests for TaskViewSet endpoints including CRUD operations, filtering,
role-based access control, and analytics endpoints.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from tasks.models import Task, TaskNotification, TaskStatusHistory
from users.models import User
from core.models import Company


@pytest.mark.django_db
class TestTaskViewSet:
    """Test TaskViewSet CRUD operations"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company", display_name="Test Co")

    @pytest.fixture
    def founder(self, company):
        return User.objects.create(
            username="founder_user",
            email="founder@test.com",
            name="Founder User",
            company=company,
            task_role="FOUNDER",
            department="FOUNDER",
        )

    @pytest.fixture
    def niti_user(self, company):
        """Create Niti user for hardcoded ID mapping"""
        return User.objects.create(
            username="niti_user",
            email="niti@nsj.com",
            name="Niti",
            company=company,
            task_role="FOUNDER",
            department="FOUNDER",
        )

    @pytest.fixture
    def dept_head(self, company):
        return User.objects.create(
            username="dept_head_user",
            email="depthead@test.com",
            name="Dept Head",
            company=company,
            task_role="DEPT_HEAD",
            department="PRODUCTION",
        )

    @pytest.fixture
    def individual(self, company):
        return User.objects.create(
            username="individual_user",
            email="individual@test.com",
            name="Individual User",
            company=company,
            task_role="INDIVIDUAL",
            department="PRODUCTION",
        )

    @pytest.fixture
    def client(self):
        return APIClient()

    def test_list_tasks_as_founder(self, client, company, founder):
        """Founder should see all tasks"""
        # Create tasks
        Task.objects.create(
            company=company,
            title="Task 1",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
        )
        Task.objects.create(
            company=company,
            title="Task 2",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="ACCOUNTS",
            assigned_to=founder,
            created_by=founder,
        )

        # Simulate founder user
        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 2

    def test_list_tasks_as_dept_head(self, client, company, dept_head, founder):
        """Dept head should only see tasks in their department"""
        # Create tasks in different departments
        Task.objects.create(
            company=company,
            title="Production Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=dept_head,
            created_by=founder,
        )
        Task.objects.create(
            company=company,
            title="Accounts Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="ACCOUNTS",
            assigned_to=founder,
            created_by=founder,
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(dept_head.id))
        response = client.get("/api/tasks/")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 1
        assert data[0]["department"] == "PRODUCTION"

    def test_list_tasks_as_individual(self, client, company, individual, founder):
        """Individual should only see their own tasks"""
        # Create tasks
        Task.objects.create(
            company=company,
            title="My Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=individual,
            created_by=founder,
        )
        Task.objects.create(
            company=company,
            title="Other Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(individual.id))
        response = client.get("/api/tasks/")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 1
        assert data[0]["title"] == "My Task"

    def test_create_task(self, client, company, founder, niti_user):
        """Test creating a new task"""
        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))

        data = {
            "title": "New Task",
            "description": "Test description",
            "deadline": (timezone.now().date() + timedelta(days=7)).isoformat(),
            "urgency": "HIGH",
            "department": "PRODUCTION",
            "assigned_to": "1",
        }

        response = client.post("/api/tasks/", data, format="json")

        assert response.status_code == 201
        assert response.data["title"] == "New Task"
        assert Task.objects.count() == 1

    def test_update_task_status(self, client, company, founder):
        """Test updating task status"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.patch(
            f"/api/tasks/{task.id}/update_status/", {"status": "COMPLETED"}, format="json"
        )

        assert response.status_code == 200
        task.refresh_from_db()
        assert task.status == "COMPLETED"

    def test_filter_tasks_by_status(self, client, company, founder):
        """Test filtering tasks by status"""
        Task.objects.create(
            company=company,
            title="Pending Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="Completed Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="COMPLETED",
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/?status=PENDING")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 1
        assert data[0]["status"] == "PENDING"

    def test_filter_tasks_by_department(self, client, company, founder):
        """Test filtering tasks by department"""
        Task.objects.create(
            company=company,
            title="Production Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
        )
        Task.objects.create(
            company=company,
            title="Accounts Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="ACCOUNTS",
            assigned_to=founder,
            created_by=founder,
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/?department=PRODUCTION")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 1
        assert data[0]["department"] == "PRODUCTION"

    def test_get_task_stats(self, client, company, founder):
        """Test getting task statistics"""
        Task.objects.create(
            company=company,
            title="Pending Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="Completed Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="COMPLETED",
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/stats/")

        assert response.status_code == 200
        assert response.data["visible_pending"] == 1
        assert response.data["visible_completed"] == 1
        assert response.data["visible_total"] == 2

    def test_get_filter_options(self, client, company, founder):
        """Test getting filter options"""
        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/filter_options/")

        assert response.status_code == 200
        assert "users" in response.data
        assert "departments" in response.data
        assert "statuses" in response.data
        assert "urgencies" in response.data
        assert response.data["is_founder"] is True

    def test_get_current_user_info(self, client, company, founder):
        """Test getting current user info"""
        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/current_user_info/")

        assert response.status_code == 200
        assert response.data["name"] == "Founder User"
        assert response.data["task_role"] == "FOUNDER"
        assert response.data["can_view_all_tasks"] is True

    def test_get_status_history(self, client, company, founder):
        """Test getting task status history"""
        task = Task.objects.create(
            company=company,
            title="Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )

        # Create status history
        TaskStatusHistory.objects.create(
            task=task, old_status=None, new_status="PENDING", changed_by=founder
        )
        TaskStatusHistory.objects.create(
            task=task, old_status="PENDING", new_status="COMPLETED", changed_by=founder
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get(f"/api/tasks/{task.id}/status_history/")

        assert response.status_code == 200
        # Signal creates one history entry on task creation, plus our 2 manual entries
        assert len(response.data) >= 2

    def test_overdue_tasks_filter(self, client, company, founder):
        """Test filtering overdue tasks"""
        # Create overdue task
        Task.objects.create(
            company=company,
            title="Overdue Task",
            description="Test",
            deadline=timezone.now().date() - timedelta(days=1),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )
        # Create future task
        Task.objects.create(
            company=company,
            title="Future Task",
            description="Test",
            deadline=timezone.now().date() + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=founder,
            created_by=founder,
            status="PENDING",
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(founder.id))
        response = client.get("/api/tasks/?overdue=true")

        assert response.status_code == 200
        data = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(data) == 1
        assert data[0]["title"] == "Overdue Task"


@pytest.mark.django_db
class TestTaskNotifications:
    """Test task notification endpoints"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    @pytest.fixture
    def user(self, company):
        return User.objects.create(
            username="test_user", email="user@test.com", name="Test User", company=company
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

    @pytest.fixture
    def client(self):
        return APIClient()

    def test_get_notifications(self, client, user, task):
        """Test getting user notifications"""
        TaskNotification.objects.create(
            user=user, task=task, message="Test notification", is_read=False
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(user.id))
        response = client.get("/api/tasks/notifications/")

        assert response.status_code == 200
        assert len(response.data) >= 1  # At least our notification
        # Find our notification in the results
        our_notif = next((n for n in response.data if n["message"] == "Test notification"), None)
        assert our_notif is not None

    def test_mark_notifications_read(self, client, user, task):
        """Test marking notifications as read"""
        notif = TaskNotification.objects.create(
            user=user, task=task, message="Test notification", is_read=False
        )

        client.credentials(HTTP_X_SIMULATED_USER_ID=str(user.id))
        response = client.post(
            "/api/tasks/mark_notifications_read/",
            {"notification_ids": [str(notif.id)]},
            format="json",
        )

        assert response.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read is True
