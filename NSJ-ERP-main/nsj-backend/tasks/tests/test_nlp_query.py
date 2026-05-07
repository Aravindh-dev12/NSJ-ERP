"""
Task Management System - NLP Query Tests

Tests for NLPQueryProcessor covering intent detection,
natural language understanding, and query processing for tasks, orders, and queries.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task
from tasks.nlp_query import NLPQueryProcessor
from users.models import User
from core.models import Company


@pytest.mark.django_db
class TestNLPQueryProcessor:
    """Test NLP query processing and intent detection"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company", display_name="Test Co")

    @pytest.fixture
    def users(self, company):
        """Create users for testing"""
        return {
            "user1": User.objects.create(
                username="alice_nlp",
                email="user1@test.com",
                name="Alice",
                company=company,
                department="PRODUCTION",
            ),
            "user2": User.objects.create(
                username="bob_nlp",
                email="user2@test.com",
                name="Bob",
                company=company,
                department="PRODUCTION",
            ),
            "user3": User.objects.create(
                username="charlie_nlp",
                email="user3@test.com",
                name="Charlie",
                company=company,
                department="ACCOUNTS",
            ),
        }

    @pytest.fixture
    def tasks(self, company, users):
        """Create sample tasks"""
        today = timezone.now().date()

        # Alice: 3 completed, 1 pending
        for i in range(3):
            Task.objects.create(
                company=company,
                title=f"Alice Task {i + 1}",
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
            title="Alice Pending",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="PENDING",
        )

        # Bob: 1 completed, 2 pending
        Task.objects.create(
            company=company,
            title="Bob Task",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user2"],
            created_by=users["user2"],
            status="COMPLETED",
            completed_at=timezone.now(),
        )
        for i in range(2):
            Task.objects.create(
                company=company,
                title=f"Bob Pending {i + 1}",
                description="Test",
                deadline=today + timedelta(days=7),
                department="PRODUCTION",
                assigned_to=users["user2"],
                created_by=users["user2"],
                status="PENDING",
            )

        # Charlie: 2 completed
        for i in range(2):
            Task.objects.create(
                company=company,
                title=f"Charlie Task {i + 1}",
                description="Test",
                deadline=today + timedelta(days=7),
                department="ACCOUNTS",
                assigned_to=users["user3"],
                created_by=users["user3"],
                status="COMPLETED",
                completed_at=timezone.now(),
            )

        # Stuck task
        Task.objects.create(
            company=company,
            title="Stuck Task",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="STUCK",
        )

        # Overdue task
        Task.objects.create(
            company=company,
            title="Overdue Task",
            description="Test",
            deadline=today - timedelta(days=3),
            department="PRODUCTION",
            assigned_to=users["user2"],
            created_by=users["user2"],
            status="PENDING",
        )

    def test_who_completed_most_tasks(self, company, tasks):
        """Test 'who completed most tasks' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "who completed most tasks",
            "who finished the most tasks",
            "best performer",
            "top performer",
            "who is doing best",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "top_performer"
            assert "Alice" in result["answer"]  # Alice has 3 completed
            assert result["data"][0]["name"] == "Alice"
            assert result["data"][0]["completed"] == 3

    def test_total_tasks_query(self, company, tasks):
        """Test 'how many tasks' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "how many tasks",
            "total tasks",
            "count of tasks",
            "number of tasks",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "task_count"
            assert result["data"]["total"] == 11  # Total tasks created

    def test_pending_tasks_query(self, company, tasks):
        """Test 'pending tasks' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "pending tasks",
            "incomplete tasks",
            "tasks not done",
            "open tasks",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "pending_tasks"
            assert result["data"]["count"] == 4  # 1 Alice + 2 Bob + 1 overdue

    def test_completed_tasks_query(self, company, tasks):
        """Test 'completed tasks' query"""
        processor = NLPQueryProcessor(company=company)

        result = processor.process_query("completed tasks")
        assert result["success"] is True
        assert result["query_type"] == "completed_tasks"
        assert result["data"]["count"] == 6  # 3 Alice + 1 Bob + 2 Charlie

    def test_stuck_tasks_query(self, company, tasks):
        """Test 'stuck tasks' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "stuck tasks",
            "blocked tasks",
            "tasks that are stuck",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "stuck_tasks"
            assert result["data"]["count"] == 1

    def test_overdue_tasks_query(self, company, tasks):
        """Test 'overdue tasks' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "overdue tasks",
            "late tasks",
            "tasks that are overdue",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "overdue_tasks"
            assert result["data"]["count"] == 1

    def test_department_tasks_query(self, company, tasks):
        """Test 'tasks by department' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "tasks by department",
            "department wise tasks",
            "which department has most tasks",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] in ["department_tasks", "department_performance"]

    def test_most_pending_query(self, company, tasks):
        """Test 'who has most pending' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "who has the most pending",
            "who has maximum pending work",
            "highest workload",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "most_pending"
            # Bob has 3 pending (2 regular + 1 overdue)
            assert "Bob" in result["answer"]

    def test_tasks_today_query(self, company, users):
        """Test 'tasks created today' query"""
        today = timezone.now().date()

        Task.objects.create(
            company=company,
            title="Today Task",
            description="Test",
            deadline=today + timedelta(days=7),
            department="PRODUCTION",
            assigned_to=users["user1"],
            created_by=users["user1"],
            status="PENDING",
        )

        processor = NLPQueryProcessor(company=company)
        result = processor.process_query("tasks created today")

        assert result["success"] is True
        assert result["query_type"] == "tasks_today"
        assert result["data"]["count"] >= 1

    def test_completion_rate_query(self, company, tasks):
        """Test 'completion rate' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "completion rate",
            "what is the completion rate",
            "success rate",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "completion_rate"
            assert "rate" in result["data"]
            assert result["data"]["completed"] == 6
            assert result["data"]["total"] == 11

    def test_person_specific_tasks(self, company, tasks):
        """Test 'tasks for specific person' query"""
        processor = NLPQueryProcessor(company=company)

        result = processor.process_query("tasks for Alice")
        assert result["success"] is True
        assert result["query_type"] == "person_tasks"
        assert "Alice" in result["answer"]
        assert result["data"]["total"] == 5  # 3 completed + 1 pending + 1 stuck

    def test_urgent_tasks_query(self, company, users):
        """Test 'urgent tasks' query"""
        today = timezone.now().date()

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

        processor = NLPQueryProcessor(company=company)
        result = processor.process_query("urgent tasks")

        assert result["success"] is True
        assert result["query_type"] == "urgent_tasks"
        assert "URGENT" in result["data"]

    def test_summary_query(self, company, tasks):
        """Test 'summary' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "summary",
            "overview",
            "dashboard",
            "how is business doing",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "summary"
            assert "tasks" in result["data"]

    def test_help_query(self, company):
        """Test 'help' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "help",
            "what can you do",
            "how to use",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "help"
            assert "examples" in result["answer"].lower() or "help" in result["answer"].lower()

    def test_unknown_query(self, company):
        """Test unknown/unrecognized query"""
        processor = NLPQueryProcessor(company=company)

        # Use a truly random query that won't match any patterns
        result = processor.process_query("zxcvbnm asdfghjkl qwertyuiop")

        assert result["success"] is True
        assert result["query_type"] == "unknown"
        assert "suggest" in result["answer"].lower() or "ask" in result["answer"].lower()

    def test_intent_detection_variations(self, company, tasks):
        """Test that intent detection handles variations correctly"""
        processor = NLPQueryProcessor(company=company)

        # All these should detect 'top_performer' intent
        variations = [
            "who completed most",
            "who finished maximum tasks",
            "best employee",
            "top worker",
            "star performer",
            "who is doing great",
        ]

        for query in variations:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "top_performer"

    def test_case_insensitive_queries(self, company, tasks):
        """Test that queries are case-insensitive"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "WHO COMPLETED MOST TASKS",
            "How Many Tasks",
            "PENDING TASKS",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True

    def test_fallback_intent_detection(self, company, tasks):
        """Test fallback intent detection based on keywords"""
        processor = NLPQueryProcessor(company=company)

        # Query with task keywords but no exact pattern match
        result = processor.process_query("show me all the tasks that are pending")

        assert result["success"] is True
        # Should detect some task-related intent
        assert result["query_type"] in ["pending_tasks", "task_count"]

    def test_empty_query(self, company):
        """Test handling of empty query"""
        processor = NLPQueryProcessor(company=company)

        result = processor.process_query("")

        # Should handle gracefully
        assert result["success"] is True

    def test_query_with_special_characters(self, company, tasks):
        """Test queries with special characters"""
        processor = NLPQueryProcessor(company=company)

        result = processor.process_query("who completed most tasks?!!")

        assert result["success"] is True
        assert result["query_type"] == "top_performer"


@pytest.mark.django_db
class TestNLPOrderQueries:
    """Test NLP queries related to orders"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    def test_total_orders_query(self, company):
        """Test 'how many orders' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "how many orders",
            "total orders",
            "count of orders",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "total_orders"


@pytest.mark.django_db
class TestNLPQueryQueries:
    """Test NLP queries related to customer queries"""

    @pytest.fixture
    def company(self):
        return Company.objects.create(name="Test Company")

    def test_total_queries_query(self, company):
        """Test 'how many queries' query"""
        processor = NLPQueryProcessor(company=company)

        queries = [
            "how many queries",
            "total customer queries",
            "count of inquiries",
        ]

        for query in queries:
            result = processor.process_query(query)
            assert result["success"] is True
            assert result["query_type"] == "total_queries"

    def test_pending_queries_query(self, company):
        """Test 'pending queries' query"""
        processor = NLPQueryProcessor(company=company)

        result = processor.process_query("pending queries")

        assert result["success"] is True
        assert result["query_type"] == "pending_queries"
