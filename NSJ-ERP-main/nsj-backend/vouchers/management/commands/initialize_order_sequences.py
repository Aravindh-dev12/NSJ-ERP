"""
Management command to initialize Order ID sequences.
Run this after deploying the new Order ID system.
"""

from django.core.management.base import BaseCommand
from vouchers.order_id_generator import OrderIDGenerator


class Command(BaseCommand):
    help = "Initialize Order ID sequences for all order types"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Reset all sequences to 0 (use with caution!)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Initializing Order ID sequences..."))

        try:
            if options["reset"]:
                self.stdout.write(self.style.WARNING("RESETTING all sequences to 0..."))
                from vouchers.models import OrderSequence

                for order_type, _ in OrderSequence.ORDER_TYPE_CHOICES:
                    OrderIDGenerator.reset_sequence(order_type, 0)
                    self.stdout.write(f"  ✓ Reset {order_type} to 0")
            else:
                # Initialize sequences (won't overwrite existing)
                OrderIDGenerator.initialize_sequences()
                self.stdout.write("  ✓ Sequences initialized")

            # Show current status
            self.stdout.write("\nCurrent sequence status:")
            status = OrderIDGenerator.get_sequence_status()

            for order_type, info in status.items():
                self.stdout.write(
                    f"  {info['display_name']:25} | "
                    f"Prefix: {info['prefix']} | "
                    f"Current: {info['current_sequence']:4d} | "
                    f"Next ID: {info['next_id']}"
                )

            self.stdout.write(self.style.SUCCESS("\n✅ Order ID sequences ready!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Failed to initialize sequences: {str(e)}"))
