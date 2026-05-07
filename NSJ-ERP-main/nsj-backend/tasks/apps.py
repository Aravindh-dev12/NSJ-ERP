from django.apps import AppConfig


class TasksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tasks"

    def ready(self):
        # Import signals to register them
        import tasks.signals  # noqa: F401

        # Start the automatic task scheduler
        from tasks.scheduler import start_scheduler
        import os

        # Only start scheduler in main process (not in migration/management commands)
        if os.environ.get("RUN_MAIN") == "true" or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
            start_scheduler()
