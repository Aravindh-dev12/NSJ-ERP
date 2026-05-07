from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskNotification, TaskStatusHistory
from users.models import User

# ID mapping for internal users - maps to user names for database independence
HARDCODED_USER_MAPPING = {
    "1": "Niti",
    "2": "Mehul",
    "3": "Jinu Bhai",
    "4": "Sandhya",
    "5": "Sanjana",
    "6": "Pradip Bhai",
}


def convert_hardcoded_ids_to_users(hardcoded_ids):
    """Convert hardcoded string IDs to actual User objects by name"""
    if not hardcoded_ids:
        return []

    from users.models import User

    user_names = [
        HARDCODED_USER_MAPPING.get(hid) for hid in hardcoded_ids if hid in HARDCODED_USER_MAPPING
    ]
    return User.objects.filter(name__in=user_names)


def convert_hardcoded_id_to_user(hardcoded_id):
    """Convert single hardcoded string ID to User object by name"""
    if not hardcoded_id:
        return None

    user_name = HARDCODED_USER_MAPPING.get(hardcoded_id)
    if user_name:
        from users.models import User

        try:
            return User.objects.get(name=user_name)
        except User.DoesNotExist:
            return None
    return None


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user serializer for dropdowns"""

    class Meta:
        model = User
        fields = ["id", "name", "email"]


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer for list and detail views"""

    assigned_to_details = UserMinimalSerializer(source="assigned_to", read_only=True)
    assignees_details = serializers.SerializerMethodField()
    created_by_details = UserMinimalSerializer(source="created_by", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    department_display = serializers.CharField(source="get_department_display", read_only=True)
    sub_department_display = serializers.CharField(
        source="get_sub_department_display", read_only=True
    )
    is_overdue = serializers.SerializerMethodField()
    # Return assigned_to_name if no real user is assigned
    assigned_person_name = serializers.SerializerMethodField()
    # Return all assignee names (single + multiple)
    all_assignee_names = serializers.SerializerMethodField()
    # Return full URL for completion_proof
    completion_proof_url = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "deadline",
            "urgency",
            "urgency_display",
            "output_medium",
            "department",
            "department_display",
            "sub_department",
            "sub_department_display",
            "assigned_to",
            "assigned_to_details",
            "assignees",
            "assignees_details",
            "assigned_to_name",
            "assigned_person_name",
            "all_assignee_names",
            "created_by",
            "created_by_details",
            "status",
            "status_display",
            "attachment",
            "requires_completion_proof",
            "completion_proof",
            "completion_proof_url",
            "completion_notes",
            "created_at",
            "updated_at",
            "completed_at",
            "is_overdue",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "completed_at"]

    def get_is_overdue(self, obj):
        if obj.status == "COMPLETED":
            return False
        if isinstance(obj.deadline, str):
            from datetime import datetime

            deadline = datetime.strptime(obj.deadline, "%Y-%m-%d").date()
        else:
            deadline = obj.deadline
        return deadline < timezone.now().date()

    def get_assigned_person_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.name
        elif obj.assigned_to_name:
            return obj.assigned_to_name
        return "Unassigned"

    def get_assignees_details(self, obj):
        try:
            return UserMinimalSerializer(obj.assignees.all(), many=True).data
        except Exception:
            return []

    def get_all_assignee_names(self, obj):
        try:
            return obj.get_assignee_names()
        except Exception:
            return []

    def get_completion_proof_url(self, obj):
        if obj.completion_proof:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.completion_proof.url)
            return obj.completion_proof.url
        return None


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks"""

    assignees = serializers.ListField(
        child=serializers.CharField(),  # Changed from UUIDField to CharField
        required=False,
        allow_empty=True,
        help_text="List of user IDs to assign to this task (accepts simple IDs like '1', '2', '3')",
    )

    assigned_to = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Single user ID to assign to this task (accepts simple IDs like '1', '2', '3')",
    )

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "deadline",
            "urgency",
            "output_medium",
            "department",
            "sub_department",
            "assigned_to",
            "assignees",
            "assigned_to_name",
            "attachment",
            "requires_completion_proof",
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Task title is required and cannot be empty.")
        return value.strip()

    def validate_deadline(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value

    def validate_assigned_to(self, value):
        if not value:
            return value

        user = convert_hardcoded_id_to_user(value)
        request = self.context.get("request")

        # Skip validation in development mode or for hardcoded users
        if (
            not request
            or not request.user
            or not request.user.is_authenticated
            or value in HARDCODED_USER_MAPPING
        ):
            if not user:
                raise serializers.ValidationError(f"User with ID {value} does not exist.")
            return value

        # Normal validation for authenticated requests
        if not user:
            raise serializers.ValidationError(f"User with ID {value} does not exist.")

        if user.company != request.user.company:
            raise serializers.ValidationError(
                f"Cannot assign task to user {user.name} from different company."
            )

        return value

    def validate_assignees(self, value):
        if not value:
            return value

        users = convert_hardcoded_ids_to_users(value)
        request = self.context.get("request")

        # Skip validation in development mode or for all hardcoded users
        if (
            not request
            or not request.user
            or not request.user.is_authenticated
            or all(hid in HARDCODED_USER_MAPPING for hid in value)
        ):
            if len(users) != len(value):
                raise serializers.ValidationError("Some users do not exist.")
            return value

        # Normal validation for authenticated requests
        if len(users) != len(value):
            raise serializers.ValidationError("Some users do not exist.")

        # Check company validation for non-hardcoded users
        for user in users:
            if user.company != request.user.company:
                raise serializers.ValidationError(
                    f"Cannot assign task to user {user.name} from different company."
                )

        return value

    def create(self, validated_data):
        assignees_data = validated_data.pop("assignees", [])
        assigned_to_data = validated_data.pop("assigned_to", None)
        request = self.context.get("request")

        # Convert assigned_to hardcoded ID to User object
        if assigned_to_data:
            assigned_to_user = convert_hardcoded_id_to_user(assigned_to_data)
            if assigned_to_user:
                validated_data["assigned_to"] = assigned_to_user

        # Set created_by and company if not already provided
        if "created_by" not in validated_data or validated_data.get("created_by") is None:
            if request and request.user and request.user.is_authenticated:
                validated_data["created_by"] = request.user
                validated_data["company"] = request.user.company
            else:
                # Development mode: use first user and company
                from users.models import User
                from core.models import Company

                try:
                    first_user = User.objects.first()
                    first_company = Company.objects.first()
                    if first_user:
                        validated_data["created_by"] = first_user
                    if first_company:
                        validated_data["company"] = first_company
                except Exception:
                    pass

        task = super().create(validated_data)

        # Set multiple assignees
        if assignees_data:
            assignee_users = convert_hardcoded_ids_to_users(assignees_data)
            task.assignees.set(assignee_users)
            # Note: Notifications for multiple assignees are handled by m2m_changed signal

        # Note: Notifications for single assignee and creator are handled by post_save signal
        # in tasks/signals.py - no need to create them here

        return task


class TaskUpdateSerializer(TaskCreateSerializer):
    """Serializer for updating tasks - inherits validation from TaskCreateSerializer"""

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "deadline",
            "urgency",
            "output_medium",
            "department",
            "sub_department",
            "assigned_to",
            "assignees",
            "status",
            "attachment",
        ]

    def update(self, instance, validated_data):
        request = self.context.get("request")
        old_assigned_to = instance.assigned_to
        old_assignees = list(instance.assignees.all())
        old_status = instance.status

        assignees_data = validated_data.pop("assignees", None)
        assigned_to_data = validated_data.pop("assigned_to", None)

        # Convert assigned_to hardcoded ID to User object
        if assigned_to_data is not None:
            if assigned_to_data:
                assigned_to_user = convert_hardcoded_id_to_user(assigned_to_data)
                if assigned_to_user:
                    validated_data["assigned_to"] = assigned_to_user
            else:
                validated_data["assigned_to"] = None

        # Auto-set completed_at when status changes to COMPLETED
        if validated_data.get("status") == "COMPLETED" and instance.status != "COMPLETED":
            validated_data["completed_at"] = timezone.now()
        elif validated_data.get("status") != "COMPLETED":
            validated_data["completed_at"] = None

        task = super(TaskCreateSerializer, self).update(instance, validated_data)

        # Update multiple assignees if provided
        if assignees_data is not None:
            assignee_users = convert_hardcoded_ids_to_users(assignees_data)
            task.assignees.set(assignee_users)

        # Create status history entry if status changed
        new_status = validated_data.get("status")
        if new_status and new_status != old_status:
            changed_by_user = None
            if request and request.user and request.user.is_authenticated:
                changed_by_user = request.user
            else:
                from users.models import User

                try:
                    changed_by_user = User.objects.first()
                except User.DoesNotExist:
                    pass

            TaskStatusHistory.objects.create(
                task=task,
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by_user,
                notes="Status updated via task edit",
            )

        # Create notifications for newly assigned users
        current_assignees = task.get_all_assignees()
        previous_assignees = old_assignees + ([old_assigned_to] if old_assigned_to else [])
        newly_assigned = [user for user in current_assignees if user not in previous_assignees]

        for user in newly_assigned:
            if not request or user != request.user:
                TaskNotification.objects.create(
                    user=user,
                    task=task,
                    message=f"You have been assigned to task: {task.title}",
                )

        # Create notification for admin users when status changes to NEED_FOUNDER
        if new_status == "NEED_FOUNDER" and old_status != "NEED_FOUNDER":
            from users.models import User

            if task.company:
                admin_users = User.objects.filter(
                    company=task.company, role__in=["ADMIN", "SUPER_ADMIN"], is_active=True
                )
                assignee_names = task.get_assignee_names()
                assignee_text = ", ".join(assignee_names) if assignee_names else "Unassigned"

                for admin in admin_users:
                    if not request or admin != request.user:
                        TaskNotification.objects.create(
                            user=admin,
                            task=task,
                            message=f"Task '{task.title}' needs founder intervention (assigned to: {assignee_text})",
                        )

        return task


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for quick status updates"""

    notes = serializers.CharField(required=False, allow_blank=True)
    completion_proof = serializers.FileField(required=False, allow_null=True)
    completion_notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Task
        fields = ["status", "notes", "completion_proof", "completion_notes"]

    def validate_status(self, value):
        if not value:
            raise serializers.ValidationError("Status is required.")
        valid_statuses = [choice[0] for choice in Task.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        return value

    def validate(self, attrs):
        instance = self.instance
        new_status = attrs.get("status")
        completion_proof = attrs.get("completion_proof")

        # If marking as COMPLETED and task requires proof
        if new_status == "COMPLETED" and instance and instance.requires_completion_proof:
            if not completion_proof and not instance.completion_proof:
                raise serializers.ValidationError(
                    {
                        "completion_proof": "This task requires proof of completion. Please upload a file/image."
                    }
                )
        return attrs

    def update(self, instance, validated_data):
        request = self.context.get("request")
        old_status = instance.status
        notes = validated_data.pop("notes", "")
        completion_proof = validated_data.pop("completion_proof", None)
        completion_notes = validated_data.pop("completion_notes", None)

        if completion_proof:
            instance.completion_proof = completion_proof
        if completion_notes:
            instance.completion_notes = completion_notes

        if validated_data.get("status") == "COMPLETED" and instance.status != "COMPLETED":
            validated_data["completed_at"] = timezone.now()
        elif validated_data.get("status") != "COMPLETED":
            validated_data["completed_at"] = None

        task = super().update(instance, validated_data)

        # Create status history entry
        new_status = validated_data.get("status")
        if new_status and new_status != old_status:
            changed_by_user = None
            if request and request.user and request.user.is_authenticated:
                changed_by_user = request.user
            else:
                from users.models import User

                try:
                    changed_by_user = User.objects.first()
                except User.DoesNotExist:
                    pass

            TaskStatusHistory.objects.create(
                task=task,
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by_user,
                notes=notes
                or f"Status updated from {dict(Task.STATUS_CHOICES).get(old_status, old_status)} to {dict(Task.STATUS_CHOICES).get(new_status, new_status)}",
            )

        # Create notification for admin users when status changes to NEED_FOUNDER
        if new_status == "NEED_FOUNDER" and old_status != "NEED_FOUNDER":
            from users.models import User

            if task.company:
                admin_users = User.objects.filter(
                    company=task.company, role__in=["ADMIN", "SUPER_ADMIN"], is_active=True
                )
                for admin in admin_users:
                    if not request or not request.user.is_authenticated or admin != request.user:
                        TaskNotification.objects.create(
                            user=admin,
                            task=task,
                            message=f"Task '{task.title}' needs founder intervention (assigned to: {task.assigned_to.name if task.assigned_to else 'Unassigned'})",
                        )

        return task


class TaskStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for task status history"""

    changed_by_details = UserMinimalSerializer(source="changed_by", read_only=True)
    old_status_display = serializers.SerializerMethodField()
    new_status_display = serializers.SerializerMethodField()

    class Meta:
        model = TaskStatusHistory
        fields = [
            "id",
            "old_status",
            "old_status_display",
            "new_status",
            "new_status_display",
            "changed_by",
            "changed_by_details",
            "changed_at",
            "notes",
        ]
        read_only_fields = ["id", "changed_at"]

    def get_old_status_display(self, obj):
        if obj.old_status:
            return dict(Task.STATUS_CHOICES).get(obj.old_status, obj.old_status)
        return "Initial"

    def get_new_status_display(self, obj):
        return dict(Task.STATUS_CHOICES).get(obj.new_status, obj.new_status)


class TaskNotificationSerializer(serializers.ModelSerializer):
    """Serializer for task notifications"""

    task_title = serializers.CharField(source="task.title", read_only=True)
    task_id = serializers.UUIDField(source="task.id", read_only=True)

    class Meta:
        model = TaskNotification
        fields = ["id", "task_id", "task_title", "message", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
