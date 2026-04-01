from django.core.management.base import BaseCommand
from django.db import transaction

from vouchers.models import Sale
from core.models import ItemNameMaster, ClarityMaster, ShapeMaster, UnitMaster, StampMaster


class Command(BaseCommand):
    help = "Seed master tables (ItemName, Clarity, Shape, Unit, Stamp) from existing Sale records"

    def handle(self, *args, **options):
        created = {"items": 0, "clarities": 0, "shapes": 0, "units": 0, "stamps": 0}

        qs = Sale.objects.select_related("company").all()

        with transaction.atomic():
            for s in qs:
                if s.item_name:
                    obj, was_created = ItemNameMaster.objects.get_or_create(
                        name=s.item_name, company=s.company
                    )
                    if was_created:
                        created["items"] += 1
                if s.clarity:
                    obj, was_created = ClarityMaster.objects.get_or_create(
                        name=s.clarity, company=s.company
                    )
                    if was_created:
                        created["clarities"] += 1
                if s.shape:
                    obj, was_created = ShapeMaster.objects.get_or_create(
                        name=s.shape, company=s.company
                    )
                    if was_created:
                        created["shapes"] += 1
                if s.unit:
                    obj, was_created = UnitMaster.objects.get_or_create(
                        name=s.unit, company=s.company
                    )
                    if was_created:
                        created["units"] += 1
                # Stamp values may already exist in StampMaster; seed if missing
                if s.stamp:
                    obj, was_created = StampMaster.objects.get_or_create(
                        name=s.stamp, company=s.company
                    )
                    if was_created:
                        created["stamps"] += 1

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
        self.stdout.write(str(created))
