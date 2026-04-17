from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "id",
        "email",
        "username",
        "name",
        "role",
        "task_role",
        "department",
        "company",
        "is_active",
        "created_at",
    )
    list_filter = (
        "role",
        "task_role",
        "department",
        "is_active",
        "company",
        "is_staff",
        "is_superuser",
    )
    search_fields = ("email", "username", "name")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("name", "company", "branch")}),
        (
            "Task Management",
            {
                "fields": (
                    "task_role",
                    "department",
                    "sub_department",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "name",
                    "password1",
                    "password2",
                    "company",
                    "branch",
                    "role",
                    "task_role",
                    "department",
                    "sub_department",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at")
