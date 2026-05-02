"""
Management command to populate query orders for orders without them.
This will create default query orders for orders that were created before the process management feature.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from vouchers.models import Order, OrderProcessStep, DEFAULT_ORDER_PROCESS_STEPS


class Command(BaseCommand):
    help = "Populate query orders for orders without them"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without making changes",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit the number of orders to process (useful for testing)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]

        self.stdout.write(self.style.SUCCESS("Checking orders without query orders..."))

        # Get all orders
        all_orders = Order.objects.all()
        total_orders = all_orders.count()
        self.stdout.write(f"  Total orders in database: {total_orders}")

        # Get orders without pcsctps stepss
        orders_without_steps = []
        for order in all_orders:
            if not order.process_steps.exists():
                orders_without_steps.append(order)

        count_without_steps = len(orders_without_steps)
        self.stdout.write(f"  Orders without query orders: {count_without_steps}")

        if limit:
            orders_without_steps = orders_without_steps[:limit]
            self.stdout.write(f"  Processing limited to {limit} orders")

        if count_without_steps == 0:
            self.stdout.write(self.style.SUCCESS("All orders already have query orders."))
            return

        # Populate query orders
        self.stdout.write(f"\nPopulating query orders for {len(orders_without_steps)} orders...")
        fixed_count = 0

        for order in orders_without_steps:
            try:
                if not dry_run:
                    with transaction.atomic():
                        # Create query orders from default template
                        for step_data in DEFAULT_ORDER_PROCESS_STEPS:
                            OrderProcessStep.objects.create(
                                order=order,
                                order_draft=None,
                                step_name=step_data["name"],
                                description=step_data["description"],
                                department=step_data["department"],
                                position=step_data["position"],
                                status="PENDING",
                            )
                        self.stdout.write(
                            f"  ✓ Order {order.bill_no or order.id}: Created {len(DEFAULT_ORDER_PROCESS_STEPS)} query orders"
                        )
                else:
                    self.stdout.write(
                        f"  [DRY RUN] Order {order.bill_no or order.id}: Would create {len(DEFAULT_ORDER_PROCESS_STEPS)} query orders"
                    )
                fixed_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Order {order.bill_no or order.id}: Failed to create query orders - {str(e)}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\n  Fixed {fixed_count} orders with missing query orders")
        )

        # Show final status
        final_without_steps = 0
        for order in all_orders:
            if not order.process_steps.exists():
                final_without_steps += 1

        self.stdout.write(f"\nFinal status:")
        self.stdout.write(f"  Orders without query orders: {final_without_steps}")
        self.stdout.write(f"  Orders with query orders: {total_orders - final_without_steps}")

        if dry_run:
            self.stdout.write(
                self.style.WARNING("\n⚠️  DRY RUN - No changes were made. Run without --dry-run to apply fixes.")
            )
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ Query orders populated successfully!"))
