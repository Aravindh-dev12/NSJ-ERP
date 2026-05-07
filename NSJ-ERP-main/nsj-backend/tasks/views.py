from rest_framework import viewsets, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from .models import Task, TaskNotification, TaskStatusHistory
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusUpdateSerializer,
    TaskNotificationSerializer,
    TaskStatusHistorySerializer,
    UserMinimalSerializer,
)
from users.models import User


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session authentication that doesn't enforce CSRF for API calls"""

    def enforce_csrf(self, request):
        return  # Skip CSRF check for API


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for Task CRUD operations with role-based access control"""

    # Support both JWT (main ERP login) and session (browser/dev mode)
    authentication_classes = [JWTAuthentication, CsrfExemptSessionAuthentication]
    permission_classes = []  # Allow all - we handle permissions in get_queryset

    def _get_effective_user(self):
        """
        Get the effective user for this request.
        Priority: 1) Authenticated user (real login via session), 2) Simulated user (dev only), 3) None
        """
        # Check for authenticated session user (real login)
        if (
            self.request.user
            and hasattr(self.request.user, "is_authenticated")
            and self.request.user.is_authenticated
        ):
            return self.request.user

        # Check for simulated user (development mode)
        simulated_user_id = self.request.headers.get("X-Simulated-User-Id")
        if simulated_user_id:
            try:
                return User.objects.get(id=simulated_user_id)
            except User.DoesNotExist:
                pass

        return None

    def get_queryset(self):
        effective_user = self._get_effective_user()

        # If no user at all, return all tasks (pure dev mode)
        if not effective_user:
            queryset = Task.objects.all()
            queryset = self._apply_filters(queryset, user=None)
            try:
                return queryset.select_related("assigned_to", "created_by").prefetch_related(
                    "assignees"
                )
            except Exception:
                return queryset.select_related("assigned_to", "created_by")

        # Scope to user's company
        queryset = Task.objects.filter(company=effective_user.company)
        queryset = self._apply_role_based_filter(queryset, effective_user)
        queryset = self._apply_filters(queryset, user=effective_user)

        try:
            return queryset.select_related("assigned_to", "created_by").prefetch_related(
                "assignees"
            )
        except Exception:
            return queryset.select_related("assigned_to", "created_by")

        # Apply additional filters
        queryset = self._apply_filters(queryset, effective_user)

        try:
            return queryset.select_related("assigned_to", "created_by").prefetch_related(
                "assignees"
            )
        except Exception:
            # Fallback if assignees field doesn't exist yet (before migration)
            return queryset.select_related("assigned_to", "created_by")

    def _apply_role_based_filter(self, queryset, user):
        """
        Apply role-based filtering based on user's task_role:
        - FOUNDER: Can see all tasks globally
        - DEPT_HEAD: Can see all tasks in their department
        - SUB_DEPT_HEAD: Can see all tasks in their sub-department
        - INDIVIDUAL: Can only see tasks assigned to them or created by them
        """
        if user.can_view_all_tasks():
            # Founder/Admin: No filtering, can see everything
            return queryset

        if user.is_dept_head():
            # Department Head: See all tasks in their department + their own tasks
            return queryset.filter(
                Q(department=user.department)
                | Q(assigned_to=user)
                | Q(assignees=user)
                | Q(created_by=user)
            )

        if user.is_sub_dept_head():
            # Sub-Department Head: See tasks in their sub-department + their own tasks
            return queryset.filter(
                Q(department=user.department, sub_department=user.sub_department)
                | Q(assigned_to=user)
                | Q(assignees=user)
                | Q(created_by=user)
            )

        # Individual Contributor: Only their own tasks
        return queryset.filter(Q(assigned_to=user) | Q(assignees=user) | Q(created_by=user))

    def _apply_filters(self, queryset, user):
        """Apply query parameter filters to the queryset"""
        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by department
        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(department=department)

        # Filter by sub-department
        sub_department = self.request.query_params.get("sub_department")
        if sub_department:
            queryset = queryset.filter(sub_department=sub_department)

        # Filter by urgency
        urgency = self.request.query_params.get("urgency")
        if urgency:
            queryset = queryset.filter(urgency=urgency)

        # Filter by assigned user (only if user has permission to see others' tasks)
        assigned_to = self.request.query_params.get("assigned_to")
        if assigned_to and user and (user.can_view_all_tasks() or user.is_dept_head()):
            queryset = queryset.filter(Q(assigned_to_id=assigned_to) | Q(assignees__id=assigned_to))

        # Filter by assigned_to_name (for temp users)
        assigned_to_name = self.request.query_params.get("assigned_to_name")
        if assigned_to_name:
            queryset = queryset.filter(assigned_to_name__icontains=assigned_to_name)

        # Filter by creator
        created_by = self.request.query_params.get("created_by")
        if created_by and user and user.can_view_all_tasks():
            queryset = queryset.filter(created_by_id=created_by)

        # Filter for "my tasks" - tasks assigned to current user (single or multiple)
        my_tasks = self.request.query_params.get("my_tasks")
        if my_tasks == "true" and user:
            queryset = queryset.filter(
                Q(assigned_to=user) | Q(assignees=user) | Q(assigned_to_name=user.name)
            )

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(deadline__gte=date_from)
        if date_to:
            queryset = queryset.filter(deadline__lte=date_to)

        # Filter by overdue tasks
        overdue = self.request.query_params.get("overdue")
        if overdue == "true":
            from django.utils import timezone

            queryset = queryset.filter(
                deadline__lt=timezone.now().date(),
                status__in=["PENDING", "STUCK", "NEED_FOUNDER", "TRANSFERRED"],
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return TaskCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return TaskUpdateSerializer
        elif self.action == "update_status":
            return TaskStatusUpdateSerializer
        return TaskSerializer

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        """Quick status update endpoint"""
        task = self.get_object()
        serializer = TaskStatusUpdateSerializer(
            task, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def my_tasks(self, request):
        """Get tasks assigned to current user (Requirement 3.1)"""
        user = self._get_effective_user()
        if not user:
            return Response({"detail": "Authentication required"}, status=401)

        queryset = Task.objects.filter(company=user.company).filter(
            Q(assigned_to=user) | Q(assignees=user)
        )

        # Apply basic filtering for user's own tasks
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        department = request.query_params.get("department")
        if department:
            queryset = queryset.filter(department=department)

        urgency = request.query_params.get("urgency")
        if urgency:
            queryset = queryset.filter(urgency=urgency)

        try:
            queryset = queryset.select_related("assigned_to", "created_by").prefetch_related(
                "assignees"
            )
        except Exception:
            # Fallback if assignees field doesn't exist yet (before migration)
            queryset = queryset.select_related("assigned_to", "created_by")

        serializer = TaskSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def filter_options(self, request):
        """Get available filter options based on user's role"""
        effective_user = self._get_effective_user()

        # For development mode with no user
        if not effective_user:
            users = User.objects.filter(is_active=True)
            user_options = [{"id": str(u.id), "name": u.name, "email": u.email} for u in users]
            department_options = [
                {"value": choice[0], "label": choice[1]} for choice in Task.DEPARTMENT_CHOICES
            ]
            sub_department_options = [
                {"value": choice[0], "label": choice[1]} for choice in Task.SUB_DEPARTMENT_CHOICES
            ]
            status_options = [
                {"value": choice[0], "label": choice[1]} for choice in Task.STATUS_CHOICES
            ]
            urgency_options = [
                {"value": choice[0], "label": choice[1]} for choice in Task.URGENCY_CHOICES
            ]

            return Response(
                {
                    "users": user_options,
                    "departments": department_options,
                    "sub_departments": sub_department_options,
                    "statuses": status_options,
                    "urgencies": urgency_options,
                    "is_founder": True,
                    "is_dept_head": False,
                    "is_sub_dept_head": False,
                    "user_department": None,
                    "user_sub_department": None,
                    "task_role": "FOUNDER",
                }
            )

        can_view_all = effective_user.can_view_all_tasks()
        is_dept_head = effective_user.is_dept_head()
        is_sub_dept_head = effective_user.is_sub_dept_head()

        # Get users based on role
        if can_view_all:
            users = User.objects.filter(company=effective_user.company, is_active=True)
        elif is_dept_head:
            users = User.objects.filter(
                company=effective_user.company, department=effective_user.department, is_active=True
            )
        elif is_sub_dept_head:
            users = User.objects.filter(
                company=effective_user.company,
                department=effective_user.department,
                sub_department=effective_user.sub_department,
                is_active=True,
            )
        else:
            users = User.objects.filter(id=effective_user.id)

        user_options = [{"id": str(u.id), "name": u.name, "email": u.email} for u in users]

        # Get department choices based on role
        if can_view_all:
            department_options = [
                {"value": choice[0], "label": choice[1]} for choice in Task.DEPARTMENT_CHOICES
            ]
        elif is_dept_head or is_sub_dept_head:
            department_options = [
                {
                    "value": effective_user.department,
                    "label": dict(Task.DEPARTMENT_CHOICES).get(
                        effective_user.department, effective_user.department
                    ),
                }
            ]
        else:
            department_options = []

        # Get sub-department choices based on role
        sub_department_options = [
            {"value": choice[0], "label": choice[1]} for choice in Task.SUB_DEPARTMENT_CHOICES
        ]

        # Get status choices
        status_options = [
            {"value": choice[0], "label": choice[1]} for choice in Task.STATUS_CHOICES
        ]

        # Get urgency choices
        urgency_options = [
            {"value": choice[0], "label": choice[1]} for choice in Task.URGENCY_CHOICES
        ]

        return Response(
            {
                "users": user_options,
                "departments": department_options,
                "sub_departments": sub_department_options,
                "statuses": status_options,
                "urgencies": urgency_options,
                "is_founder": effective_user.is_founder(),
                "is_dept_head": is_dept_head,
                "is_sub_dept_head": is_sub_dept_head,
                "user_department": effective_user.department,
                "user_sub_department": effective_user.sub_department,
                "task_role": effective_user.task_role,
            }
        )

    @action(detail=False, methods=["get"])
    def users(self, request):
        """Get list of users for assignment dropdown based on role.

        Optional query param:
          ?department=PRODUCTION  — filter to users in that department only.
          Accepts User.DEPARTMENT_CHOICES keys (e.g. PRODUCTION, ACCOUNTS, SALES).
        """
        effective_user = self._get_effective_user()

        # Department filter from query param (used by process-step assignment popup)
        dept_filter = request.query_params.get("department", "").strip().upper()

        # For development mode
        if not effective_user:
            users = User.objects.filter(is_active=True)
            if dept_filter:
                users = users.filter(department=dept_filter)
            serializer = UserMinimalSerializer(users, many=True)
            return Response(serializer.data)

        # Filter users based on role
        if effective_user.can_view_all_tasks():
            users = User.objects.filter(company=effective_user.company, is_active=True)
        elif effective_user.is_dept_head():
            users = User.objects.filter(
                company=effective_user.company, department=effective_user.department, is_active=True
            )
        elif effective_user.is_sub_dept_head():
            users = User.objects.filter(
                company=effective_user.company,
                department=effective_user.department,
                sub_department=effective_user.sub_department,
                is_active=True,
            )
        else:
            users = User.objects.filter(company=effective_user.company, is_active=True)

        # Apply optional department filter on top of role-based queryset
        if dept_filter:
            users = users.filter(department=dept_filter)

        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def current_user_info(self, request):
        """Get current user's task management info"""
        import sys

        # Debug session info to stderr for Railway logs
        print(f"[CURRENT_USER_INFO] Session key: {request.session.session_key}", file=sys.stderr)
        print(f"[CURRENT_USER_INFO] Request user: {request.user}", file=sys.stderr)
        print(
            f"[CURRENT_USER_INFO] Is authenticated: {request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else 'N/A'}",
            file=sys.stderr,
        )
        print(f"[CURRENT_USER_INFO] Cookies: {list(request.COOKIES.keys())}", file=sys.stderr)

        # Check if user is authenticated via session FIRST
        is_session_authenticated = (
            request.user
            and hasattr(request.user, "is_authenticated")
            and request.user.is_authenticated
        )

        effective_user = self._get_effective_user()

        print(f"[CURRENT_USER_INFO] Effective user: {effective_user}", file=sys.stderr)
        print(
            f"[CURRENT_USER_INFO] Is session authenticated: {is_session_authenticated}",
            file=sys.stderr,
        )

        # For development mode with no user at all
        if not effective_user:
            return Response(
                {
                    "id": None,
                    "name": "Development User",
                    "email": "dev@nsj.com",
                    "task_role": "FOUNDER",
                    "task_role_display": "Founder",
                    "department": None,
                    "department_display": None,
                    "sub_department": None,
                    "sub_department_display": None,
                    "can_view_all_tasks": True,
                    "can_view_department_tasks": True,
                    "can_view_sub_department_tasks": True,
                    "is_authenticated": False,
                    "is_simulated": False,
                    "show_switch_user": True,
                }
            )

        # Check if this is a dev user who should see Switch User
        is_dev_user = effective_user.name in ["Admin1", "Aryan"] or effective_user.email in [
            "admin123@gmail.com",
            "admin27@gmail.com",
        ]

        print(
            f"[CURRENT_USER_INFO] Returning user info for: {effective_user.name} - task_role: {effective_user.task_role}",
            file=sys.stderr,
        )

        return Response(
            {
                "id": str(effective_user.id),
                "name": effective_user.name,
                "email": effective_user.email,
                "task_role": effective_user.task_role,
                "task_role_display": effective_user.get_task_role_display(),
                "department": effective_user.department,
                "department_display": effective_user.get_department_display()
                if effective_user.department
                else None,
                "sub_department": effective_user.sub_department,
                "sub_department_display": effective_user.get_sub_department_display()
                if effective_user.sub_department
                else None,
                "can_view_all_tasks": effective_user.can_view_all_tasks(),
                "can_view_department_tasks": effective_user.can_view_department_tasks(),
                "can_view_sub_department_tasks": effective_user.can_view_sub_department_tasks(),
                "is_authenticated": is_session_authenticated,  # True only for real session login
                "is_simulated": not is_session_authenticated and effective_user is not None,
                "show_switch_user": is_dev_user or not is_session_authenticated,
            }
        )

    def perform_create(self, serializer):
        """Ensure task is created with proper company scoping and correct created_by"""
        effective_user = self._get_effective_user()

        if effective_user:
            serializer.save(created_by=effective_user, company=effective_user.company)
        else:
            # Fallback to first user (development mode without any user)
            from core.models import Company

            first_user = User.objects.first()
            first_company = Company.objects.first()
            serializer.save(created_by=first_user, company=first_company)

    def create(self, request, *args, **kwargs):
        """Override create to handle response serialization properly"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Get the created task and use TaskSerializer for the response
        task = serializer.instance
        response_serializer = TaskSerializer(task, context={"request": request})
        headers = self.get_success_headers(response_serializer.data)

        from rest_framework import status

        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        """Ensure task updates maintain company scoping"""
        # Permission check is already done in get_object(), just save
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a task and automatically mark related notifications as read.
        This reduces the notification counter when user opens a task.
        """
        instance = self.get_object()
        effective_user = self._get_effective_user()

        # Mark notifications as read for this task and user
        if effective_user:
            TaskNotification.objects.filter(
                user=effective_user, task=instance, is_read=False
            ).update(is_read=True)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_object(self):
        """Override to handle permission checks properly using effective user"""
        effective_user = self._get_effective_user()

        # Get the object without filtering for permission checks
        if effective_user:
            queryset = Task.objects.filter(company=effective_user.company)
        else:
            # Development mode: allow access to all tasks
            queryset = Task.objects.all()

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}

        try:
            obj = queryset.get(**filter_kwargs)
        except Task.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound("Task not found.")

        # Check permissions for specific actions (only if we have an effective user)
        if effective_user:
            # Check if user has admin/founder level access
            is_admin = (
                effective_user.role in ["ADMIN", "SUPER_ADMIN"] or effective_user.is_superuser
            )
            can_view_all = effective_user.can_view_all_tasks()
            is_dept_head = effective_user.is_dept_head()
            is_sub_dept_head = effective_user.is_sub_dept_head()

            # Check if user can access this task based on role
            can_access = False

            if is_admin or can_view_all:
                # Founder/Admin can access all tasks
                can_access = True
            elif is_dept_head:
                # Dept head can access tasks in their department or assigned to them
                can_access = (
                    obj.department == effective_user.department
                    or obj.is_assigned_to_user(effective_user)
                    or obj.created_by == effective_user
                )
            elif is_sub_dept_head:
                # Sub-dept head can access tasks in their sub-department or assigned to them
                can_access = (
                    (
                        obj.department == effective_user.department
                        and obj.sub_department == effective_user.sub_department
                    )
                    or obj.is_assigned_to_user(effective_user)
                    or obj.created_by == effective_user
                )
            else:
                # Individual contributor can only access their own tasks
                can_access = (
                    obj.is_assigned_to_user(effective_user) or obj.created_by == effective_user
                )

            # For retrieve actions, check if user can view this task
            if self.action == "retrieve" and not can_access:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You don't have permission to view this task.")

            # For update actions, check if user has permission
            if self.action in [
                "update",
                "partial_update",
                "update_status",
                "update_status_with_notes",
            ]:
                # For updates, user must be admin, assigned to the task (by FK or name), or created it
                can_update = (
                    is_admin
                    or can_view_all
                    or obj.is_assigned_to_user(effective_user)
                    or obj.created_by == effective_user
                )
                if not can_update:
                    from rest_framework.exceptions import PermissionDenied

                    raise PermissionDenied(
                        "You can only update tasks assigned to you or created by you."
                    )

        return obj

    @action(detail=False, methods=["get"])
    def admin_all(self, request):
        """Get all tasks for admin users only (Requirement 4.1, 4.9)"""
        user = request.user
        is_admin = user.role in ["ADMIN", "SUPER_ADMIN"] or user.is_superuser

        # Requirement 4.9: Restrict admin views to admin users only
        if not is_admin:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only admin users can access all tasks.")

        # Start with all tasks in the company
        queryset = Task.objects.filter(company=user.company)

        # Apply comprehensive filtering (Requirements 4.5-4.8)
        queryset = self._apply_filters(queryset, is_admin=True)

        queryset = queryset.select_related("assigned_to", "created_by")
        serializer = TaskSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get task statistics for dashboard based on user's role"""
        import sys

        effective_user = self._get_effective_user()

        print(f"[STATS] Effective user: {effective_user}", file=sys.stderr)

        # For development mode with no user
        if not effective_user:
            all_tasks = Task.objects.all()
            return Response(
                {
                    "my_pending": 0,
                    "my_completed": 0,
                    "my_stuck": 0,
                    "my_need_founder": 0,
                    "my_total": 0,
                    "visible_pending": all_tasks.filter(status="PENDING").count(),
                    "visible_completed": all_tasks.filter(status="COMPLETED").count(),
                    "visible_need_founder": all_tasks.filter(status="NEED_FOUNDER").count(),
                    "visible_total": all_tasks.count(),
                    "task_role": "FOUNDER",
                    "can_view_all": True,
                }
            )

        # Get tasks visible to this user based on role
        visible_qs = self._apply_role_based_filter(
            Task.objects.filter(company=effective_user.company), effective_user
        )

        print(
            f"[STATS] User {effective_user.name} - task_role: {effective_user.task_role}, department: {effective_user.department}",
            file=sys.stderr,
        )
        print(f"[STATS] Visible tasks count: {visible_qs.count()}", file=sys.stderr)

        # Get user's own tasks (assigned to them by name or user FK)
        my_qs = Task.objects.filter(company=effective_user.company).filter(
            Q(assigned_to=effective_user) | Q(assigned_to_name=effective_user.name)
        )

        print(f"[STATS] My tasks count: {my_qs.count()}", file=sys.stderr)

        return Response(
            {
                "my_pending": my_qs.filter(status="PENDING").count(),
                "my_completed": my_qs.filter(status="COMPLETED").count(),
                "my_stuck": my_qs.filter(status="STUCK").count(),
                "my_need_founder": my_qs.filter(status="NEED_FOUNDER").count(),
                "my_total": my_qs.count(),
                "visible_pending": visible_qs.filter(status="PENDING").count(),
                "visible_completed": visible_qs.filter(status="COMPLETED").count(),
                "visible_need_founder": visible_qs.filter(status="NEED_FOUNDER").count(),
                "visible_total": visible_qs.count(),
                "task_role": effective_user.task_role,
                "can_view_all": effective_user.can_view_all_tasks(),
                "department": effective_user.department,
                "sub_department": effective_user.sub_department,
            }
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get simple task summary for dashboard widgets"""
        import sys

        effective_user = self._get_effective_user()

        # Get department filter if provided
        department_id = request.query_params.get("department")

        # Start with all tasks or user's company tasks
        if effective_user:
            queryset = Task.objects.filter(company=effective_user.company)
            # Apply role-based filtering
            queryset = self._apply_role_based_filter(queryset, effective_user)
        else:
            queryset = Task.objects.all()

        # Filter by department if provided
        if department_id:
            try:
                from core.models import Department

                department = Department.objects.get(id=department_id)

                # Map Department code to Task department field
                department_mapping = {
                    "ACCOUNTS": "ACCOUNTS",
                    "PRODUCTION": "PRODUCTION",
                    "RAW_MATERIAL": "RAW_MATERIAL_INVENTORY",
                    "ADMINISTRATION": "ADMINISTRATION",
                    "LOGISTICS": "LOGISTICS",
                    "SALES": "SALES",
                }

                task_department = department_mapping.get(department.code, department.code)

                print(
                    f"[TASK SUMMARY] Department ID: {department_id}, Code: {department.code}, Mapped to: {task_department}",
                    file=sys.stderr,
                )

                # Filter tasks by mapped department code
                queryset = queryset.filter(department=task_department)

                print(
                    f"[TASK SUMMARY] Filtered queryset count: {queryset.count()}", file=sys.stderr
                )

            except Department.DoesNotExist:
                print(f"[TASK SUMMARY] Department not found: {department_id}", file=sys.stderr)
                pass

        # Calculate summary
        result = {
            "pending": queryset.filter(status="PENDING").count(),
            "completed": queryset.filter(status="COMPLETED").count(),
            "need_founder": queryset.filter(status="NEED_FOUNDER").count(),
            "total": queryset.count(),
        }

        print(f"[TASK SUMMARY] Result: {result}", file=sys.stderr)

        return Response(result)

    @action(detail=False, methods=["get"])
    def notifications(self, request):
        """Get task notifications for current user"""
        effective_user = self._get_effective_user()

        if not effective_user:
            # Return empty array instead of error to prevent frontend crashes
            return Response([])

        notifications = TaskNotification.objects.filter(user=effective_user).select_related("task")

        # Filter by read status if requested
        is_read = request.query_params.get("is_read")
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == "true")

        serializer = TaskNotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def mark_notifications_read(self, request):
        """Mark notifications as read"""
        effective_user = self._get_effective_user()

        if not effective_user:
            return Response({"error": "No user context"}, status=status.HTTP_400_BAD_REQUEST)

        notification_ids = request.data.get("notification_ids", [])

        if notification_ids:
            TaskNotification.objects.filter(id__in=notification_ids, user=effective_user).update(
                is_read=True
            )
        else:
            # Mark all notifications as read if no specific IDs provided
            TaskNotification.objects.filter(user=effective_user, is_read=False).update(is_read=True)

        return Response({"message": "Notifications marked as read"})

    @action(detail=True, methods=["get"])
    def status_history(self, request, pk=None):
        """Get status history for a specific task"""
        task = self.get_object()  # Permission check is done in get_object()

        history = TaskStatusHistory.objects.filter(task=task).select_related("changed_by")
        serializer = TaskStatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def update_status_with_notes(self, request, pk=None):
        """Update task status with optional notes"""
        task = self.get_object()  # Permission check is done in get_object()

        serializer = TaskStatusUpdateSerializer(
            task, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def status_transitions(self, request):
        """Get available status transitions and their descriptions"""
        transitions = {
            "PENDING": {
                "label": "Pending",
                "description": "Task is waiting to be started",
                "color": "#6c757d",
                "next_states": ["COMPLETED", "STUCK", "NEED_FOUNDER", "TRANSFERRED"],
            },
            "COMPLETED": {
                "label": "Completed",
                "description": "Task has been finished successfully",
                "color": "#28a745",
                "next_states": ["PENDING"],  # Allow reopening if needed
            },
            "STUCK": {
                "label": "Stuck",
                "description": "Task is blocked and needs assistance",
                "color": "#dc3545",
                "next_states": ["PENDING", "COMPLETED", "NEED_FOUNDER", "TRANSFERRED"],
            },
            "NEED_FOUNDER": {
                "label": "Need Founder Intervention",
                "description": "Task requires founder/admin attention",
                "color": "#e83e8c",
                "next_states": ["PENDING", "COMPLETED", "STUCK", "TRANSFERRED"],
            },
            "TRANSFERRED": {
                "label": "Transferred to Another Department",
                "description": "Task has been moved to a different department",
                "color": "#17a2b8",
                "next_states": ["PENDING", "COMPLETED", "STUCK", "NEED_FOUNDER"],
            },
        }
        return Response(transitions)

    # =========================================================================
    # Analytics & Reporting Endpoints (Phase 5)
    # =========================================================================

    @action(detail=False, methods=["get"])
    def analytics_dashboard(self, request):
        """
        Get comprehensive analytics dashboard.

        Query params:
        - date_from: Start date (YYYY-MM-DD)
        - date_to: End date (YYYY-MM-DD)
        """
        from .analytics import TaskAnalytics
        from datetime import datetime

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        # Parse date range
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if date_from:
            date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
        if date_to:
            date_to = datetime.strptime(date_to, "%Y-%m-%d").date()

        analytics = TaskAnalytics(company=company, date_from=date_from, date_to=date_to)
        return Response(analytics.get_dashboard_summary())

    @action(detail=False, methods=["get"])
    def department_report(self, request):
        """
        Get department-level task completion report.

        Query params:
        - department: Filter by specific department
        - period: 'daily' or 'weekly' (default: daily)
        - date_from: Start date
        - date_to: End date
        """
        from .analytics import TaskAnalytics
        from datetime import datetime

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        department = request.query_params.get("department")
        period = request.query_params.get("period", "daily")

        if date_from:
            date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
        if date_to:
            date_to = datetime.strptime(date_to, "%Y-%m-%d").date()

        analytics = TaskAnalytics(company=company, date_from=date_from, date_to=date_to)

        if period == "weekly":
            completion_data = analytics.weekly_completion_by_department(department)
        else:
            completion_data = analytics.daily_completion_by_department(department)

        return Response(
            {
                "completion_stats": analytics.department_completion_stats(),
                "completion_timeline": completion_data,
                "bottleneck_summary": analytics.department_bottleneck_summary(),
            }
        )

    @action(detail=False, methods=["get"])
    def bottlenecks(self, request):
        """
        Get bottleneck identification report.

        Query params:
        - limit: Number of bottlenecks to return (default: 10)
        - department: Filter by department
        """
        from .analytics import TaskAnalytics

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        limit = int(request.query_params.get("limit", 10))

        analytics = TaskAnalytics(company=company)

        return Response(
            {
                "bottlenecks": analytics.bottleneck_identification(limit=limit),
                "by_department": analytics.department_bottleneck_summary(),
                "overdue_summary": analytics.overdue_tasks_summary(),
            }
        )

    @action(detail=False, methods=["get"])
    def individual_performance_report(self, request):
        """
        Get individual performance metrics.

        Query params:
        - user_id: Filter by specific user
        - department: Filter by department
        - date_from: Start date
        - date_to: End date
        """
        from .analytics import TaskAnalytics
        from datetime import datetime

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        user_id = request.query_params.get("user_id")
        department = request.query_params.get("department")

        if date_from:
            date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
        if date_to:
            date_to = datetime.strptime(date_to, "%Y-%m-%d").date()

        analytics = TaskAnalytics(company=company, date_from=date_from, date_to=date_to)

        performance_data = analytics.individual_performance(user_id=user_id)

        # Filter by department if specified
        if department:
            performance_data = [p for p in performance_data if p.get("department") == department]

        return Response(
            {
                "performance": performance_data,
                "date_range": {
                    "from": analytics.date_from.isoformat(),
                    "to": analytics.date_to.isoformat(),
                },
            }
        )

    @action(detail=False, methods=["get"])
    def business_metrics(self, request):
        """
        Get business-level metrics.

        Query params:
        - date_from: Start date
        - date_to: End date
        - period: 'daily' or 'weekly' for trends
        """
        from .analytics import TaskAnalytics
        from datetime import datetime

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        period = request.query_params.get("period", "weekly")

        if date_from:
            date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
        if date_to:
            date_to = datetime.strptime(date_to, "%Y-%m-%d").date()

        analytics = TaskAnalytics(company=company, date_from=date_from, date_to=date_to)

        return Response(
            {
                "order_to_delivery": analytics.order_to_delivery_timeline(),
                "resource_utilization": analytics.resource_utilization(),
                "productivity_trends": analytics.productivity_trends(period=period),
                "urgency_distribution": analytics.urgency_distribution(),
                "overdue_summary": analytics.overdue_tasks_summary(),
            }
        )

    @action(detail=False, methods=["get"])
    def user_timeline(self, request):
        """
        Get task completion timeline for a specific user.

        Query params:
        - user_id: Required - User ID to get timeline for
        - date_from: Start date
        - date_to: End date
        """
        from .analytics import TaskAnalytics
        from datetime import datetime

        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        effective_user = self._get_effective_user()
        company = effective_user.company if effective_user else None

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if date_from:
            date_from = datetime.strptime(date_from, "%Y-%m-%d").date()
        if date_to:
            date_to = datetime.strptime(date_to, "%Y-%m-%d").date()

        analytics = TaskAnalytics(company=company, date_from=date_from, date_to=date_to)

        return Response(
            {
                "timeline": analytics.user_task_timeline(user_id),
                "user_id": user_id,
            }
        )

    # =========================================================================
    # Natural Language Query Endpoint (Founder Only)
    # =========================================================================

    @action(detail=False, methods=["post"])
    def nlp_query(self, request):
        """
        Process natural language queries about tasks.
        Only available to Founder role.

        Request body:
        {
            "query": "Who completed most tasks?"
        }
        """
        from .nlp_query import NLPQueryProcessor

        effective_user = self._get_effective_user()

        # Check if user is founder
        if effective_user:
            is_founder = (
                effective_user.task_role == "FOUNDER"
                or effective_user.name == "Niti"
                or effective_user.email == "niti@nsj.com"
            )
            if not is_founder:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("Only founders can use the AI assistant.")

        query = request.data.get("query", "").strip()

        if not query:
            return Response(
                {
                    "success": False,
                    "error": "Please provide a query.",
                    "answer": "Please ask me a question about your tasks!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = effective_user.company if effective_user else None
        processor = NLPQueryProcessor(company=company)
        result = processor.process_query(query)

        return Response(result)
