"""
Tests for Query Model & API endpoints
"""

from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from core.models import Company, ItemNameMaster
from accounts.models import Account
from issues.models import Query

User = get_user_model()


class QueryModelTestCase(TestCase):
    """Test suite for Query model"""

    def setUp(self):
        """Set up test data"""
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
            name="Ring",
        )

    def test_query_creation(self):
        """Test creating a query"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        self.assertIsNotNone(query.id)
        self.assertEqual(query.status, "pending")
        self.assertEqual(query.account, self.account)
        self.assertEqual(query.item_name, self.item_name)

    def test_query_is_expired(self):
        """Test is_expired() method"""
        # Query that should not be expired
        future_query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        self.assertFalse(future_query.is_expired())

        # Query that should be expired
        past_query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="18K",
            gender="Man",
            size="8 inches",
            location="Downtown",
            delivery_type="Pickup",
            query_in_date=timezone.now().date() - timedelta(days=10),
            expiry_date=timezone.now().date() - timedelta(days=3),
            status="pending",
            created_by=self.user,
        )

        self.assertTrue(past_query.is_expired())

    def test_query_auto_archive_if_expired(self):
        """Test auto_archive_if_expired() method"""
        # Create an expired query
        expired_query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date() - timedelta(days=10),
            expiry_date=timezone.now().date() - timedelta(days=3),
            status="pending",
            created_by=self.user,
        )

        # Auto-archive it
        result = expired_query.auto_archive_if_expired()
        expired_query.refresh_from_db()

        self.assertTrue(result)
        self.assertEqual(expired_query.status, "archived")

    def test_query_to_dict(self):
        """Test to_dict() serialization method"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        data = query.to_dict()

        self.assertEqual(data["id"], str(query.id))
        self.assertEqual(data["status"], "pending")
        self.assertEqual(data["gold_carat"], "22K")
        self.assertIsNotNone(data["account"])
        self.assertIsNotNone(data["item_name"])


