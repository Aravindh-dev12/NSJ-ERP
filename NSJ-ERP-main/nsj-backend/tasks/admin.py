from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Task, TaskNotification, TaskStatusHistory


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "assigned_to",
        "department",
        "urgency_badge",
        "status_badge",
        "deadline",
        "is_overdue",
        "created_by",
        "created_at",
    ]
    list_filter = ["status", "urgency", "department", "created_at", "deadline"]
    search_fields = ["title", "description", "assigned_to__name", "created_by__name"]
    readonly_fields = ["id", "created_at", "updated_at", "completed_at"]

    fieldsets = (
        (
            "Task Details",
            {"fields": ("title", "description", "deadline", "urgency", "output_medium")},
        ),
        ("Assignment", {"fields": ("department", "assigned_to", "created_by")}),
        ("Status & Files", {"fields": ("status", "attachment")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at", "completed_at"), "classes": ("collapse",)},
        ),
    )

    def urgency_badge(self, obj):
        colors = {"LOW": "#28a745", "MEDIUM": "#ffc107", "HIGH": "#fd7e14", "URGENT": "#dc3545"}
        color = colors.get(obj.urgency, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_urgency_display(),
        )

    urgency_badge.short_description = "Urgency"

    def status_badge(self, obj):
        colors = {
            "PENDING": "#6c757d",
            "COMPLETED": "#28a745",
            "STUCK": "#dc3545",
            "NEED_FOUNDER": "#e83e8c",
            "TRANSFERRED": "#17a2b8",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def is_overdue(self, obj):
        if obj.status == "COMPLETED":
            return format_html('<span style="color: #28a745;">✓ Completed</span>')
        elif obj.deadline < timezone.now().date():
            return format_html('<span style="color: #dc3545;">⚠ Overdue</span>')
        else:
            return format_html('<span style="color: #6c757d;">On Track</span>')

    is_overdue.short_description = "Status"

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new task
            obj.created_by = request.user
            obj.company = request.user.company

        # Auto-set completed_at when status changes to COMPLETED
        if obj.status == "COMPLETED" and (not change or form.initial.get("status") != "COMPLETED"):
            obj.completed_at = timezone.now()
        elif obj.status != "COMPLETED":
            obj.completed_at = None

        super().save_model(request, obj, form, change)


@admin.register(TaskStatusHistory)
class TaskStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ["task", "old_status_badge", "new_status_badge", "changed_by", "changed_at"]
    list_filter = ["old_status", "new_status", "changed_at"]
    search_fields = ["task__title", "changed_by__name", "notes"]
    readonly_fields = ["changed_at"]

    def old_status_badge(self, obj):
        if not obj.old_status:
            return format_html('<span style="color: #6c757d;">Initial</span>')
        colors = {
            "PENDING": "#6c757d",
            "COMPLETED": "#28a745",
            "STUCK": "#dc3545",
            "NEED_FOUNDER": "#e83e8c",
            "TRANSFERRED": "#17a2b8",
        }
        color = colors.get(obj.old_status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            dict(Task.STATUS_CHOICES).get(obj.old_status, obj.old_status),
        )

    old_status_badge.short_description = "From"

    def new_status_badge(self, obj):
        colors = {
            "PENDING": "#6c757d",
            "COMPLETED": "#28a745",
            "STUCK": "#dc3545",
            "NEED_FOUNDER": "#e83e8c",
            "TRANSFERRED": "#17a2b8",
        }
        color = colors.get(obj.new_status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            dict(Task.STATUS_CHOICES).get(obj.new_status, obj.new_status),
        )

    new_status_badge.short_description = "To"


@admin.register(TaskNotification)
class TaskNotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "task", "message_preview", "is_read", "created_at"]
    list_filter = ["is_read", "created_at"]
    search_fields = ["user__name", "task__title", "message"]
    readonly_fields = ["created_at"]

    def message_preview(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message

    message_preview.short_description = "Message"
