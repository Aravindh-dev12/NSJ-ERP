"""
Comprehensive tests for implemented master data ViewSets to improve coverage.
Tests only the ViewSets that are actually registered in core/urls.py.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import (
    Company,
    GoldCaratMaster,
    MetalTypeMaster,
    MetalColorMaster,
    ItemGroupMaster,
    ItemNameMaster,
    ClarityMaster,
    ShapeMaster,
    ColourMaster,
    SizeMaster,
    UnitMaster,
    LabMaster,
    MasterDataRequest,
)

User = get_user_model()


@pytest.fixture
def company(db):
    """Create a test company."""
    return Company.objects.create(
        name="Test Company",
        display_name="Test Co",
    )


@pytest.fixture
def user(db, company):
    """Create a test user."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        company=company,
    )


@pytest.fixture
def api_client(user):
    """Create an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestGoldCaratMasterViewSet:
    """Test GoldCaratMaster ViewSet endpoints."""

    def test_list_gold_carats(self, api_client, user):
        """Test listing gold carats."""
        GoldCaratMaster.objects.create(name="24K", value=24, company=user.company)
        GoldCaratMaster.objects.create(name="22K", value=22, company=user.company)

        response = api_client.get("/api/masters/gold-carats/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_gold_carat(self, api_client, user):
        """Test creating a gold carat."""
        payload = {"name": "21K", "value": 21}
        response = api_client.post("/api/masters/gold-carats/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "21K"
        assert data["value"] == 21

    def test_retrieve_gold_carat(self, api_client, user):
        """Test retrieving a specific gold carat."""
        carat = GoldCaratMaster.objects.create(name="18K", value=18, company=user.company)
        response = api_client.get(f"/api/masters/gold-carats/{carat.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "18K"

    def test_update_gold_carat(self, api_client, user):
        """Test updating a gold carat."""
        carat = GoldCaratMaster.objects.create(name="18K", value=18, company=user.company)
        payload = {"name": "18K Gold", "value": 18}
        response = api_client.put(f"/api/masters/gold-carats/{carat.id}/", payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "18K Gold"

    def test_partial_update_gold_carat(self, api_client, user):
        """Test partially updating a gold carat."""
        carat = GoldCaratMaster.objects.create(name="18K", value=18, company=user.company)
        payload = {"name": "18 Karat"}
        response = api_client.patch(f"/api/masters/gold-carats/{carat.id}/", payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "18 Karat"
        assert data["value"] == 18

    def test_delete_gold_carat(self, api_client, user):
        """Test deleting a gold carat."""
        carat = GoldCaratMaster.objects.create(name="14K", value=14, company=user.company)
        response = api_client.delete(f"/api/masters/gold-carats/{carat.id}/")
        assert response.status_code == 204
        assert not GoldCaratMaster.objects.filter(id=carat.id).exists()


@pytest.mark.django_db
class TestMetalTypeMasterViewSet:
    """Test MetalTypeMaster ViewSet endpoints."""

    def test_list_metal_types(self, api_client, user):
        """Test listing metal types."""
        MetalTypeMaster.objects.create(name="Gold", company=user.company)
        MetalTypeMaster.objects.create(name="Silver", company=user.company)

        response = api_client.get("/api/masters/metal-types/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_metal_type(self, api_client, user):
        """Test creating a metal type."""
        payload = {"name": "Platinum"}
        response = api_client.post("/api/masters/metal-types/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Platinum"

    def test_retrieve_metal_type(self, api_client, user):
        """Test retrieving a specific metal type."""
        metal = MetalTypeMaster.objects.create(name="Gold", company=user.company)
        response = api_client.get(f"/api/masters/metal-types/{metal.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Gold"

    def test_update_metal_type(self, api_client, user):
        """Test updating a metal type."""
        metal = MetalTypeMaster.objects.create(name="Gold", company=user.company)
        payload = {"name": "Pure Gold"}
        response = api_client.patch(f"/api/masters/metal-types/{metal.id}/", payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Pure Gold"

    def test_delete_metal_type(self, api_client, user):
        """Test deleting a metal type."""
        metal = MetalTypeMaster.objects.create(name="Bronze", company=user.company)
        response = api_client.delete(f"/api/masters/metal-types/{metal.id}/")
        assert response.status_code == 204


@pytest.mark.django_db
class TestMetalColorMasterViewSet:
    """Test MetalColorMaster ViewSet endpoints."""

    def test_list_metal_colors(self, api_client, user):
        """Test listing metal colors."""
        metal_type = MetalTypeMaster.objects.create(name="Gold", company=user.company)
        MetalColorMaster.objects.create(
            name="Yellow Gold", metal_type=metal_type, company=user.company
        )
        MetalColorMaster.objects.create(
            name="Rose Gold", metal_type=metal_type, company=user.company
        )

        response = api_client.get("/api/masters/metal-colors/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_metal_color(self, api_client, user):
        """Test creating a metal color."""
        metal_type = MetalTypeMaster.objects.create(name="Gold", company=user.company)
        payload = {"name": "White Gold", "metal_type": str(metal_type.id)}
        response = api_client.post("/api/masters/metal-colors/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "White Gold"

    def test_retrieve_metal_color(self, api_client, user):
        """Test retrieving a specific metal color."""
        metal_type = MetalTypeMaster.objects.create(name="Gold", company=user.company)
        color = MetalColorMaster.objects.create(
            name="Yellow Gold", metal_type=metal_type, company=user.company
        )
        response = api_client.get(f"/api/masters/metal-colors/{color.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Yellow Gold"


@pytest.mark.django_db
class TestItemGroupMasterViewSet:
    """Test ItemGroupMaster ViewSet endpoints."""

    def test_list_item_groups(self, api_client, user):
        """Test listing item groups."""
        ItemGroupMaster.objects.create(name="Rings", company=user.company)
        ItemGroupMaster.objects.create(name="Necklaces", company=user.company)

        response = api_client.get("/api/masters/item-groups/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_item_group(self, api_client, user):
        """Test creating an item group."""
        payload = {"name": "Bracelets"}
        response = api_client.post("/api/masters/item-groups/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Bracelets"

    def test_retrieve_item_group(self, api_client, user):
        """Test retrieving a specific item group."""
        group = ItemGroupMaster.objects.create(name="Earrings", company=user.company)
        response = api_client.get(f"/api/masters/item-groups/{group.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Earrings"


@pytest.mark.django_db
class TestItemNameMasterViewSet:
    """Test ItemNameMaster ViewSet endpoints."""

    def test_list_item_names(self, api_client, user):
        """Test listing item names."""
        ItemNameMaster.objects.create(name="Diamond Ring", company=user.company)
        ItemNameMaster.objects.create(name="Gold Necklace", company=user.company)

        response = api_client.get("/api/masters/item-names/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_item_name(self, api_client, user):
        """Test creating an item name."""
        payload = {"name": "Silver Bracelet"}
        response = api_client.post("/api/masters/item-names/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Silver Bracelet"

    def test_retrieve_item_name(self, api_client, user):
        """Test retrieving a specific item name."""
        item = ItemNameMaster.objects.create(name="Pearl Earrings", company=user.company)
        response = api_client.get(f"/api/masters/item-names/{item.id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Pearl Earrings"


@pytest.mark.django_db
class TestClarityMasterViewSet:
    """Test ClarityMaster ViewSet endpoints."""

    def test_list_clarities(self, api_client, user):
        """Test listing clarities."""
        ClarityMaster.objects.create(name="VVS1", company=user.company)
        ClarityMaster.objects.create(name="VS1", company=user.company)

        response = api_client.get("/api/masters/clarities/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_clarity(self, api_client, user):
        """Test creating a clarity."""
        payload = {"name": "SI1"}
        response = api_client.post("/api/masters/clarities/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "SI1"


@pytest.mark.django_db
class TestShapeMasterViewSet:
    """Test ShapeMaster ViewSet endpoints."""

    def test_list_shapes(self, api_client, user):
        """Test listing shapes."""
        ShapeMaster.objects.create(name="Round", company=user.company)
        ShapeMaster.objects.create(name="Princess", company=user.company)

        response = api_client.get("/api/masters/shapes/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_shape(self, api_client, user):
        """Test creating a shape."""
        payload = {"name": "Emerald"}
        response = api_client.post("/api/masters/shapes/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Emerald"


@pytest.mark.django_db
class TestColourMasterViewSet:
    """Test ColourMaster ViewSet endpoints."""

    def test_list_colours(self, api_client, user):
        """Test listing colours."""
        ColourMaster.objects.create(name="D", company=user.company)
        ColourMaster.objects.create(name="E", company=user.company)

        response = api_client.get("/api/masters/colours/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_colour(self, api_client, user):
        """Test creating a colour."""
        payload = {"name": "F"}
        response = api_client.post("/api/masters/colours/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "F"


@pytest.mark.django_db
class TestSizeMasterViewSet:
    """Test SizeMaster ViewSet endpoints."""

    def test_list_sizes(self, api_client, user):
        """Test listing sizes."""
        SizeMaster.objects.create(name="Small", company=user.company)
        SizeMaster.objects.create(name="Medium", company=user.company)

        response = api_client.get("/api/masters/sizes/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_size(self, api_client, user):
        """Test creating a size."""
        payload = {"name": "Large"}
        response = api_client.post("/api/masters/sizes/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Large"


@pytest.mark.django_db
class TestUnitMasterViewSet:
    """Test UnitMaster ViewSet endpoints."""

    def test_list_units(self, api_client, user):
        """Test listing units."""
        UnitMaster.objects.create(name="Grams", company=user.company)
        UnitMaster.objects.create(name="Carats", company=user.company)

        response = api_client.get("/api/masters/units/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_unit(self, api_client, user):
        """Test creating a unit."""
        payload = {"name": "Pieces"}
        response = api_client.post("/api/masters/units/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Pieces"


@pytest.mark.django_db
class TestLabMasterViewSet:
    """Test LabMaster ViewSet endpoints."""

    def test_list_labs(self, api_client, user):
        """Test listing labs."""
        LabMaster.objects.create(name="GIA", company=user.company)
        LabMaster.objects.create(name="IGI", company=user.company)

        response = api_client.get("/api/masters/labs/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_lab(self, api_client, user):
        """Test creating a lab."""
        payload = {"name": "AGS"}
        response = api_client.post("/api/masters/labs/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "AGS"


@pytest.mark.django_db
class TestMasterDataRequestViewSet:
    """Test MasterDataRequest ViewSet endpoints."""

    def test_list_master_requests(self, api_client, user):
        """Test listing master data requests."""
        MasterDataRequest.objects.create(
            master_type="item_name",
            requested_value="Custom Ring",
            requested_by=user,
            company=user.company,
        )

        response = api_client.get("/api/masters/master-requests/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_create_master_request(self, api_client, user):
        """Test creating a master data request."""
        payload = {
            "master_type": "item_name",
            "requested_value": "New Item Type",
        }
        response = api_client.post("/api/masters/master-requests/", payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["requested_value"] == "New Item Type"
        assert data["status"] == "pending"

    def test_get_pending_requests(self, api_client, user):
        """Test getting pending master data requests."""
        MasterDataRequest.objects.create(
            master_type="item_name",
            requested_value="Pending Item",
            status="pending",
            requested_by=user,
            company=user.company,
        )

        response = api_client.get("/api/masters/master-requests/pending/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_approve_master_request(self, api_client, user):
        """Test approving a master data request."""
        request_obj = MasterDataRequest.objects.create(
            master_type="item_name",
            requested_value="Approved Item",
            status="pending",
            requested_by=user,
            company=user.company,
        )

        response = api_client.post(f"/api/masters/master-requests/{request_obj.id}/approve/")
        assert response.status_code == 200

        # Verify the item was created
        assert ItemNameMaster.objects.filter(name="Approved Item", company=user.company).exists()

    def test_reject_master_request(self, api_client, user):
        """Test rejecting a master data request."""
        request_obj = MasterDataRequest.objects.create(
            master_type="item_name",
            requested_value="Rejected Item",
            status="pending",
            requested_by=user,
            company=user.company,
        )

        payload = {"rejection_reason": "Not needed"}
        response = api_client.post(
            f"/api/masters/master-requests/{request_obj.id}/reject/", payload, format="json"
        )
        assert response.status_code == 200

        # Verify the request was rejected
        request_obj.refresh_from_db()
        assert request_obj.status == "rejected"
        assert request_obj.rejection_reason == "Not needed"


@pytest.mark.django_db
class TestCompanyIsolation:
    """Test that users only see their company's data."""

    def test_gold_carat_company_isolation(self, api_client, user):
        """Test gold carat company isolation."""
        GoldCaratMaster.objects.create(name="24K", value=24, company=user.company)

        other_company = Company.objects.create(name="Other Co", display_name="Other")
        GoldCaratMaster.objects.create(name="22K", value=22, company=other_company)

        response = api_client.get("/api/masters/gold-carats/")
        assert response.status_code == 200
        data = response.json()

        # ViewSet returns paginated results
        results = data.get("results", data) if isinstance(data, dict) else data
        names = [item["name"] for item in results]
        assert "24K" in names
        assert "22K" not in names

    def test_item_name_company_isolation(self, api_client, user):
        """Test item name company isolation."""
        ItemNameMaster.objects.create(name="My Item", company=user.company)

        other_company = Company.objects.create(name="Other Co", display_name="Other")
        ItemNameMaster.objects.create(name="Other Item", company=other_company)

        response = api_client.get("/api/masters/item-names/")
        assert response.status_code == 200
        data = response.json()

        # ViewSet returns paginated results
        results = data.get("results", data) if isinstance(data, dict) else data
        names = [item["name"] for item in results]
        assert "My Item" in names
        assert "Other Item" not in names
