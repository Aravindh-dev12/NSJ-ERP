"""
Management command to verify if production data was loaded correctly.
"""

from django.core.management.base import BaseCommand
from django.apps import apps


class Command(BaseCommand):
    help = "Verify if production data was loaded correctly"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("PRODUCTION DATA VERIFICATION"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # Check key models
        models_to_check = [
            ("core", "Company"),
            ("users", "User"),
            ("accounts", "AccountMaster"),
            ("accounts", "AccountContact"),
            ("vouchers", "Order"),
            ("vouchers", "Estimate"),
            ("sales_queries", "SalesQuery"),
            ("tasks", "Task"),
        ]

        total_records = 0
        missing_data = []

        for app_label, model_name in models_to_check:
            try:
                model = apps.get_model(app_label, model_name)
                count = model.objects.count()
                total_records += count

                if count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ {app_label}.{model_name}: {count} records")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"⚠ {app_label}.{model_name}: 0 records (EMPTY!)")
                    )
                    missing_data.append(f"{app_label}.{model_name}")

            except LookupError:
                self.stdout.write(
                    self.style.ERROR(f"✗ {app_label}.{model_name}: Model not found")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ {app_label}.{model_name}: Error - {e}")
                )

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"Total records across all models: {total_records}")

        if missing_data:
            self.stdout.write(
                self.style.WARNING(f"\n⚠ WARNING: {len(missing_data)} models have no data:")
            )
            for model in missing_data:
                self.stdout.write(f"  - {model}")

            self.stdout.write("\n📋 To load production data:")
            self.stdout.write("  python manage.py load_production_data --file db_export.json")
        else:
            self.stdout.write(self.style.SUCCESS("\n✓ All models have data!"))

        self.stdout.write("=" * 60)
