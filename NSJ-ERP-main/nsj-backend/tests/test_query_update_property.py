"""
Property-Based Test for Query Update Persistence
**Feature: pending-queries-management, Property 6: Update persists changes and updates timestamp**
**Validates: Requirements 2.5**
"""

import time
import uuid as uuid_module
from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status as status_module
from django.contrib.auth import get_user_model

from hypothesis import given, settings as hypothesis_settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase

from core.models import Company, ItemNameMaster
from accounts.models import Account
from issues.models import Query

User = get_user_model()


class QueryUpdatePropertyTest(HypothesisTestCase):
    """
    Property-based tests for Query Update API
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

        # Create user with unique username
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
