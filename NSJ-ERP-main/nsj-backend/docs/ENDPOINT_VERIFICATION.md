# Endpoint Implementation Verification

## ✅ Specification Requirements - CONFIRMED

### Required Endpoints (from specification):

#### 1. POST /api/payments/queries/
**Status:** ✅ IMPLEMENTED

- Accept query data and create Query model instance
- Return created query with ID

**Implementation:**
- ViewSet: `QueryViewSet` (ModelViewSet)
- Handler: `create()` method with `perform_create()` override
- Serializer: `QuerySerializer`
- Authentication: Required (Session-based)
- Response: Returns created Query with nested account, item_name, and timestamps

**Request Example:**
```json
POST /api/payments/queries/
{
  "account": "uuid-of-account",
  "item_name": "uuid-of-item",
  "gold_carat": "22K",
  "gender": "Woman",
  "size": "6 inches",
  "location": "Downtown",
  "delivery_type": "Home Delivery",
  "query_in_date": "2025-12-08",
  "expiry_date": "2025-12-15"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "account": {
    "id": "uuid",
    "account_name": "John Doe",
    "name": "John Doe"
  },
  "item_name": {
    "id": "uuid",
    "name": "Ring"
  },
  "gold_carat": "22K",
  "gender": "Woman",
  "size": "6 inches",
  "location": "Downtown",
  "delivery_type": "Home Delivery",
  "query_in_date": "2025-12-08",
  "expiry_date": "2025-12-15",
  "reference_image": null,
  "status": "pending",
  "is_expired": false,
  "created_at": "2025-12-08T19:20:00Z",
  "updated_at": "2025-12-08T19:20:00Z"
}
```

---

#### 2. GET /api/payments/queries/
**Status:** ✅ IMPLEMENTED

- Return paginated list of pending queries
- Support search and status filtering

**Implementation:**
- ViewSet: `QueryViewSet` (ModelViewSet)
- Handler: `list()` method via `get_queryset()`
- Pagination: `StandardResultsSetPagination` (50 items per page)
- Search: Filters on account_name, item_name, location, gold_carat
- Status Filter: Filter by status field

**Query Parameters:**
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 50, max: 100)
- `search` - Search by account name, item name, location, or carat
- `status` - Filter by status (pending/converted_to_order/archived/rejected)

**Request Examples:**
```bash
# Get all queries, page 1
GET /api/payments/queries/

# Get pending queries only
GET /api/payments/queries/?status=pending

# Search for a specific query
GET /api/payments/queries/?search=John&status=pending

# Custom pagination
GET /api/payments/queries/?page=2&page_size=25
```

**Response (200 OK):**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/payments/queries/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "account": {...},
      "item_name": {...},
      "gold_carat": "22K",
      "gender": "Woman",
      "size": "6 inches",
      "location": "Downtown",
      "delivery_type": "Home Delivery",
      "query_in_date": "2025-12-08",
      "expiry_date": "2025-12-15",
      "reference_image": null,
      "status": "pending",
      "is_expired": false,
      "created_at": "2025-12-08T19:20:00Z",
      "updated_at": "2025-12-08T19:20:00Z"
    }
  ]
}
```

---

## Additional Implemented Endpoints

### Query Management
- `GET /api/payments/queries/{id}/` - Retrieve single query
- `PATCH /api/payments/queries/{id}/` - Update query (partial)
- `DELETE /api/payments/queries/{id}/` - Delete query
- `POST /api/payments/queries/auto_archive/` - Auto-archive expired queries (batch)
- `POST /api/payments/queries/{id}/convert_to_order/` - Convert query to order

### Order Issue Management
- `GET /api/payments/order-issues/` - List order issues (paginated, searchable)
- `POST /api/payments/order-issues/` - Create order issue from order ID
- `GET /api/payments/order-issues/{id}/` - Retrieve single order issue
- `PATCH /api/payments/order-issues/{id}/` - Update order issue
- `DELETE /api/payments/order-issues/{id}/` - Delete order issue
- `GET /api/payments/order-issues/{id}/export/` - Export order issue to PDF

---

## URL Configuration

### Django URL Routing
```python
# nsj_backend/urls.py
path("api/payments/", include("issues.urls")),
```

### Issues App Router
```python
# issues/urls.py
router.register(r"queries", QueryViewSet, basename="query")
router.register(r"order-issues", OrderIssueViewSet, basename="orderissue")
```

### Generated URLs
- `GET/POST /api/payments/queries/`
- `GET/PATCH/DELETE /api/payments/queries/{id}/`
- `POST /api/payments/queries/auto_archive/`
- `POST /api/payments/queries/{id}/convert_to_order/`
- `GET/POST /api/payments/order-issues/`
- `GET/PATCH/DELETE /api/payments/order-issues/{id}/`
- `GET /api/payments/order-issues/{id}/export/`

---

## Database Models

### Query Model
```python
class Query(models.Model):
    id = UUIDField()
    account = ForeignKey(Account)
    item_name = ForeignKey(ItemNameMaster)
    gold_carat = CharField()
    gender = CharField()
    size = CharField()
    location = CharField()
    delivery_type = CharField()
    query_in_date = DateField()
    expiry_date = DateField()
    reference_image = FileField()
    status = CharField(choices=pending/converted/archived/rejected)
    created_by = ForeignKey(User)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### OrderIssue Model
```python
class OrderIssue(models.Model):
    id = UUIDField()
    order = ForeignKey(Order)
    account = ForeignKey(Account)
    item_name = ForeignKey(ItemNameMaster)
    order_ref = CharField()
    status = CharField(choices=pending/in_progress/resolved/closed)
    description = TextField()
    created_by = ForeignKey(User)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

---

## Authentication & Permissions

All Query and Order Issue endpoints require:
- Session authentication (user must be logged in)
- CSRF token for POST/PATCH/DELETE requests
- Cookie-based session management

**Headers Required:**
```
Cookie: sessionid=<session_id>; csrftoken=<csrf_token>
X-CSRFToken: <csrf_token>
Content-Type: application/json
```

---

## Testing

### Unit Tests
- ✅ Query model creation
- ✅ Query expiry logic
- ✅ Query auto-archive
- ✅ Query serialization

### Integration Tests
- ✅ List queries with pagination
- ✅ List queries with search
- ✅ List queries with status filtering
- ✅ Get single query detail
- ✅ Update query
- ✅ Delete query
- ✅ Auto-archive endpoint

**Run Tests:**
```bash
uv run python manage.py test tests.test_queries
uv run python manage.py test tests.test_order_issues
```

---

## Status: ✅ COMPLETE

Both required endpoints are **fully implemented and tested**:

1. ✅ `POST /api/payments/queries/` - Create Query
2. ✅ `GET /api/payments/queries/` - List Queries (with pagination, search, filtering)

**Additional Features:**
- ✅ PDF export for order issues
- ✅ Auto-archive for expired queries
- ✅ Convert query to order functionality
- ✅ Full CRUD for both models
- ✅ Comprehensive filtering and search
- ✅ Admin interface for manual management

The app will now work automatically without any frontend changes needed.
