"""
Management command to seed initial master data.
Usage: python manage.py seed_master_data
"""

from django.core.management.base import BaseCommand
from core.models import (
    GoldCaratMaster,
    MetalTypeMaster,
    MetalColorMaster,
    ItemNameMaster,
)


class Command(BaseCommand):
    help = "Seed initial master data for the system"

    def handle(self, *args, **options):
        self.stdout.write("Seeding master data...")

        # Seed Gold Carats (standard values)
        gold_carats = [
            {"name": "24K", "value": 24, "is_standard": True},
            {"name": "22K", "value": 22, "is_standard": True},
            {"name": "20K", "value": 20, "is_standard": False},
            {"name": "18K", "value": 18, "is_standard": True},
            {"name": "14K", "value": 14, "is_standard": True},
            {"name": "10K", "value": 10, "is_standard": True},
        ]

        for carat_data in gold_carats:
            carat, created = GoldCaratMaster.objects.get_or_create(
                value=carat_data["value"],
                company=None,  # Global master data
                defaults={
                    "name": carat_data["name"],
                    "is_standard": carat_data["is_standard"],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created gold carat: {carat.name}"))
            else:
                self.stdout.write(f"Gold carat already exists: {carat.name}")

        # Seed Metal Types
        metal_types = ["Gold", "Silver", "Platinum", "Copper"]

        for metal_name in metal_types:
            metal, created = MetalTypeMaster.objects.get_or_create(
                name=metal_name,
                company=None,  # Global master data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created metal type: {metal.name}"))
            else:
                self.stdout.write(f"Metal type already exists: {metal.name}")

        # Seed Metal Colors (for Gold)
        try:
            gold_metal = MetalTypeMaster.objects.get(name="Gold", company=None)
            metal_colors = [
                {"name": "Rose Gold", "metal_type": gold_metal},
                {"name": "White Gold", "metal_type": gold_metal},
                {"name": "Yellow Gold", "metal_type": gold_metal},
            ]

            for color_data in metal_colors:
                color, created = MetalColorMaster.objects.get_or_create(
                    name=color_data["name"],
                    company=None,  # Global master data
                    defaults={"metal_type": color_data["metal_type"]},
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created metal color: {color.name}"))
                else:
                    self.stdout.write(f"Metal color already exists: {color.name}")
        except MetalTypeMaster.DoesNotExist:
            self.stdout.write(
                self.style.WARNING("Gold metal type not found, skipping metal colors")
            )

        # Seed Item Names (jewelry types) - Complete list from Nihar
        item_names = [
            "14K GOLD MISC.",
            "A D DIAMONDS",
            "AMYTHYST",
            "ASV LADIES RING",
            "ASV EARRINGS",
            "BALI (EARRRINGS)",
            "BANGLE",
            "BELT BUCKAL",
            "BLACK BEEDS",
            "BLUE PHIROZA",
            "BRACELET",
            "BRIOLETS",
            "BROACH",
            "BROKEN DIAMOND",
            "BROKEN DIAMONDS",
            "CHAIN 14K",
            "CHAIN 18K",
            "CHAIN KADI",
            "CHANGEABLE COLOUR STONE",
            "COLOUR STONES",
            "CUSHION",
            "CUSTOMER CHAIN",
            "CUSTOMER COLOUR STONE",
            "CUSTOMER CVD DIAMOND",
            "CUSTOMER DIAMOND",
            "CUSTOMER GEM STONE",
            "CUSTOMER MOISSANITE",
            "CVD DIAMOND",
            "DIAMOND",
            "DIAMOND CHAIN",
            "DOSSIER",
            "EARRINGS",
            "EMERALD",
            "EVIE EYE",
            "FISH LOCK",
            "FRESHWATER PEARLS",
            "GEM STONE",
            "GIA",
            "GOLD BRACELET",
            "GOLD CHAIN",
            "GOLD CHAIN 18K/ 14K",
            "GOLD CHAIN 22K",
            "GOLD CHAKI ( SCREW)",
            "HALF BANGLE",
            "HAND CUFF",
            "HK PEARLS",
            "HRDIGI",
            "ILLUSION SQ.CUSHION",
            "IMMITATION SAMPLE",
            "LADIES RING",
            "MAANG TIKKA",
            "MALACHITE",
            "MANGALSUTRA",
            "MEENA",
            "MEN'S EARRINGS",
            "MENS BRACELETS",
            "MENS RINGS",
            "MISC",
            "MOISSANITE",
            "MOISSANITE POLKY",
            "MOSSAN ITE POLKY",
            "MOTHER OF PEARL",
            "NATURAL DIAMOND POLKI",
            "NAYNA STOCK",
            "NECKLACE",
            "NECKLACE SET",
            "NECKLACE SET EARRINGS",
            "NECKLACE SOKTI",
            "NOSEPIN",
            "NOSERING",
            "NS RING",
            "OLD DIAMOND",
            "OLD GOLD",
            "OLD SILVER",
            "OMEGA CLIP",
            "PARTY DIAMOND",
            "PEAR CAB",
            "PEARL",
            "PEARL BEEDS",
            "PENDANT",
            "PENDANT SET",
            "PENDANT SET EARRINGS",
            "PLATINUM MENS RING",
            "POLISH AND RHODIUM &SOLDER",
            "POLKI",
            "POLKI BANGLE",
            "POLKI EARRINGS",
            "POLKI NK",
            "POLKI NK + ER",
            "POLKI RING",
            "PUKHRAJ",
            "PURE GOLD",
            "RHODIUM",
            "RUBY",
            "SHRUTIKA - NECKLACE",
            "SHRUTIKA EAARRINGS",
            "SHRUTIKA RING",
            "SOLITAIRE",
            "SOLITARE CHAIN",
            "Tanzania",
            "TENNIS BRACELET",
            "TENNIS BRACELETS",
            "TJW - EARRINGS",
            "TJW - NECKLACE",
            "TJW - NECKLACE SET EARRINGS",
            "TJW - RING",
            "TJW -BRACELETS",
            "TJW TENNIS BRACELETS",
            "TJW-PENDANT",
            "TOURMALINE",
            "VAN CLEEF BRACELET",
            "VCA FLOWER",
            "WATCH",
        ]

        for item_name in item_names:
            item, created = ItemNameMaster.objects.get_or_create(
                name=item_name,
                company=None,  # Global master data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created item name: {item.name}"))
            else:
                self.stdout.write(f"Item name already exists: {item.name}")

        self.stdout.write(self.style.SUCCESS("\nMaster data seeding complete!"))
