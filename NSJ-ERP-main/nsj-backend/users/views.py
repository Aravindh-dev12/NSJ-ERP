# users/views.py
import json
from functools import wraps

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from nsj_backend.authentication import CsrfExemptSessionAuthentication

User = get_user_model()


def require_session(view_func):
    """Return 401 instead of redirecting when the request lacks an authenticated user."""

    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required"}, status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped


@ensure_csrf_cookie
@require_http_methods(["GET", "OPTIONS"])
def csrf_probe(request):
    # GET /api/auth/csrf — sets csrftoken cookie for the SPA to read if you later want CSRF
    # OPTIONS for CORS preflight (handled by SimpleCorsMiddleware)
    return JsonResponse({"detail": "ok"})


@csrf_exempt  # keep for login to avoid CSRF setup during local dev
@require_http_methods(["POST", "OPTIONS"])
def login_view(request):
    """
    POST /api/auth/login
    body: { "email": "admin@nsj.com", "password": "admin123" }
    Returns JWT tokens for Safari/iOS compatibility + creates Django session for admin panel.
    OPTIONS requests are handled by SimpleCorsMiddleware.
    """
    # OPTIONS is handled by SimpleCorsMiddleware, but just in case
    if request.method == "OPTIONS":
        return JsonResponse({"detail": "ok"})

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    identifier = (payload.get("email") or payload.get("username") or "").strip()
    password = payload.get("password")
    if not identifier or not password:
        return JsonResponse({"detail": "email/username and password required"}, status=400)

    try:
        if "@" in identifier:
            user_obj = User.objects.get(email__iexact=identifier)
        else:
            user_obj = User.objects.get(username__iexact=identifier)
    except User.DoesNotExist:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    # Use email for authentication since USERNAME_FIELD = "email"
    user = authenticate(request, email=user_obj.email, password=password)
    if not user:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    # Generate JWT tokens for Safari/iOS compatibility
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # Still create session for admin panel and desktop browsers
    login(request, user)

    return JsonResponse(
        {
            "message": "logged in",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {"id": str(user.id), "email": user.email, "name": user.name},
        },
        status=200,
    )


@api_view(["GET"])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET /api/auth/me
    Returns current user information.
    Supports both JWT token (Authorization header) and session authentication.
    """
    user = request.user
    return Response(
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "task_role": user.task_role,
            "department": user.department,
            "sub_department": user.sub_department,
        },
        status=200,
    )


@api_view(["POST"])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout
    Logout user (clears session).
    Supports both JWT and session authentication.
    """
    logout(request)
    return Response({"message": "logged out"}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def refresh_view(request):
    """
    POST /api/auth/refresh
    Refresh JWT access token using the refresh token from the request body.
    No session fallback — if the refresh token is missing or expired, returns 401.
    """
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid request body"}, status=400)

    refresh_token = payload.get("refresh_token") or payload.get("refresh")
    if not refresh_token:
        return JsonResponse({"detail": "Refresh token required"}, status=401)

    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        return JsonResponse(
            {"message": "token refreshed", "access_token": access_token},
            status=200,
        )
    except Exception:
        return JsonResponse({"detail": "Refresh token is invalid or expired"}, status=401)


def _serialize_user(u):
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "username": u.username,
        "role": u.role,
        "department": u.department,
        "is_active": u.is_active,
        "plain_password": u.plain_password or "",
        "created_at": u.created_at.isoformat(),
    }


def _is_admin(user):
    return user.role in ("SUPER_ADMIN", "ADMIN")


@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def user_list_create_view(request):
    """GET /api/users/  —  list all users for this company
       POST /api/users/ — create a new user (admin only)"""
    if not _is_admin(request.user):
        return Response({"detail": "Permission denied"}, status=403)

    company = getattr(request.user, "company", None)
    if not company:
        return Response({"detail": "No company assigned"}, status=400)

    if request.method == "GET":
        qs = User.objects.filter(company=company).order_by("-created_at")
        return Response({"results": [_serialize_user(u) for u in qs]}, status=200)

    # POST — create user
    data = request.data
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    department = data.get("department") or ""
    role = data.get("role") or "EMPLOYEE"

    if not name or not email or not password:
        return Response({"detail": "name, email and password are required"}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return Response({"detail": "A user with this email already exists"}, status=400)

    username = email.split("@")[0]
    base = username
    counter = 1
    while User.objects.filter(username__iexact=username).exists():
        username = f"{base}{counter}"
        counter += 1

    new_user = User.objects.create_user(
        email=email,
        username=username,
        password=password,
        name=name,
        company=company,
        department=department,
        role=role if role in ("SUPER_ADMIN", "ADMIN", "EMPLOYEE") else "EMPLOYEE",
        is_active=True,
        plain_password=password,
    )
    return Response(_serialize_user(new_user), status=201)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def user_detail_view(request, pk):
    """GET/PUT/PATCH/DELETE /api/users/<pk>/ — admin only"""
    if not _is_admin(request.user):
        return Response({"detail": "Permission denied"}, status=403)

    company = getattr(request.user, "company", None)
    try:
        u = User.objects.get(pk=pk, company=company)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    if request.method == "GET":
        return Response(_serialize_user(u), status=200)

    if request.method == "DELETE":
        if str(u.id) == str(request.user.id):
            return Response({"detail": "You cannot delete your own account"}, status=400)
        u.delete()
        return Response(status=204)

    # PUT / PATCH
    data = request.data
    if "name" in data:
        u.name = data["name"].strip()
    if "email" in data:
        new_email = data["email"].strip().lower()
        if new_email != u.email and User.objects.filter(email__iexact=new_email).exclude(pk=u.pk).exists():
            return Response({"detail": "A user with this email already exists"}, status=400)
        u.email = new_email
    if "department" in data:
        u.department = data["department"]
    if "role" in data and data["role"] in ("SUPER_ADMIN", "ADMIN", "EMPLOYEE"):
        u.role = data["role"]
    if "is_active" in data:
        if str(u.id) == str(request.user.id) and not data["is_active"]:
            return Response({"detail": "You cannot deactivate your own account"}, status=400)
        u.is_active = bool(data["is_active"])
    if "password" in data and data["password"].strip():
        u.set_password(data["password"].strip())
        u.plain_password = data["password"].strip()
    u.save()
    return Response(_serialize_user(u), status=200)


@api_view(["GET"])
@authentication_classes([JWTAuthentication, CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def active_users_dropdown_view(request):
    """GET /api/users/active/ — returns active users for assignment dropdowns.
    Optionally filter by ?department=SALES"""
    company = getattr(request.user, "company", None)
    qs = User.objects.filter(company=company, is_active=True).order_by("name")
    dept = request.GET.get("department")
    if dept:
        qs = qs.filter(department=dept)
    data = [{"id": str(u.id), "name": u.name, "email": u.email, "department": u.department} for u in qs]
    return Response(data, status=200)
