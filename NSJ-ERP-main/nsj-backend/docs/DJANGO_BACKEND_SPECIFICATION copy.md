# Django Backend Specification for NSJ Frontend

This document outlines the complete Django backend requirements for the NSJ Frontend application, including models, API endpoints, and integration specifications.

## Table of Contents

- [Order Issues Model & API](#order-issues-model--api)
- [Vouchers (Orders) API](#vouchers-orders-api)
- [Authentication & Session Flow](#authentication--session-flow)
- [API Endpoints Summary](#api-endpoints-summary)
- [Database Models](#database-models)
- [Implementation Checklist](#implementation-checklist)

---

## Order Issues Model & API

Order Issues is a **separate, independent model** that can be created from existing Orders. Each Order Issue maintains a reference to the original Order but has its own editable fields for independent management.

### Model: OrderIssue

```python
from django.db import models
from django.utils import timezone

class OrderIssue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Foreign key to original order
    order = models.ForeignKey('Voucher', on_delete=models.CASCADE, related_name='order_issues')
    
    # Denormalized fields from order (for quick access)
    account = models.ForeignKey('Account', on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.ForeignKey('Item', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Editable fields specific to order issue
    order_ref = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Issue'
        verbose_name_plural = 'Order Issues'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"Order Issue: {self.order.bill_no if self.order else 'Unknown'}"
    
    def to_dict(self):
        """Serialize to dict for API responses"""
        return {
            'id': str(self.id),
            'order': self.order.to_dict() if self.order else None,
            'account': self.account.to_dict() if self.account else None,
            'item_name': self.item_name.to_dict() if self.item_name else None,
            'order_ref': self.order_ref,
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

### Serializers

```python
from rest_framework import serializers
from .models import OrderIssue

class OrderIssueSerializer(serializers.ModelSerializer):
    account = serializers.SerializerMethodField()
    item_name = serializers.SerializerMethodField()
    order = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderIssue
        fields = [
            'id', 'order', 'account', 'item_name', 'order_ref',
            'status', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'order']
    
    def get_account(self, obj):
        if obj.account:
            return {
                'id': str(obj.account.id),
                'account_name': obj.account.account_name,
                'name': obj.account.account_name,
            }
        return None
    
    def get_item_name(self, obj):
        if obj.item_name:
            return {
                'id': str(obj.item_name.id),
                'name': obj.item_name.name,
            }
        return None
    
    def get_order(self, obj):
        if obj.order:
            return {
                'id': str(obj.order.id),
                'bill_no': obj.order.bill_no,
            }
        return None
```

### API Endpoints

#### 1. Create Order Issue
**POST** `/api/payments/order-issues/`

**Request Body:**
```json
{
    "order_id": "uuid-of-order"
}
```

**Response (201 Created):**
```json
{
    "id": "uuid",
    "order": {
        "id": "uuid",
        "bill_no": "V-2733C7A23C"
    },
    "account": {
        "id": "uuid",
        "account_name": "John Doe",
        "name": "John Doe"
    },
    "item_name": {
        "id": "uuid",
        "name": "Pendant"
    },
    "order_ref": null,
    "status": "pending",
    "description": null,
    "created_at": "2025-12-03T10:30:00Z",
    "updated_at": "2025-12-03T10:30:00Z"
}
```

**Backend Logic:**
- Fetch the Order (Voucher) by ID
- Validate that order exists and is in confirmed/completed status
- Create new OrderIssue with denormalized account and item_name from order
- Return the created OrderIssue with full nested objects

**View:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class OrderIssueViewSet(viewsets.ModelViewSet):
    queryset = OrderIssue.objects.all()
    serializer_class = OrderIssueSerializer
    
    def create(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the order
        order = get_object_or_404(Voucher, id=order_id)
        
        # Create order issue with denormalized data
        order_issue = OrderIssue.objects.create(
            order=order,
            account=order.account,
            item_name=order.item_name,
            created_by=request.user
        )
        
        serializer = self.get_serializer(order_issue)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

#### 2. List Order Issues
**GET** `/api/payments/order-issues/?page=1&page_size=10&search=query`

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 10)
- `search` (string): Search by bill_no, account name, or item name
- `status` (string): Filter by status (pending, in_progress, resolved, closed)

**Response (200 OK):**
```json
{
    "count": 42,
    "next": "http://api.example.com/api/payments/order-issues/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "order": {...},
            "account": {...},
            "item_name": {...},
            "order_ref": null,
            "status": "pending",
            "description": null,
            "created_at": "2025-12-03T10:30:00Z",
            "updated_at": "2025-12-03T10:30:00Z"
        }
    ]
}
```

**View:**
```python
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

class StandardPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderIssueViewSet(viewsets.ModelViewSet):
    queryset = OrderIssue.objects.all()
    serializer_class = OrderIssueSerializer
    pagination_class = StandardPagination
    
    def get_queryset(self):
        queryset = OrderIssue.objects.select_related('order', 'account', 'item_name')
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order__bill_no__icontains=search) |
                Q(account__account_name__icontains=search) |
                Q(item_name__name__icontains=search) |
                Q(order_ref__icontains=search)
            )
        
        # Status filter
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-created_at')
```

#### 3. Get Order Issue Detail
**GET** `/api/payments/order-issues/{id}/`

**Response (200 OK):**
```json
{
    "id": "uuid",
    "order": {...},
    "account": {...},
    "item_name": {...},
    "order_ref": null,
    "status": "pending",
    "description": null,
    "created_at": "2025-12-03T10:30:00Z",
    "updated_at": "2025-12-03T10:30:00Z"
}
```

#### 4. Update Order Issue
**PATCH** `/api/payments/order-issues/{id}/`

**Request Body (only include fields to update):**
```json
{
    "status": "in_progress",
    "order_ref": "ORD-2025-001",
    "description": "Customer requested modifications to the design"
}
```

**Response (200 OK):**
```json
{
    "id": "uuid",
    "order": {...},
    "account": {...},
    "item_name": {...},
    "order_ref": "ORD-2025-001",
    "status": "in_progress",
    "description": "Customer requested modifications to the design",
    "created_at": "2025-12-03T10:30:00Z",
    "updated_at": "2025-12-03T10:31:00Z"
}
```

**Note:** Only `order_ref`, `status`, and `description` should be updatable. The `order`, `account`, and `item_name` should be read-only.

#### 5. Delete Order Issue
**DELETE** `/api/payments/order-issues/{id}/`

**Response (204 No Content)**

#### 6. Export Order Issue to PDF
**GET** `/api/payments/order-issues/{id}/export/`

**Response (200 OK - File Download):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="order-issue-{bill_no}.pdf"`
- Body: PDF file binary

**Backend Logic:**
```python
from rest_framework.decorators import action
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from io import BytesIO

class OrderIssueViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        order_issue = self.get_object()
        
        # Create PDF
        buffer = BytesIO()
        pdf_canvas = canvas.Canvas(buffer, pagesize=letter)
        
        # Draw order issue details on PDF
        y = 750
        pdf_canvas.drawString(50, y, f"Order Issue Report")
        y -= 20
        pdf_canvas.drawString(50, y, f"Bill No: {order_issue.order.bill_no}")
        y -= 20
        pdf_canvas.drawString(50, y, f"Account: {order_issue.account.account_name if order_issue.account else 'N/A'}")
        y -= 20
        pdf_canvas.drawString(50, y, f"Item: {order_issue.item_name.name if order_issue.item_name else 'N/A'}")
        y -= 20
        pdf_canvas.drawString(50, y, f"Status: {order_issue.get_status_display()}")
        y -= 20
        pdf_canvas.drawString(50, y, f"Description: {order_issue.description or 'N/A'}")
        y -= 20
        pdf_canvas.drawString(50, y, f"Created: {order_issue.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        pdf_canvas.save()
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="order-issue-{order_issue.order.bill_no}.pdf"'
        return response
```

---

## Vouchers (Orders) API

The existing Vouchers API needs to support the Order Issue workflow.

### Ensure Voucher Model Has:

```python
class Voucher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bill_no = models.CharField(max_length=255)
    account = models.ForeignKey('Account', on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.ForeignKey('Item', on_delete=models.SET_NULL, null=True, blank=True)
    # ... other fields
    
    def to_dict(self):
        """Serialize to dict"""
        return {
            'id': str(self.id),
            'bill_no': self.bill_no,
            'account': self.account.to_dict() if self.account else None,
            'item_name': self.item_name.to_dict() if self.item_name else None,
            # ... other fields
        }
```

### Voucher Serializer Should Include:

```python
class VoucherSerializer(serializers.ModelSerializer):
    account = serializers.SerializerMethodField()
    item_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Voucher
        fields = ['id', 'bill_no', 'account', 'item_name', ...]
    
    def get_account(self, obj):
        if obj.account:
            return {
                'id': str(obj.account.id),
                'account_name': obj.account.account_name,
                'name': obj.account.account_name,
            }
        return None
    
    def get_item_name(self, obj):
        if obj.item_name:
            return {
                'id': str(obj.item_name.id),
                'name': obj.item_name.name,
            }
        return None
```

---

## Authentication & Session Flow

### Session-Based Authentication

The backend uses Django sessions with CSRF protection:

1. **CSRF Token Bootstrap**
   - **Endpoint:** `GET /api/auth/csrf`
   - **Response:** Sets `csrftoken` cookie
   - **Frontend:** Automatically calls this before first POST/PATCH/DELETE

2. **Login**
   - **Endpoint:** `POST /api/auth/login`
   - **Request Body:** `{"email": "user@example.com", "password": "password"}`
   - **Response:** Sets `sessionid` cookie, returns user object

3. **Authenticated Requests**
   - Include `sessionid` and `csrftoken` cookies with all requests
   - Include `X-CSRFToken` header in POST/PATCH/DELETE requests

4. **Auto Refresh (Optional)**
   - **Endpoint:** `POST /api/auth/refresh`
   - **Response:** Refreshes session

5. **Logout**
   - **Endpoint:** `POST /api/auth/logout`
   - **Response:** Clears session

### Django Settings Configuration

```python
# settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # ... your apps
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # ... other middleware
]

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400 * 7  # 7 days
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'  # Use 'None' if frontend is on different domain with HTTPS

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    # Add production domain
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
    ],
}

# CSRF Configuration
CSRF_COOKIE_SECURE = False  # Set to True in production
CSRF_COOKIE_HTTPONLY = False  # Must be False so frontend can read it
CSRF_COOKIE_SAMESITE = 'Lax'
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/csrf` | Get CSRF token |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh session |
| POST | `/api/payments/order-issues/` | Create order issue |
| GET | `/api/payments/order-issues/` | List order issues |
| GET | `/api/payments/order-issues/{id}/` | Get order issue detail |
| PATCH | `/api/payments/order-issues/{id}/` | Update order issue |
| DELETE | `/api/payments/order-issues/{id}/` | Delete order issue |
| GET | `/api/payments/order-issues/{id}/export/` | Export to PDF |
| GET | `/api/vouchers/` | List vouchers (orders) |
| GET | `/api/vouchers/{id}/` | Get voucher detail |
| GET | `/api/accounts/dropdown/` | Get accounts list |
| GET | `/api/vouchers/masters/` | Get item names (masters) |

---

## Database Models

### Required Models (Ensure these exist)

#### Account
```python
class Account(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    account_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=255, unique=True)
    # ... other fields
```

#### Item
```python
class Item(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    # ... other fields
```

#### Voucher (Order)
```python
class Voucher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    bill_no = models.CharField(max_length=255)
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True)
    item_name = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True)
    # ... other fields
```

#### OrderIssue (NEW)
- See "Order Issues Model & API" section above

---

## Implementation Checklist

### Phase 1: Models & Database
- [ ] Create `OrderIssue` model with all fields
- [ ] Add migrations: `makemigrations && migrate`
- [ ] Register model in Django admin
- [ ] Ensure Account and Item models have `to_dict()` methods
- [ ] Ensure Voucher model has `to_dict()` method

### Phase 2: Serializers & Views
- [ ] Create `OrderIssueSerializer`
- [ ] Create `OrderIssueViewSet` with:
  - [ ] List endpoint with pagination and search
  - [ ] Create endpoint (accepts order_id)
  - [ ] Retrieve endpoint
  - [ ] Update endpoint (PATCH only)
  - [ ] Delete endpoint
  - [ ] Export endpoint (PDF generation)

### Phase 3: URL Routing
- [ ] Register `OrderIssueViewSet` in router
- [ ] URL pattern: `/api/payments/order-issues/`
- [ ] Ensure all CRUD endpoints are accessible

### Phase 4: Authentication
- [ ] Configure session authentication
- [ ] Set CSRF cookie correctly
- [ ] Set CORS headers for frontend domain
- [ ] Implement `/api/auth/csrf` endpoint
- [ ] Implement `/api/auth/login` endpoint
- [ ] Implement `/api/auth/logout` endpoint

### Phase 5: PDF Export
- [ ] Install `reportlab` for PDF generation
- [ ] Implement PDF export endpoint
- [ ] Test PDF generation with sample data
- [ ] Ensure proper file download headers

### Phase 6: Testing
- [ ] Test create order issue endpoint
- [ ] Test list with pagination
- [ ] Test list with search filter
- [ ] Test get detail
- [ ] Test update
- [ ] Test delete
- [ ] Test PDF export
- [ ] Test with authentication

### Phase 7: Deployment
- [ ] Update CSRF and CORS settings for production domain
- [ ] Set `SECURE_SSL_REDIRECT = True`
- [ ] Set `SESSION_COOKIE_SECURE = True`
- [ ] Set `CSRF_COOKIE_SECURE = True`
- [ ] Deploy and test end-to-end

---

## Testing Examples

### Create Order Issue
```bash
curl -X POST http://localhost:8000/api/payments/order-issues/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: {csrf_token}" \
  -b "sessionid={session_id}" \
  -d '{"order_id": "12345678-1234-5678-1234-567812345678"}'
```

### List Order Issues
```bash
curl http://localhost:8000/api/payments/order-issues/?page=1&page_size=10&search=bill \
  -b "sessionid={session_id}"
```

### Update Order Issue
```bash
curl -X PATCH http://localhost:8000/api/payments/order-issues/uuid/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: {csrf_token}" \
  -b "sessionid={session_id}" \
  -d '{"status": "in_progress", "description": "Working on it"}'
```

### Export to PDF
```bash
curl -X GET http://localhost:8000/api/payments/order-issues/uuid/export/ \
  -b "sessionid={session_id}" \
  -o order-issue.pdf
```

---

## Frontend API Integration

The frontend (`lib/backend.ts`) calls these endpoints:

```typescript
// Create order issue
POST /api/payments/order-issues/ { order_id: "uuid" }

// List order issues
GET /api/payments/order-issues/?page=1&page_size=10&search=query

// Get order issue detail
GET /api/payments/order-issues/{id}/

// Update order issue
PATCH /api/payments/order-issues/{id}/ { status, description, order_ref }

// Delete order issue
DELETE /api/payments/order-issues/{id}/

// Export to PDF
GET /api/payments/order-issues/{id}/export/
```

All requests include:
- `Cookie: sessionid={session_id}; csrftoken={csrf_token}`
- `Header: X-CSRFToken: {csrf_token}`
- `Content-Type: application/json`

---

## Notes

1. **UUID vs ID**: Use UUIDs for all primary keys to match frontend expectations
2. **Denormalization**: OrderIssue stores copies of account and item_name for quick access
3. **Immutable Order Reference**: Once created, the order reference should not change
4. **PDF Export**: Use reportlab or WeasyPrint for PDF generation
5. **Search**: Implement full-text search across bill_no, account name, and item name
6. **Pagination**: Always implement cursor or offset pagination for list endpoints
7. **Error Handling**: Return meaningful HTTP status codes (400, 404, 500, etc.)
8. **Timestamps**: Use ISO 8601 format for all datetime fields

