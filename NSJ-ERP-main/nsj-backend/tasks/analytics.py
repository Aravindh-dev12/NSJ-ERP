"""
Task Management Analytics & Reporting

Phase 5: Reporting & Analytics
- Department-level reports (daily/weekly completion, bottlenecks)
- Individual performance (completion rate, avg time)
- Business metrics (order-to-delivery, resource utilization, trends)
"""

from django.db.models import Count, F, Q, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from .models import Task


class TaskAnalytics:
    """Analytics engine for task management reporting"""

    def __init__(self, company=None, date_from=None, date_to=None):
        self.company = company
        self.date_from = date_from or (timezone.now() - timedelta(days=30)).date()
        self.date_to = date_to or timezone.now().date()

    def _base_queryset(self):
        """Get base queryset with company and date filters"""
        qs = Task.objects.all()
        if self.company:
            qs = qs.filter(company=self.company)
        return qs

    # =========================================================================
    # Department-Level Reports
    # =========================================================================

    def department_completion_stats(self, period="daily"):
        """
        Get task completion statistics by department.

        Returns:
        {
            'PRODUCTION': {'completed': 10, 'pending': 5, 'stuck': 2, 'completion_rate': 66.7},
            'ACCOUNTS': {'completed': 8, 'pending': 3, 'stuck': 1, 'completion_rate': 66.7},
            ...
        }
        """
        qs = self._base_queryset().filter(
            created_at__date__gte=self.date_from, created_at__date__lte=self.date_to
        )

        # Aggregate by department
        dept_stats = qs.values("department").annotate(
            total=Count("id"),
            completed=Count("id", filter=Q(status="COMPLETED")),
            pending=Count("id", filter=Q(status="PENDING")),
            stuck=Count("id", filter=Q(status="STUCK")),
            need_founder=Count("id", filter=Q(status="NEED_FOUNDER")),
        )

        result = {}
        for stat in dept_stats:
            dept = stat["department"]
            total = stat["total"]
            completed = stat["completed"]
            result[dept] = {
                "total": total,
                "completed": completed,
                "pending": stat["pending"],
                "stuck": stat["stuck"],
                "need_founder": stat["need_founder"],
                "completion_rate": round((completed / total * 100) if total > 0 else 0, 1),
            }

        return result

    def daily_completion_by_department(self, department=None):
        """
        Get daily task completion counts by department.

        Returns list of:
        [{'date': '2025-12-20', 'department': 'PRODUCTION', 'completed': 5}, ...]
        """
        qs = self._base_queryset().filter(
            status="COMPLETED",
            completed_at__date__gte=self.date_from,
            completed_at__date__lte=self.date_to,
        )

        if department:
            qs = qs.filter(department=department)

        daily_stats = (
            qs.annotate(date=TruncDate("completed_at"))
            .values("date", "department")
            .annotate(completed=Count("id"))
            .order_by("date", "department")
        )

        return list(daily_stats)

    def weekly_completion_by_department(self, department=None):
        """Get weekly task completion counts by department"""
        qs = self._base_queryset().filter(
            status="COMPLETED",
            completed_at__date__gte=self.date_from,
            completed_at__date__lte=self.date_to,
        )

        if department:
            qs = qs.filter(department=department)

        weekly_stats = (
            qs.annotate(week=TruncWeek("completed_at"))
            .values("week", "department")
            .annotate(completed=Count("id"))
            .order_by("week", "department")
        )

        return list(weekly_stats)

    def bottleneck_identification(self, limit=10):
        """
        Identify tasks that have been stuck the longest.

        Returns tasks ordered by how long they've been in non-completed status.
        """
        qs = (
            self._base_queryset()
            .filter(status__in=["PENDING", "STUCK", "NEED_FOUNDER"])
            .annotate(
                days_stuck=ExpressionWrapper(
                    timezone.now() - F("created_at"), output_field=DurationField()
                )
            )
            .order_by("-days_stuck")[:limit]
        )

        bottlenecks = []
        for task in qs:
            days = (timezone.now() - task.created_at).days
            bottlenecks.append(
                {
                    "id": str(task.id),
                    "title": task.title,
                    "department": task.department,
                    "sub_department": task.sub_department,
                    "status": task.status,
                    "assigned_to": task.assigned_to.name
                    if task.assigned_to
                    else task.assigned_to_name,
                    "created_at": task.created_at.isoformat(),
                    "deadline": task.deadline.isoformat() if task.deadline else None,
                    "days_stuck": days,
                    "is_overdue": task.deadline and task.deadline < timezone.now().date(),
                }
            )

        return bottlenecks

    def department_bottleneck_summary(self):
        """
        Get bottleneck summary by department.

        Returns:
        {
            'PRODUCTION': {'stuck_count': 5, 'avg_days_stuck': 3.2},
            ...
        }
        """
        qs = self._base_queryset().filter(status__in=["PENDING", "STUCK", "NEED_FOUNDER"])

        result = {}
        for dept_choice in Task.DEPARTMENT_CHOICES:
            dept_code = dept_choice[0]
            dept_tasks = qs.filter(department=dept_code)

            stuck_count = dept_tasks.count()
            if stuck_count > 0:
                total_days = sum((timezone.now() - t.created_at).days for t in dept_tasks)
                avg_days = total_days / stuck_count
            else:
                avg_days = 0

            result[dept_code] = {
                "stuck_count": stuck_count,
                "avg_days_stuck": round(avg_days, 1),
            }

        return result

    # =========================================================================
    # Individual Performance
    # =========================================================================

    def individual_performance(self, user_id=None):
        """
        Get individual performance metrics.

        This method handles both:
        - Tasks assigned via assigned_to FK (User object)
        - Tasks assigned via assigned_to_name (string field)

        Returns list of performance data per person.
        """
        from users.models import User

        qs = self._base_queryset().filter(
            created_at__date__gte=self.date_from, created_at__date__lte=self.date_to
        )

        # Build performance data by person name
        # This handles both FK assignments and name-based assignments
        person_stats = defaultdict(
            lambda: {
                "total": 0,
                "completed": 0,
                "pending": 0,
                "stuck": 0,
                "user_id": None,
                "email": None,
                "department": None,
            }
        )

        for task in qs:
            # Determine the assigned person's name
            if task.assigned_to:
                person_name = task.assigned_to.name
                person_stats[person_name]["user_id"] = str(task.assigned_to.id)
                person_stats[person_name]["email"] = task.assigned_to.email
                person_stats[person_name]["department"] = task.assigned_to.department
            elif task.assigned_to_name:
                person_name = task.assigned_to_name
                # Try to find user by name to get additional info
                user = User.objects.filter(name=person_name).first()
                if user:
                    person_stats[person_name]["user_id"] = str(user.id)
                    person_stats[person_name]["email"] = user.email
                    person_stats[person_name]["department"] = user.department
            else:
                continue  # Skip unassigned tasks

            person_stats[person_name]["total"] += 1
            if task.status == "COMPLETED":
                person_stats[person_name]["completed"] += 1
            elif task.status == "PENDING":
                person_stats[person_name]["pending"] += 1
            elif task.status == "STUCK":
                person_stats[person_name]["stuck"] += 1

        result = []
        for name, stats in person_stats.items():
            total = stats["total"]
            completed = stats["completed"]

            # Calculate average completion time for this person
            if stats["user_id"]:
                completed_tasks = self._base_queryset().filter(
                    Q(assigned_to_id=stats["user_id"]) | Q(assigned_to_name=name),
                    status="COMPLETED",
                    completed_at__isnull=False,
                )
            else:
                completed_tasks = self._base_queryset().filter(
                    assigned_to_name=name, status="COMPLETED", completed_at__isnull=False
                )

            avg_time = 0
            on_time_count = 0
            if completed_tasks.exists():
                total_days = 0
                for task in completed_tasks:
                    days = (task.completed_at.date() - task.created_at.date()).days
                    total_days += max(0, days)
                    if task.deadline and task.completed_at.date() <= task.deadline:
                        on_time_count += 1
                avg_time = total_days / completed_tasks.count()

            result.append(
                {
                    "user_id": stats["user_id"] or name,  # Use name as fallback ID
                    "name": name,
                    "email": stats["email"],
                    "department": stats["department"],
                    "total_tasks": total,
                    "completed": completed,
                    "pending": stats["pending"],
                    "stuck": stats["stuck"],
                    "completion_rate": round((completed / total * 100) if total > 0 else 0, 1),
                    "avg_completion_time_days": round(avg_time, 1),
                    "on_time_rate": round(
                        (on_time_count / completed * 100) if completed > 0 else 0, 1
                    ),
                }
            )

        return sorted(result, key=lambda x: x["completion_rate"], reverse=True)

    def user_task_timeline(self, user_id):
        """Get task completion timeline for a specific user"""
        qs = (
            self._base_queryset()
            .filter(
                assigned_to_id=user_id,
                status="COMPLETED",
                completed_at__date__gte=self.date_from,
                completed_at__date__lte=self.date_to,
            )
            .annotate(date=TruncDate("completed_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return list(qs)

    # =========================================================================
    # Business Metrics
    # =========================================================================

    def order_to_delivery_timeline(self):
        """
        Calculate average order-to-delivery timeline based on task completion.

        This tracks tasks from creation to completion for production-related tasks.
        """
        production_tasks = self._base_queryset().filter(
            department="PRODUCTION",
            status="COMPLETED",
            completed_at__isnull=False,
            created_at__date__gte=self.date_from,
        )

        if not production_tasks.exists():
            return {
                "avg_days": 0,
                "min_days": 0,
                "max_days": 0,
                "total_orders": 0,
            }

        durations = []
        for task in production_tasks:
            days = (task.completed_at.date() - task.created_at.date()).days
            durations.append(max(0, days))

        return {
            "avg_days": round(sum(durations) / len(durations), 1) if durations else 0,
            "min_days": min(durations) if durations else 0,
            "max_days": max(durations) if durations else 0,
            "total_orders": len(durations),
        }

    def resource_utilization(self):
        """
        Calculate resource utilization by department.

        Returns workload distribution across departments.
        """
        qs = self._base_queryset().filter(status__in=["PENDING", "STUCK", "NEED_FOUNDER"])

        # Count active tasks per department
        dept_workload = qs.values("department").annotate(
            active_tasks=Count("id"),
            high_urgency=Count("id", filter=Q(urgency="HIGH")),
            urgent=Count("id", filter=Q(urgency="URGENT")),
        )

        # Get user count per department
        from users.models import User

        result = []
        for stat in dept_workload:
            dept = stat["department"]
            user_count = User.objects.filter(department=dept, is_active=True).count()

            active_tasks = stat["active_tasks"]
            tasks_per_user = round(active_tasks / user_count, 1) if user_count > 0 else active_tasks

            result.append(
                {
                    "department": dept,
                    "active_tasks": active_tasks,
                    "high_urgency": stat["high_urgency"],
                    "urgent": stat["urgent"],
                    "user_count": user_count,
                    "tasks_per_user": tasks_per_user,
                    "utilization_level": "HIGH"
                    if tasks_per_user > 5
                    else ("MEDIUM" if tasks_per_user > 2 else "LOW"),
                }
            )

        return sorted(result, key=lambda x: x["tasks_per_user"], reverse=True)

    def productivity_trends(self, period="weekly"):
        """
        Calculate productivity trends over time.

        Returns completion counts grouped by period.
        """
        qs = self._base_queryset().filter(
            status="COMPLETED",
            completed_at__date__gte=self.date_from,
            completed_at__date__lte=self.date_to,
        )

        if period == "daily":
            trends = (
                qs.annotate(period=TruncDate("completed_at"))
                .values("period")
                .annotate(completed=Count("id"))
                .order_by("period")
            )
        else:  # weekly
            trends = (
                qs.annotate(period=TruncWeek("completed_at"))
                .values("period")
                .annotate(completed=Count("id"))
                .order_by("period")
            )

        return list(trends)

    def urgency_distribution(self):
        """Get distribution of tasks by urgency level"""
        qs = self._base_queryset().filter(status__in=["PENDING", "STUCK", "NEED_FOUNDER"])

        distribution = qs.values("urgency").annotate(count=Count("id"))

        return {item["urgency"]: item["count"] for item in distribution}

    def overdue_tasks_summary(self):
        """Get summary of overdue tasks"""
        today = timezone.now().date()

        qs = self._base_queryset().filter(
            status__in=["PENDING", "STUCK", "NEED_FOUNDER"], deadline__lt=today
        )

        overdue_by_dept = qs.values("department").annotate(count=Count("id"))

        total_overdue = qs.count()

        # Calculate average days overdue
        avg_days_overdue = 0
        if total_overdue > 0:
            total_days = sum((today - t.deadline).days for t in qs)
            avg_days_overdue = round(total_days / total_overdue, 1)

        return {
            "total_overdue": total_overdue,
            "avg_days_overdue": avg_days_overdue,
            "by_department": {item["department"]: item["count"] for item in overdue_by_dept},
        }

    # =========================================================================
    # Summary Dashboard
    # =========================================================================

    def get_dashboard_summary(self):
        """Get comprehensive dashboard summary"""
        return {
            "department_stats": self.department_completion_stats(),
            "bottlenecks": self.bottleneck_identification(limit=5),
            "individual_performance": self.individual_performance()[:10],
            "resource_utilization": self.resource_utilization(),
            "productivity_trends": self.productivity_trends(),
            "urgency_distribution": self.urgency_distribution(),
            "overdue_summary": self.overdue_tasks_summary(),
            "order_timeline": self.order_to_delivery_timeline(),
            "date_range": {
                "from": self.date_from.isoformat(),
                "to": self.date_to.isoformat(),
            },
        }
