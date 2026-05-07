"""
Task Management System - Analytics Tests

Tests for TaskAnalytics class covering department reports,
individual performance, business metrics, and bottleneck identification.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task
from tasks.analytics import TaskAnalytics
from users.models import User
from core.models import Company


@pytest.mark.django_db
class TestTaskAnalytics:
    """Test TaskAnalytics reporting functionality"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company", display_name="Test Co")

    @pytest.fixture
    def users(self, company):
        """Create multiple users for testing"""
        return {
            "user1": User.objects.create(
                username="user_one",
                email="user1@test.com",
                name="User One",
                company=company,
                department="PRODUCTION",
            ),
            "user2": User.objects.create(
                username="user_two",
                email="user2@test.com",
                name="User Two",
                company=company,
                department="PRODUCTION",
            ),
            "user3": User.objects.create(
                username="user_three",
                email="user3@test.com",
                name="User Three",
                company=company,
                department="ACCOUNTS",
            ),
        }

    @pytest.fixture
    def tasks(self, company, users):
        """Create sample tasks for testing"""
        today = timezone.now().date()

        # Production tasks
        Task.objects.create(
            company=company,
            title="Prod Task 1",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="COMPLETED",
            completed_at=timezone.now(),
        )
        Task.objects.create(
            company=company,
            title="Prod Task 2",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user2"],
            created_by=users["user1"],
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="Prod Task 3",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="STUCK",
        )

        # Accounts tasks
        Task.objects.create(
            company=company,
            title="Accounts Task 1",
            description="Test",
            deadline=today + timedelta(days=7),
            department="ACCOUNTS",
            assigned_to=users["user3"],
            created_by=users["user3"],
            status="COMPLETED",
            completed_at=timezone.now(),
        )
        Task.objects.create(
            company=company,
            title="Accounts Task 2",
            description="Test",
            deadline=today + timedelta(days=7),
            department="ACCOUNTS",
            assigned_to=users["user3"],
            created_by=users["user3"],
            status="COMPLETED",
            completed_at=timezone.now(),
        )

    def test_department_completion_stats(self, company, tasks):
        """Test department completion statistics"""
        analytics = TaskAnalytics(company=company)
        stats = analytics.department_completion_stats()

        assert "PRODUCTION" in stats
        assert "ACCOUNTS" in stats

        # Production: 1 completed, 1 pending, 1 stuck = 3 total
        assert stats["PRODUCTION"]["total"] == 3
        assert stats["PRODUCTION"]["completed"] == 1
        assert stats["PRODUCTION"]["pending"] == 1
        assert stats["PRODUCTION"]["stuck"] == 1

        # Accounts: 2 completed = 2 total
        assert stats["ACCOUNTS"]["total"] == 2
        assert stats["ACCOUNTS"]["completed"] == 2
        assert stats["ACCOUNTS"]["completion_rate"] == 100.0

    def test_daily_completion_by_department(self, company, tasks):
        """Test daily completion tracking"""
        analytics = TaskAnalytics(company=company)
        daily_stats = analytics.daily_completion_by_department()

        assert len(daily_stats) > 0
        # Should have completion data for today
        today_stats = [s for s in daily_stats if s["date"] == timezone.now().date()]
        assert len(today_stats) > 0

    def test_bottleneck_identification(self, company, tasks):
        """Test bottleneck identification"""
        analytics = TaskAnalytics(company=company)
        bottlenecks = analytics.bottleneck_identification(limit=5)

        # Should identify stuck and pending tasks
        assert len(bottlenecks) >= 2

        # Check bottleneck structure
        for bottleneck in bottlenecks:
            assert "id" in bottleneck
            assert "title" in bottleneck
            assert "department" in bottleneck
            assert "status" in bottleneck
            assert "days_stuck" in bottleneck

    def test_department_bottleneck_summary(self, company, tasks):
        """Test department bottleneck summary"""
        analytics = TaskAnalytics(company=company)
        summary = analytics.department_bottleneck_summary()

        assert "PRODUCTION" in summary
        # Production has 1 pending + 1 stuck = 2 non-completed
        assert summary["PRODUCTION"]["stuck_count"] == 2
        assert summary["PRODUCTION"]["avg_days_stuck"] >= 0

    def test_individual_performance(self, company, users, tasks):
        """Test individual performance metrics"""
        analytics = TaskAnalytics(company=company)
        performance = analytics.individual_performance()

        assert len(performance) == 3  # 3 users

        # Find User One's performance
        user1_perf = next(p for p in performance if p["name"] == "User One")
        assert user1_perf["total_tasks"] == 2  # 1 completed, 1 stuck
        assert user1_perf["completed"] == 1
        assert user1_perf["completion_rate"] == 50.0

        # Find User Three's performance
        user3_perf = next(p for p in performance if p["name"] == "User Three")
        assert user3_perf["total_tasks"] == 2
        assert user3_perf["completed"] == 2
        assert user3_perf["completion_rate"] == 100.0

    def test_order_to_delivery_timeline(self, company, tasks):
        """Test order-to-delivery timeline calculation"""
        analytics = TaskAnalytics(company=company)
        timeline = analytics.order_to_delivery_timeline()

        assert "avg_days" in timeline
        assert "min_days" in timeline
        assert "max_days" in timeline
        assert "total_orders" in timeline

        # Should have at least 1 completed production task
        assert timeline["total_orders"] >= 1

    def test_resource_utilization(self, company, tasks):
        """Test resource utilization calculation"""
        analytics = TaskAnalytics(company=company)
        utilization = analytics.resource_utilization()

        assert len(utilization) > 0

        for dept in utilization:
            assert "department" in dept
            assert "active_tasks" in dept
            assert "user_count" in dept
            assert "tasks_per_user" in dept
            assert "utilization_level" in dept
            assert dept["utilization_level"] in ["LOW", "MEDIUM", "HIGH"]

    def test_productivity_trends(self, company, tasks):
        """Test productivity trends"""
        analytics = TaskAnalytics(company=company)
        trends = analytics.productivity_trends(period="daily")

        assert len(trends) > 0
        for trend in trends:
            assert "period" in trend
            assert "completed" in trend

    def test_urgency_distribution(self, company, users):
        """Test urgency distribution"""
        today = timezone.now().date()

        # Create tasks with different urgencies
        Task.objects.create(
            company=company,
            title="Urgent Task",
            description="Test",
            deadline=today + timedelta(days=1),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            urgency="URGENT",
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="High Task",
            description="Test",
            deadline=today + timedelta(days=3),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            urgency="HIGH",
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="Medium Task",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            urgency="MEDIUM",
            status="PENDING",
        )

        analytics = TaskAnalytics(company=company)
        distribution = analytics.urgency_distribution()

        assert distribution.get("URGENT", 0) == 1
        assert distribution.get("HIGH", 0) == 1
        assert distribution.get("MEDIUM", 0) == 1

    def test_overdue_tasks_summary(self, company, users):
        """Test overdue tasks summary"""
        today = timezone.now().date()

        # Create overdue tasks
        Task.objects.create(
            company=company,
            title="Overdue Task 1",
            description="Test",
            deadline=today - timedelta(days=5),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="PENDING",
        )
        Task.objects.create(
            company=company,
            title="Overdue Task 2",
            description="Test",
            deadline=today - timedelta(days=3),
            department="ACCOUNTS",
            assigned_to=users["user3"],
            created_by=users["user3"],
            status="STUCK",
        )

        analytics = TaskAnalytics(company=company)
        summary = analytics.overdue_tasks_summary()

        assert summary["total_overdue"] == 2
        assert summary["avg_days_overdue"] > 0
        assert "PRODUCTION" in summary["by_department"]
        assert "ACCOUNTS" in summary["by_department"]

    def test_get_dashboard_summary(self, company, tasks):
        """Test comprehensive dashboard summary"""
        analytics = TaskAnalytics(company=company)
        summary = analytics.get_dashboard_summary()

        # Check all required sections
        assert "department_stats" in summary
        assert "bottlenecks" in summary
        assert "individual_performance" in summary
        assert "resource_utilization" in summary
        assert "productivity_trends" in summary
        assert "urgency_distribution" in summary
        assert "overdue_summary" in summary
        assert "order_timeline" in summary
        assert "date_range" in summary

    def test_user_task_timeline(self, company, users, tasks):
        """Test user task timeline"""
        analytics = TaskAnalytics(company=company)
        timeline = analytics.user_task_timeline(user_id=users["user1"].id)

        # Should have completion data for user1
        assert isinstance(timeline, list)

    def test_date_range_filtering(self, company):
        """Test analytics with custom date range"""
        today = timezone.now().date()

        # Create a fresh user for this test to avoid fixture interference
        test_user = User.objects.create(
            username="date_range_test_user",
            email="daterange@test.com",
            name="Date Range User",
            company=company,
            department="PRODUCTION",
        )

        # Clear any existing tasks for this company
        Task.objects.filter(company=company).delete()

        # Create task in the past (outside 30-day window)
        old_task = Task.objects.create(
            company=company,
            title="Old Task",
            description="Test",
            deadline=today - timedelta(days=60),
            department="PRODUCTION",
            assigned_to=test_user,
            created_by=test_user,
            status="COMPLETED",
            completed_at=timezone.now() - timedelta(days=60),
        )
        # Manually set created_at to the past (can't do in create() due to auto_now_add)
        old_task.created_at = timezone.now() - timedelta(days=65)
        old_task.save(update_fields=["created_at"])

        # Create recent task (within 30-day window)
        Task.objects.create(
            company=company,
            title="Recent Task",
            description="Test",
            deadline=today,
            department="PRODUCTION",
            assigned_to=test_user,
            created_by=test_user,
            status="COMPLETED",
            completed_at=timezone.now(),
        )

        # Analytics for last 30 days should only include recent task
        analytics = TaskAnalytics(
            company=company, date_from=today - timedelta(days=30), date_to=today
        )
        stats = analytics.department_completion_stats()

        # Should only count recent task
        assert stats["PRODUCTION"]["total"] == 1