class QueryAPITestCase(TestCase):
    """Test suite for Query API endpoints"""

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
            account_name="John Doe",
            account_no="ACC001",
            group_code="CUSTOMER",
        )

        # Create item name master
        self.item_name = ItemNameMaster.objects.create(
            company=self.company,
            name="Ring",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    def test_create_query(self):
        """Test creating a query via API"""
        url = "/api/payments/queries/"
        data = {
            "account": str(self.account.id),
            "item_name": str(self.item_name.id),
            "gold_carat": "22K",
            "gender": "Woman",
            "size": "6 inches",
            "location": "Downtown",
            "delivery_type": "Home Delivery",
            "query_in_date": timezone.now().date().isoformat(),
            "expiry_date": (timezone.now().date() + timedelta(days=7)).isoformat(),
            "status": "pending",
        }

        response = self.client.post(url, data, format="json")

        # Debug output
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["gold_carat"], "22K")
        self.assertEqual(response.data["account"]["id"], str(self.account.id))

    def test_list_queries(self):
        """Test listing all queries"""
        # Create some queries
        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="18K",
            gender="Man",
            size="8 inches",
            location="Uptown",
            delivery_type="Pickup",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=14),
            status="pending",
            created_by=self.user,
        )

        url = "/api/payments/queries/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_list_queries_with_search(self):
        """Test searching queries by account name"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        url = "/api/payments/queries/?search=John"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(query.id))

    def test_list_queries_with_status_filter(self):
        """Test filtering queries by status"""
        # Create queries with different statuses
        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="18K",
            gender="Man",
            size="8 inches",
            location="Uptown",
            delivery_type="Pickup",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=14),
            status="archived",
            created_by=self.user,
        )

        url = "/api/payments/queries/?status=pending"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["status"], "pending")

    def test_get_query_detail(self):
        """Test getting a single query detail"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        url = f"/api/payments/queries/{query.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(query.id))
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["gold_carat"], "22K")

    def test_update_query(self):
        """Test updating a query"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        url = f"/api/payments/queries/{query.id}/"
        data = {
            "status": "converted_to_order",
            "location": "Midtown",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "converted_to_order")
        self.assertEqual(response.data["location"], "Midtown")

    def test_delete_query(self):
        """Test deleting a query"""
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        url = f"/api/payments/queries/{query.id}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Query.objects.filter(id=query.id).exists())

    def test_auto_archive_endpoint(self):
        """Test auto-archive endpoint"""
        # Create an expired query
        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date() - timedelta(days=10),
            expiry_date=timezone.now().date() - timedelta(days=3),
            status="pending",
            created_by=self.user,
        )

        # Create a non-expired query
        Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="18K",
            gender="Man",
            size="8 inches",
            location="Uptown",
            delivery_type="Pickup",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        url = "/api/payments/queries/auto_archive/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("auto-archived", response.data["message"])

        # Verify the expired query was archived
        archived_query = Query.objects.get(location="Downtown")
        self.assertEqual(archived_query.status, "archived")

        # Verify the non-expired query is still pending
        pending_query = Query.objects.get(location="Uptown")
        self.assertEqual(pending_query.status, "pending")


# Property-Based Tests using Hypothesis
from hypothesis import given, settings as hypothesis_settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase
import uuid as uuid_module


class QueryPropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query API
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"Test Company {unique_id}",
            defaults={
                "display_name": f"Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username - use create_user to handle company properly
        try:
            self.user = User.objects.get(username=f"testuser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"testuser_{unique_id}",
                email=f"test_{unique_id}@example.com",
                password="testpass123",
                name=f"Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"ACC{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        num_pending=st.integers(min_value=0, max_value=5),
        num_archived=st.integers(min_value=0, max_value=5),
        num_converted=st.integers(min_value=0, max_value=5),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_1_pending_status_filter_returns_only_pending(
        self, num_pending, num_archived, num_converted
    ):
        """
        **Feature: pending-queries-management, Property 1: Pending status filter returns only pending queries**
        **Validates: Requirements 1.1**

        For any set of queries with mixed statuses, when filtering by status="pending",
        all returned queries SHALL have status equal to "pending".
        """
        created_queries = []

        try:
            # Create queries with different statuses
            for i in range(num_pending):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="22K",
                    gender="Woman",
                    size=f"Size {i}",
                    location="Downtown",
                    delivery_type="Home Delivery",
                    query_in_date=timezone.now().date(),
                    expiry_date=timezone.now().date() + timedelta(days=7),
                    status="pending",
                    created_by=self.user,
                )
                created_queries.append(q)

            for i in range(num_archived):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="18K",
                    gender="Man",
                    size=f"Size archived {i}",
                    location="Uptown",
                    delivery_type="Pickup",
                    query_in_date=timezone.now().date(),
                    expiry_date=timezone.now().date() + timedelta(days=14),
                    status="archived",
                    created_by=self.user,
                )
                created_queries.append(q)

            for i in range(num_converted):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="24K",
                    gender="Unisex",
                    size=f"Size converted {i}",
                    location="Midtown",
                    delivery_type="Home Delivery",
                    query_in_date=timezone.now().date(),
                    expiry_date=timezone.now().date() + timedelta(days=21),
                    status="converted_to_order",
                    created_by=self.user,
                )
                created_queries.append(q)

            # Call the list API with status filter
            url = "/api/payments/queries/?status=pending"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Property: All returned queries must have status "pending"
            results = response.data.get("results", [])
            for query_data in results:
                self.assertEqual(
                    query_data["status"],
                    "pending",
                    f"Query {query_data['id']} has status '{query_data['status']}' but expected 'pending'",
                )

            # Verify the count matches expected pending queries
            # Note: There might be other pending queries from other tests, so we check >= num_pending
            self.assertGreaterEqual(len(results), num_pending)

        finally:
            # Clean up created queries
            for q in created_queries:
                q.delete()

    @given(
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
        status=st.sampled_from(["pending", "archived", "converted_to_order"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_2_query_list_response_contains_required_fields(
        self, gold_carat, size, status
    ):
        """
        **Feature: pending-queries-management, Property 2: Query list response contains all required fields**
        **Validates: Requirements 1.2, 7.1**

        For any query in the list response, the serialized object SHALL contain:
        id, account, item_name, gold_carat, size, query_in_date, expiry_date, status, and is_expired fields.
        """
        # Create a query with the generated data
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size=size if size.strip() else "6 inches",  # Ensure non-empty
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=status,
            created_by=self.user,
        )

        try:
            # Call the list API
            url = "/api/payments/queries/"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Find our query in the results
            results = response.data.get("results", [])
            query_data = None
            for result in results:
                if result.get("id") == str(query.id):
                    query_data = result
                    break

            # Verify the query was found
            self.assertIsNotNone(query_data, f"Query {query.id} not found in response")

            # Property: All required fields must be present
            required_fields = [
                "id",
                "account",
                "item_name",
                "gold_carat",
                "size",
                "query_in_date",
                "expiry_date",
                "status",
                "is_expired",
            ]

            for field in required_fields:
                self.assertIn(
                    field, query_data, f"Required field '{field}' missing from query response"
                )

            # Verify field values match what we created
            self.assertEqual(query_data["id"], str(query.id))
            self.assertEqual(query_data["gold_carat"], gold_carat)
            self.assertEqual(query_data["status"], status)

        finally:
            # Clean up the query to avoid test pollution
            query.delete()

    @given(
        search_term=st.text(
            min_size=2, max_size=10, alphabet=st.characters(whitelist_categories=("L",))
        ),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_4_search_filters_match_expected_fields(self, search_term):
        """
        **Feature: pending-queries-management, Property 4: Search filters match expected fields**
        **Validates: Requirements 1.5**

        For any search term, the returned queries SHALL only include queries where
        account_name, item_name, or gold_carat contains the search term (case-insensitive).
        """
        created_queries = []

        try:
            # Create a query that should match (account name contains search term)
            matching_account = Account.objects.create(
                company=self.company,
                account_name=f"Customer {search_term} Smith",
                account_no=f"ACC{search_term[:3].upper()}",
                group_code="CUSTOMER",
            )

            matching_query = Query.objects.create(
                account=matching_account,
                item_name=self.item_name,
                gold_carat="22K",
                gender="Woman",
                size="6 inches",
                location="Downtown",
                delivery_type="Home Delivery",
                query_in_date=timezone.now().date(),
                expiry_date=timezone.now().date() + timedelta(days=7),
                status="pending",
                created_by=self.user,
            )
            created_queries.append(matching_query)

            # Create a query that should NOT match
            non_matching_query = Query.objects.create(
                account=self.account,  # Uses "Test Account" which shouldn't match random search term
                item_name=self.item_name,
                gold_carat="18K",
                gender="Man",
                size="8 inches",
                location="Uptown",
                delivery_type="Pickup",
                query_in_date=timezone.now().date(),
                expiry_date=timezone.now().date() + timedelta(days=14),
                status="pending",
                created_by=self.user,
            )
            created_queries.append(non_matching_query)

            # Call the list API with search filter
            url = f"/api/payments/queries/?search={search_term}"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Property: All returned queries must match the search term in one of the expected fields
            results = response.data.get("results", [])
            search_lower = search_term.lower()

            for query_data in results:
                account_name = ""
                if query_data.get("account"):
                    account_name = (query_data["account"].get("account_name") or "").lower()

                item_name = ""
                if query_data.get("item_name"):
                    item_name = (query_data["item_name"].get("name") or "").lower()

                gold_carat = (query_data.get("gold_carat") or "").lower()
                location = (query_data.get("location") or "").lower()

                # At least one field must contain the search term
                matches = (
                    search_lower in account_name
                    or search_lower in item_name
                    or search_lower in gold_carat
                    or search_lower in location
                )

                self.assertTrue(
                    matches,
                    f"Query {query_data['id']} does not match search term '{search_term}' in any expected field",
                )

        finally:
            # Clean up created queries and account
            for q in created_queries:
                q.delete()
            if "matching_account" in locals():
                matching_account.delete()

    @given(
        days_offset=st.integers(min_value=-30, max_value=30),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_3_expiry_detection_is_date_accurate(self, days_offset):
        """
        **Feature: pending-queries-management, Property 3: Expiry detection is date-accurate**
        **Validates: Requirements 1.4, 6.1**

        For any query with an expiry_date, the is_expired property SHALL return true
        if and only if the current date is after the expiry_date.
        """
        # Calculate expiry date based on offset from today
        today = timezone.now().date()
        expiry_date = today + timedelta(days=days_offset)

        # Create a query with the calculated expiry date
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=today - timedelta(days=7),  # Query started a week ago
            expiry_date=expiry_date,
            status="pending",
            created_by=self.user,
        )

        try:
            # Call the detail API to get the is_expired field
            url = f"/api/payments/queries/{query.id}/"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Get the is_expired value from API response
            api_is_expired = response.data.get("is_expired")

            # Calculate expected is_expired value
            # is_expired should be True if and only if today > expiry_date
            # (i.e., days_offset < 0 means expiry_date is in the past)
            expected_is_expired = days_offset < 0

            # Property: is_expired must accurately reflect whether expiry_date has passed
            self.assertEqual(
                api_is_expired,
                expected_is_expired,
                f"Query with expiry_date {expiry_date} (offset={days_offset} days from today={today}) "
                f"has is_expired={api_is_expired} but expected {expected_is_expired}",
            )

            # Also verify the model method directly
            model_is_expired = query.is_expired()
            self.assertEqual(
                model_is_expired,
                expected_is_expired,
                f"Query.is_expired() returned {model_is_expired} but expected {expected_is_expired}",
            )

        finally:
            # Clean up the query
            query.delete()

    @hypothesis_settings(max_examples=100, deadline=None)
    @given(st.none())
    def test_property_3_expiry_detection_null_date(self, _):
        """
        **Feature: pending-queries-management, Property 3: Expiry detection is date-accurate (null case)**
        **Validates: Requirements 1.4, 6.1**

        For any query with a null expiry_date, the is_expired property SHALL return false.
        """
        # Create a query with null expiry date
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=None,  # Null expiry date
            status="pending",
            created_by=self.user,
        )

        try:
            # Call the detail API to get the is_expired field
            url = f"/api/payments/queries/{query.id}/"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Get the is_expired value from API response
            api_is_expired = response.data.get("is_expired")

            # Property: Null expiry_date should always return is_expired=False
            self.assertFalse(
                api_is_expired,
                f"Query with null expiry_date has is_expired={api_is_expired} but expected False",
            )

            # Also verify the model method directly
            model_is_expired = query.is_expired()
            self.assertFalse(
                model_is_expired,
                f"Query.is_expired() returned {model_is_expired} but expected False for null expiry_date",
            )

        finally:
            # Clean up the query
            query.delete()

    @given(
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        gender=st.sampled_from(["Man", "Woman", "Unisex", None]),
        size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
        location=st.one_of(
            st.none(),
            st.text(
                min_size=1,
                max_size=50,
                alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
            ),
        ),
        delivery_type=st.one_of(st.none(), st.sampled_from(["Home Delivery", "Pickup", "Courier"])),
        status=st.sampled_from(["pending", "archived", "converted_to_order"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_5_query_detail_returns_complete_object(
        self, gold_carat, gender, size, location, delivery_type, status
    ):
        """
        **Feature: pending-queries-management, Property 5: Query detail returns complete object**
        **Validates: Requirements 2.2, 7.2**

        For any valid query ID, the detail endpoint SHALL return all query fields
        including nested account and item_name objects.
        """
        # Ensure size is non-empty
        size = size.strip() if size else "6 inches"
        if not size:
            size = "6 inches"

        # Create a query with the generated data
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender=gender,
            size=size,
            location=location.strip() if location else None,
            delivery_type=delivery_type,
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=status,
            created_by=self.user,
        )

        try:
            # Call the detail API
            url = f"/api/payments/queries/{query.id}/"
            response = self.client.get(url)

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Property: All required fields must be present in detail response
            required_fields = [
                "id",
                "account",
                "item_name",
                "gold_carat",
                "gender",
                "size",
                "location",
                "delivery_type",
                "query_in_date",
                "expiry_date",
                "reference_image",
                "status",
                "is_expired",
                "created_at",
                "updated_at",
            ]

            for field in required_fields:
                self.assertIn(
                    field,
                    response.data,
                    f"Required field '{field}' missing from query detail response",
                )

            # Verify nested account object structure
            account_data = response.data.get("account")
            self.assertIsNotNone(account_data, "Account should not be None")
            self.assertIn("id", account_data, "Account should have 'id' field")
            self.assertIn("account_name", account_data, "Account should have 'account_name' field")
            self.assertIn("name", account_data, "Account should have 'name' field")

            # Verify nested item_name object structure
            item_name_data = response.data.get("item_name")
            self.assertIsNotNone(item_name_data, "Item name should not be None")
            self.assertIn("id", item_name_data, "Item name should have 'id' field")
            self.assertIn("name", item_name_data, "Item name should have 'name' field")

            # Verify field values match what we created
            self.assertEqual(response.data["id"], str(query.id))
            self.assertEqual(response.data["gold_carat"], gold_carat)
            self.assertEqual(response.data["status"], status)
            self.assertEqual(response.data["gender"], gender)
            self.assertEqual(response.data["size"], size)

            # Verify location and delivery_type (may be None)
            expected_location = location.strip() if location else None
            self.assertEqual(response.data["location"], expected_location)
            self.assertEqual(response.data["delivery_type"], delivery_type)

        finally:
            # Clean up the query to avoid test pollution
            query.delete()

    @given(
        new_gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        new_gender=st.sampled_from(["Man", "Woman", "Unisex"]),
        new_size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
        new_location=st.text(
            min_size=1,
            max_size=50,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
        new_delivery_type=st.sampled_from(["Home Delivery", "Pickup", "Courier"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_6_update_persists_changes_and_updates_timestamp(
        self, new_gold_carat, new_gender, new_size, new_location, new_delivery_type
    ):
        """
        **Feature: pending-queries-management, Property 6: Update persists changes and updates timestamp**
        **Validates: Requirements 2.5**

        For any query update operation, the updated_at timestamp SHALL be greater than or equal
        to the previous updated_at value, and the updated fields SHALL reflect the new values.
        """
        import time

        # Ensure size and location are non-empty
        new_size = new_size.strip() if new_size else "7 inches"
        if not new_size:
            new_size = "7 inches"
        new_location = new_location.strip() if new_location else "Midtown"
        if not new_location:
            new_location = "Midtown"

        # Create a query with initial values
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        try:
            # Get the initial updated_at timestamp
            initial_updated_at = query.updated_at

            # Small delay to ensure timestamp difference
            time.sleep(0.01)

            # Prepare update payload
            update_payload = {
                "gold_carat": new_gold_carat,
                "gender": new_gender,
                "size": new_size,
                "location": new_location,
                "delivery_type": new_delivery_type,
            }

            # Call the update API
            url = f"/api/payments/queries/{query.id}/"
            response = self.client.patch(url, update_payload, format="json")

            # Verify response is successful
            self.assertEqual(response.status_code, status_module.HTTP_200_OK)

            # Property 1: Updated fields SHALL reflect the new values
            self.assertEqual(
                response.data["gold_carat"],
                new_gold_carat,
                f"gold_carat should be '{new_gold_carat}' but got '{response.data['gold_carat']}'",
            )
            self.assertEqual(
                response.data["gender"],
                new_gender,
                f"gender should be '{new_gender}' but got '{response.data['gender']}'",
            )
            self.assertEqual(
                response.data["size"],
                new_size,
                f"size should be '{new_size}' but got '{response.data['size']}'",
            )
            self.assertEqual(
                response.data["location"],
                new_location,
                f"location should be '{new_location}' but got '{response.data['location']}'",
            )
            self.assertEqual(
                response.data["delivery_type"],
                new_delivery_type,
                f"delivery_type should be '{new_delivery_type}' but got '{response.data['delivery_type']}'",
            )

            # Refresh from database to verify persistence
            query.refresh_from_db()

            # Property 2: updated_at timestamp SHALL be greater than or equal to previous value
            self.assertGreaterEqual(
                query.updated_at,
                initial_updated_at,
                f"updated_at ({query.updated_at}) should be >= initial ({initial_updated_at})",
            )

            # Verify database values match what we sent
            self.assertEqual(query.gold_carat, new_gold_carat)
            self.assertEqual(query.gender, new_gender)
            self.assertEqual(query.size, new_size)
            self.assertEqual(query.location, new_location)
            self.assertEqual(query.delivery_type, new_delivery_type)

        finally:
            # Clean up the query
            query.delete()


# Import status module with alias to avoid conflict with status field
from rest_framework import status as status_module


class QueryArchivePropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query Archive functionality
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"Archive Test Company {unique_id}",
            defaults={
                "display_name": f"Archive Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username
        try:
            self.user = User.objects.get(username=f"archiveuser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"archiveuser_{unique_id}",
                email=f"archive_{unique_id}@example.com",
                password="testpass123",
                name=f"Archive Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"ARCH{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"Archive Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"Archive Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_9_archive_updates_status_correctly(self, gold_carat, size):
        """
        **Feature: pending-queries-management, Property 9: Archive updates status correctly**
        **Validates: Requirements 4.1, 7.4**

        For any pending query, when archive is called, the query status SHALL change to "archived".
        """
        # Ensure size is non-empty
        size = size.strip() if size else "6 inches"
        if not size:
            size = "6 inches"

        # Create a pending query
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size=size,
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        try:
            # Verify initial status is pending
            self.assertEqual(query.status, "pending")

            # Call the archive endpoint
            url = f"/api/payments/queries/{query.id}/archive/"
            response = self.client.post(url)

            # Verify response is successful
            self.assertEqual(
                response.status_code,
                status_module.HTTP_200_OK,
                f"Archive endpoint returned {response.status_code}: {response.data}",
            )

            # Property: Status in response SHALL be "archived"
            self.assertEqual(
                response.data["status"],
                "archived",
                f"Response status should be 'archived' but got '{response.data['status']}'",
            )

            # Verify database was updated
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                "archived",
                f"Database status should be 'archived' but got '{query.status}'",
            )

        finally:
            # Clean up the query
            query.delete()

    @given(
        initial_status=st.sampled_from(["archived", "converted_to_order", "rejected"]),
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_8_archive_invalid_status_transitions(self, initial_status, gold_carat):
        """
        **Feature: pending-queries-management, Property 8: Status transitions follow valid state machine (archive part)**
        **Validates: Requirements 4.3**

        For any query, archive SHALL only succeed when status is "pending".
        Attempting to archive a non-pending query SHALL return an error.
        """
        # Create a query with non-pending status
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=initial_status,
            created_by=self.user,
        )

        try:
            # Verify initial status is not pending
            self.assertNotEqual(query.status, "pending")

            # Call the archive endpoint
            url = f"/api/payments/queries/{query.id}/archive/"
            response = self.client.post(url)

            # Property: Archive SHALL fail for non-pending queries
            self.assertEqual(
                response.status_code,
                status_module.HTTP_400_BAD_REQUEST,
                f"Archive should fail for status '{initial_status}' but got {response.status_code}",
            )

            # Verify error message is present
            self.assertIn(
                "error", response.data, f"Response should contain 'error' field: {response.data}"
            )

            # Verify database status was NOT changed
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                initial_status,
                f"Database status should remain '{initial_status}' but got '{query.status}'",
            )

        finally:
            # Clean up the query
            query.delete()


class QueryReopenPropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query Reopen functionality
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"Reopen Test Company {unique_id}",
            defaults={
                "display_name": f"Reopen Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username
        try:
            self.user = User.objects.get(username=f"reopenuser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"reopenuser_{unique_id}",
                email=f"reopen_{unique_id}@example.com",
                password="testpass123",
                name=f"Reopen Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"REOP{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"Reopen Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"Reopen Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_10_reopen_updates_status_correctly(self, gold_carat, size):
        """
        **Feature: pending-queries-management, Property 10: Reopen updates status correctly**
        **Validates: Requirements 5.1, 7.5**

        For any archived query, when reopen is called, the query status SHALL change to "pending".
        """
        # Ensure size is non-empty
        size = size.strip() if size else "6 inches"
        if not size:
            size = "6 inches"

        # Create an archived query
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size=size,
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="archived",
            created_by=self.user,
        )

        try:
            # Verify initial status is archived
            self.assertEqual(query.status, "archived")

            # Call the reopen endpoint
            url = f"/api/payments/queries/{query.id}/reopen/"
            response = self.client.post(url)

            # Verify response is successful
            self.assertEqual(
                response.status_code,
                status_module.HTTP_200_OK,
                f"Reopen endpoint returned {response.status_code}: {response.data}",
            )

            # Property: Status in response SHALL be "pending"
            self.assertEqual(
                response.data["status"],
                "pending",
                f"Response status should be 'pending' but got '{response.data['status']}'",
            )

            # Verify database was updated
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                "pending",
                f"Database status should be 'pending' but got '{query.status}'",
            )

        finally:
            # Clean up the query
            query.delete()

    @given(
        initial_status=st.sampled_from(["pending", "converted_to_order", "rejected"]),
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_8_reopen_invalid_status_transitions(self, initial_status, gold_carat):
        """
        **Feature: pending-queries-management, Property 8: Status transitions follow valid state machine (reopen part)**
        **Validates: Requirements 5.3**

        For any query, reopen SHALL only succeed when status is "archived".
        Attempting to reopen a non-archived query SHALL return an error.
        """
        # Create a query with non-archived status
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=initial_status,
            created_by=self.user,
        )

        try:
            # Verify initial status is not archived
            self.assertNotEqual(query.status, "archived")

            # Call the reopen endpoint
            url = f"/api/payments/queries/{query.id}/reopen/"
            response = self.client.post(url)

            # Property: Reopen SHALL fail for non-archived queries
            self.assertEqual(
                response.status_code,
                status_module.HTTP_400_BAD_REQUEST,
                f"Reopen should fail for status '{initial_status}' but got {response.status_code}",
            )

            # Verify error message is present
            self.assertIn(
                "error", response.data, f"Response should contain 'error' field: {response.data}"
            )

            # Verify database status was NOT changed
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                initial_status,
                f"Database status should remain '{initial_status}' but got '{query.status}'",
            )

        finally:
            # Clean up the query
            query.delete()


class QueryConvertPropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query Convert to Order functionality
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"Convert Test Company {unique_id}",
            defaults={
                "display_name": f"Convert Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username
        try:
            self.user = User.objects.get(username=f"convertuser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"convertuser_{unique_id}",
                email=f"convert_{unique_id}@example.com",
                password="testpass123",
                name=f"Convert Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"CONV{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"Convert Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"Convert Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
        size=st.text(
            min_size=1,
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z")),
        ),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_7_conversion_updates_status(self, gold_carat, size):
        """
        **Feature: pending-queries-management, Property 7: Conversion updates query status**
        **Validates: Requirements 3.3, 3.4, 7.3**

        For any pending query, when convert_to_order is called, the system SHALL update
        the query status to "converted_to_order". The actual Order creation happens
        through the order form, not this endpoint.
        """
        # Ensure size is non-empty
        size = size.strip() if size else "6 inches"
        if not size:
            size = "6 inches"

        # Create a pending query
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size=size,
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status="pending",
            created_by=self.user,
        )

        try:
            # Verify initial status is pending
            self.assertEqual(query.status, "pending")

            # Call the convert_to_order endpoint with optional order_id
            url = f"/api/payments/queries/{query.id}/convert_to_order/"
            test_order_id = "ORDER123"
            response = self.client.post(url, {"order_id": test_order_id})

            # Verify response is successful
            self.assertEqual(
                response.status_code,
                status_module.HTTP_201_CREATED,
                f"Convert endpoint returned {response.status_code}: {response.data}",
            )

            # Property 1: Response SHALL contain order_id (if provided in request)
            self.assertIn(
                "order_id",
                response.data,
                f"Response should contain 'order_id' field: {response.data}",
            )

            order_id = response.data["order_id"]
            self.assertEqual(order_id, test_order_id, "order_id should match the provided value")

            # Property 2: Query status SHALL be updated to "converted_to_order"
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                "converted_to_order",
                f"Query status should be 'converted_to_order' but got '{query.status}'",
            )

            # Property 3: Response should contain success message
            self.assertIn("message", response.data)
            self.assertIn("converted", response.data["message"].lower())

        finally:
            # Clean up the query
            query.delete()

    @given(
        initial_status=st.sampled_from(["archived", "converted_to_order", "rejected"]),
        gold_carat=st.sampled_from(["18K", "22K", "24K"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_8_convert_invalid_status_transitions(self, initial_status, gold_carat):
        """
        **Feature: pending-queries-management, Property 8: Status transitions follow valid state machine (convert part)**
        **Validates: Requirements 3.6**

        For any query, convert_to_order SHALL only succeed when status is "pending".
        Attempting to convert a non-pending query SHALL return an error.
        """
        from vouchers.models import Order

        # Create a query with non-pending status
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat=gold_carat,
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=initial_status,
            created_by=self.user,
        )

        try:
            # Verify initial status is not pending
            self.assertNotEqual(query.status, "pending")

            # Get initial order count
            initial_order_count = Order.objects.count()

            # Call the convert_to_order endpoint
            url = f"/api/payments/queries/{query.id}/convert_to_order/"
            response = self.client.post(url, {"receipt_voucher_id": "RV001"})

            # Property: Convert SHALL fail for non-pending queries
            self.assertEqual(
                response.status_code,
                status_module.HTTP_400_BAD_REQUEST,
                f"Convert should fail for status '{initial_status}' but got {response.status_code}",
            )

            # Verify error message is present
            self.assertIn(
                "error", response.data, f"Response should contain 'error' field: {response.data}"
            )

            # Property: No new Order SHALL be created
            new_order_count = Order.objects.count()
            self.assertEqual(
                new_order_count,
                initial_order_count,
                f"No order should be created but count changed from {initial_order_count} to {new_order_count}",
            )

            # Verify database status was NOT changed
            query.refresh_from_db()
            self.assertEqual(
                query.status,
                initial_status,
                f"Database status should remain '{initial_status}' but got '{query.status}'",
            )

        finally:
            # Clean up the query
            query.delete()
            # Clean up any orders that might have been created
            Order.objects.filter(account=self.account).delete()


class QueryAutoArchivePropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query Auto-Archive functionality
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"AutoArchive Test Company {unique_id}",
            defaults={
                "display_name": f"AutoArchive Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username
        try:
            self.user = User.objects.get(username=f"autoarchiveuser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"autoarchiveuser_{unique_id}",
                email=f"autoarchive_{unique_id}@example.com",
                password="testpass123",
                name=f"AutoArchive Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"AUTO{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"AutoArchive Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"AutoArchive Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        num_expired_pending=st.integers(min_value=0, max_value=5),
        num_non_expired_pending=st.integers(min_value=0, max_value=5),
        num_expired_archived=st.integers(min_value=0, max_value=3),
        num_expired_converted=st.integers(min_value=0, max_value=3),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_11_auto_archive_processes_all_expired_pending_queries(
        self,
        num_expired_pending,
        num_non_expired_pending,
        num_expired_archived,
        num_expired_converted,
    ):
        """
        **Feature: pending-queries-management, Property 11: Auto-archive processes all expired pending queries**
        **Validates: Requirements 6.2**

        For any set of queries, when auto_archive is called, all queries with status="pending"
        AND expiry_date < current_date SHALL have their status updated to "archived".
        """
        expired_pending_ids = []
        non_expired_pending_ids = []
        expired_archived_ids = []
        expired_converted_ids = []
        today = timezone.now().date()

        try:
            # Create expired pending queries (should be archived)
            for i in range(num_expired_pending):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="22K",
                    gender="Woman",
                    size=f"Size {i}",
                    location="Downtown",
                    delivery_type="Home Delivery",
                    query_in_date=today - timedelta(days=10),
                    expiry_date=today - timedelta(days=3),  # Expired
                    status="pending",
                    created_by=self.user,
                )
                expired_pending_ids.append(q.id)

            # Create non-expired pending queries (should NOT be archived)
            for i in range(num_non_expired_pending):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="18K",
                    gender="Man",
                    size=f"Size {i + 100}",
                    location="Uptown",
                    delivery_type="Pickup",
                    query_in_date=today,
                    expiry_date=today + timedelta(days=7),  # Not expired
                    status="pending",
                    created_by=self.user,
                )
                non_expired_pending_ids.append(q.id)

            # Create expired archived queries (should NOT be changed)
            for i in range(num_expired_archived):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="24K",
                    gender="Unisex",
                    size=f"Size {i + 200}",
                    location="Midtown",
                    delivery_type="Home Delivery",
                    query_in_date=today - timedelta(days=10),
                    expiry_date=today - timedelta(days=3),  # Expired
                    status="archived",
                    created_by=self.user,
                )
                expired_archived_ids.append(q.id)

            # Create expired converted queries (should NOT be changed)
            for i in range(num_expired_converted):
                q = Query.objects.create(
                    account=self.account,
                    item_name=self.item_name,
                    gold_carat="22K",
                    gender="Woman",
                    size=f"Size {i + 300}",
                    location="Downtown",
                    delivery_type="Pickup",
                    query_in_date=today - timedelta(days=10),
                    expiry_date=today - timedelta(days=3),  # Expired
                    status="converted_to_order",
                    created_by=self.user,
                )
                expired_converted_ids.append(q.id)

            # Call the auto_archive endpoint
            url = "/api/payments/queries/auto_archive/"
            response = self.client.post(url)

            # Verify response is successful
            self.assertEqual(
                response.status_code,
                status_module.HTTP_200_OK,
                f"Auto-archive endpoint returned {response.status_code}: {response.data}",
            )

            # Verify response contains count of archived queries
            self.assertIn(
                "message",
                response.data,
                f"Response should contain 'message' field: {response.data}",
            )

            # Property 1: All expired pending queries SHALL be archived
            for query_id in expired_pending_ids:
                query = Query.objects.get(id=query_id)
                self.assertEqual(
                    query.status,
                    "archived",
                    f"Expired pending query {query_id} should be 'archived' but got '{query.status}'",
                )

            # Property 2: Count in response SHALL match number of expired pending queries
            message = response.data["message"]
            # Message format: "X queries auto-archived"
            count_str = message.split()[0]
            archived_count = int(count_str)

            self.assertEqual(
                archived_count,
                num_expired_pending,
                f"Response indicates {archived_count} queries archived but expected {num_expired_pending}",
            )

            # Property 3: Non-expired pending queries SHALL remain pending
            for query_id in non_expired_pending_ids:
                query = Query.objects.get(id=query_id)
                self.assertEqual(
                    query.status,
                    "pending",
                    f"Non-expired pending query {query_id} should remain 'pending' but got '{query.status}'",
                )

            # Property 4: Already archived queries SHALL remain archived
            for query_id in expired_archived_ids:
                query = Query.objects.get(id=query_id)
                self.assertEqual(
                    query.status,
                    "archived",
                    f"Already archived query {query_id} should remain 'archived' but got '{query.status}'",
                )

            # Property 5: Converted queries SHALL remain converted
            for query_id in expired_converted_ids:
                query = Query.objects.get(id=query_id)
                self.assertEqual(
                    query.status,
                    "converted_to_order",
                    f"Converted query {query_id} should remain 'converted_to_order' but got '{query.status}'",
                )

        finally:
            # Clean up created queries
            Query.objects.filter(id__in=expired_pending_ids).delete()
            Query.objects.filter(id__in=non_expired_pending_ids).delete()
            Query.objects.filter(id__in=expired_archived_ids).delete()
            Query.objects.filter(id__in=expired_converted_ids).delete()


class QueryErrorResponsePropertyTests(HypothesisTestCase):
    """
    Property-based tests for Query API Error Responses
    **Feature: pending-queries-management**
    """

    def setUp(self):
        """Set up test data with unique identifiers to avoid conflicts"""
        self.client = APIClient()

        # Use unique identifiers to avoid conflicts between hypothesis examples
        unique_id = str(uuid_module.uuid4())[:8]

        # Create company with unique name
        self.company, _ = Company.objects.get_or_create(
            name=f"Error Test Company {unique_id}",
            defaults={
                "display_name": f"Error Test Company Inc. {unique_id}",
                "is_active": True,
            },
        )

        # Create user with unique username
        try:
            self.user = User.objects.get(username=f"erroruser_{unique_id}")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username=f"erroruser_{unique_id}",
                email=f"error_{unique_id}@example.com",
                password="testpass123",
                name=f"Error Test User {unique_id}",
                company=self.company,
            )

        # Create account with unique account_no
        self.account, _ = Account.objects.get_or_create(
            account_no=f"ERR{unique_id}",
            defaults={
                "company": self.company,
                "account_name": f"Error Test Account {unique_id}",
                "group_code": "CUSTOMER",
            },
        )

        # Create item name master with unique name
        self.item_name, _ = ItemNameMaster.objects.get_or_create(
            company=self.company,
            name=f"Error Ring {unique_id}",
        )

        # Authenticate client
        self.client.force_authenticate(user=self.user)

    @given(
        operation=st.sampled_from(["archive", "reopen", "convert_to_order"]),
        invalid_status=st.sampled_from(["pending", "archived", "converted_to_order", "rejected"]),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_12_api_errors_return_proper_structure(self, operation, invalid_status):
        """
        **Feature: pending-queries-management, Property 12: API errors return proper structure**
        **Validates: Requirements 7.6**

        For any failed API operation, the response SHALL include an HTTP status code >= 400
        and a response body with an "error" or "detail" field containing a descriptive message.
        """
        # Determine which status is invalid for the operation
        if operation == "archive":
            # Archive only works on pending queries
            if invalid_status == "pending":
                # Skip this combination as it's valid
                return
        elif operation == "reopen":
            # Reopen only works on archived queries
            if invalid_status == "archived":
                # Skip this combination as it's valid
                return
        elif operation == "convert_to_order":
            # Convert only works on pending queries
            if invalid_status == "pending":
                # Skip this combination as it's valid
                return
        else:
            return  # Unknown operation

        # Create a query with the invalid status for this operation
        query = Query.objects.create(
            account=self.account,
            item_name=self.item_name,
            gold_carat="22K",
            gender="Woman",
            size="6 inches",
            location="Downtown",
            delivery_type="Home Delivery",
            query_in_date=timezone.now().date(),
            expiry_date=timezone.now().date() + timedelta(days=7),
            status=invalid_status,
            created_by=self.user,
        )

        try:
            # Call the appropriate endpoint
            if operation == "archive":
                url = f"/api/payments/queries/{query.id}/archive/"
                response = self.client.post(url)
            elif operation == "reopen":
                url = f"/api/payments/queries/{query.id}/reopen/"
                response = self.client.post(url)
            elif operation == "convert_to_order":
                url = f"/api/payments/queries/{query.id}/convert_to_order/"
                response = self.client.post(url, {"receipt_voucher_id": "RV001"})
            else:
                return

            # Property 1: Response SHALL have HTTP status code >= 400
            self.assertGreaterEqual(
                response.status_code,
                400,
                f"Error response should have status >= 400 but got {response.status_code}",
            )

            # Property 2: Response body SHALL contain "error" or "detail" field
            has_error_field = "error" in response.data or "detail" in response.data
            self.assertTrue(
                has_error_field,
                f"Error response should contain 'error' or 'detail' field but got: {response.data}",
            )

            # Property 3: Error message SHALL be a non-empty string
            error_message = response.data.get("error") or response.data.get("detail")
            self.assertIsInstance(
                error_message,
                str,
                f"Error message should be a string but got {type(error_message)}",
            )
            self.assertGreater(len(error_message), 0, "Error message should not be empty")

            # Property 4: Error message SHALL be descriptive (contain relevant keywords)
            error_lower = error_message.lower()
            # Check that the error message mentions the operation or status
            is_descriptive = (
                operation in error_lower
                or "status" in error_lower
                or invalid_status in error_lower
                or "cannot" in error_lower
                or "invalid" in error_lower
                or "only" in error_lower
            )
            self.assertTrue(
                is_descriptive, f"Error message should be descriptive but got: '{error_message}'"
            )

        finally:
            # Clean up the query
            query.delete()

    @given(
        endpoint=st.sampled_from(
            ["detail", "update", "delete", "archive", "reopen", "convert_to_order"]
        ),
    )
    @hypothesis_settings(max_examples=100, deadline=None)
    def test_property_12_not_found_errors_return_proper_structure(self, endpoint):
        """
        **Feature: pending-queries-management, Property 12: API errors return proper structure (404 case)**
        **Validates: Requirements 7.6**

        For any API operation on a non-existent query, the response SHALL include HTTP status code 404
        and a response body with an "error" or "detail" field containing a descriptive message.
        """
        # Generate a random UUID that doesn't exist
        non_existent_id = str(uuid_module.uuid4())

        # Call the appropriate endpoint with non-existent ID
        if endpoint == "detail":
            url = f"/api/payments/queries/{non_existent_id}/"
            response = self.client.get(url)
        elif endpoint == "update":
            url = f"/api/payments/queries/{non_existent_id}/"
            response = self.client.patch(url, {"gold_carat": "24K"}, format="json")
        elif endpoint == "delete":
            url = f"/api/payments/queries/{non_existent_id}/"
            response = self.client.delete(url)
        elif endpoint == "archive":
            url = f"/api/payments/queries/{non_existent_id}/archive/"
            response = self.client.post(url)
        elif endpoint == "reopen":
            url = f"/api/payments/queries/{non_existent_id}/reopen/"
            response = self.client.post(url)
        elif endpoint == "convert_to_order":
            url = f"/api/payments/queries/{non_existent_id}/convert_to_order/"
            response = self.client.post(url, {"receipt_voucher_id": "RV001"})
        else:
            return

        # Property 1: Response SHALL have HTTP status code 404
        self.assertEqual(
            response.status_code,
            404,
            f"Not found response should have status 404 but got {response.status_code}",
        )

        # Property 2: Response body SHALL contain "error" or "detail" field
        has_error_field = "error" in response.data or "detail" in response.data
        self.assertTrue(
            has_error_field,
            f"Error response should contain 'error' or 'detail' field but got: {response.data}",
        )

        # Property 3: Error message SHALL be a non-empty string
        error_message = response.data.get("error") or response.data.get("detail")
        self.assertIsInstance(
            error_message, str, f"Error message should be a string but got {type(error_message)}"
        )
        self.assertGreater(len(error_message), 0, "Error message should not be empty")

        # Property 4: Error message SHALL mention "not found" or similar
        error_lower = error_message.lower()
        is_not_found_message = (
            "not found" in error_lower
            or "does not exist" in error_lower
            or "not exist" in error_lower
            or "no query" in error_lower
        )
        self.assertTrue(
            is_not_found_message,
            f"Error message should indicate 'not found' but got: '{error_message}'",
        )

    @hypothesis_settings(max_examples=50, deadline=None)
    @given(st.none())
    def test_property_12_validation_errors_return_proper_structure(self, _):
        """
        **Feature: pending-queries-management, Property 12: API errors return proper structure (validation case)**
        **Validates: Requirements 7.6**

        For any API operation with invalid data, the response SHALL include HTTP status code 400
        and a response body with an "error" or "detail" field containing a descriptive message.
        """
        # Try to create a query with missing required fields
        url = "/api/payments/queries/"
        invalid_data = {
            # Missing required fields like account, item_name, gold_carat, size, etc.
            "gold_carat": "",  # Empty string
            "size": "",  # Empty string
        }

        response = self.client.post(url, invalid_data, format="json")

        # Property 1: Response SHALL have HTTP status code 400
        self.assertEqual(
            response.status_code,
            400,
            f"Validation error response should have status 400 but got {response.status_code}",
        )

        # Property 2: Response body SHALL contain error information
        # DRF can return errors in different formats (field-level or general)
        self.assertIsNotNone(response.data, "Error response should contain data")

        # Property 3: Error information SHALL be descriptive
        # Check if response contains any error-related fields
        has_error_info = (
            "error" in response.data
            or "detail" in response.data
            or any(key in response.data for key in ["account", "item_name", "gold_carat", "size"])
        )
        self.assertTrue(
            has_error_info,
            f"Error response should contain error information but got: {response.data}",
        )

    @hypothesis_settings(max_examples=50, deadline=None)
    @given(st.none())
    def test_property_12_unauthenticated_errors_return_proper_structure(self, _):
        """
        **Feature: pending-queries-management, Property 12: API errors return proper structure (auth case)**
        **Validates: Requirements 7.6**

        For any API operation without authentication, the response SHALL include HTTP status code 401 or 403
        and a response body with an "error" or "detail" field containing a descriptive message.
        """
        # Create an unauthenticated client
        unauth_client = APIClient()

        # Try to access the query list endpoint without authentication
        url = "/api/payments/queries/"
        response = unauth_client.get(url)

        # Property 1: Response SHALL have HTTP status code 401 or 403
        self.assertIn(
            response.status_code,
            [401, 403],
            f"Unauthenticated response should have status 401 or 403 but got {response.status_code}",
        )

        # Property 2: Response body SHALL contain "error" or "detail" field
        has_error_field = "error" in response.data or "detail" in response.data
        self.assertTrue(
            has_error_field,
            f"Error response should contain 'error' or 'detail' field but got: {response.data}",
        )

        # Property 3: Error message SHALL be a non-empty string
        error_message = response.data.get("error") or response.data.get("detail")
        self.assertIsInstance(
            error_message, str, f"Error message should be a string but got {type(error_message)}"
        )
        self.assertGreater(len(error_message), 0, "Error message should not be empty")
