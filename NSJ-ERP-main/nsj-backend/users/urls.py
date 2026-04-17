from django.urls import path
from .views import (
    csrf_probe,
    login_view,
    logout_view,
    me_view,
    refresh_view,
    user_list_create_view,
    user_detail_view,
    active_users_dropdown_view,
)

urlpatterns = [
    path("auth/csrf", csrf_probe, name="csrf"),
    path("auth/login", login_view, name="login"),
    path("auth/refresh", refresh_view, name="refresh"),
    path("auth/me", me_view, name="me"),
    path("auth/logout", logout_view, name="logout"),
    path("users/", user_list_create_view, name="user-list-create"),
    path("users/active/", active_users_dropdown_view, name="users-active"),
    path("users/<uuid:pk>/", user_detail_view, name="user-detail"),
]
