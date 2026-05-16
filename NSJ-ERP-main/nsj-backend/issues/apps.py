from django.apps import AppConfig


class IssuesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "issues"
    verbose_name = "Issues"

    def ready(self):
        # Import signals to register them
        import issues.signals  # noqa: F401
