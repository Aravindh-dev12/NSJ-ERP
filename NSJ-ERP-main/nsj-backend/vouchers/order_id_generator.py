"""
Order ID Auto-Generation System
Production-safe implementation with proper concurrency handling and error recovery.
"""

import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from typing import Optional

logger = logging.getLogger(__name__)


class OrderIDGenerator:
    """
    Production-safe Order ID generator with proper concurrency handling.

    Features:
    - Thread-safe sequence generation using database-level locking
    - Automatic rollback on order creation failure
    - Proper error handling and logging
    - Unique constraint enforcement
    """

    PREFIX_MAPPING = {
        "STOCK_JEWELRY": "A",
        "BESPOKE_NATURAL": "B",
        "BESPOKE_CVD": "C",
        "LOOSE_DIAMONDS": "D",
        "STOCK_PURCHASE": "P",
    }

    @staticmethod
    def get_prefix_for_order_type(order_type: str) -> str:
        """Get the prefix letter for a given order type."""
        return OrderIDGenerator.PREFIX_MAPPING.get(order_type, "X")

    @staticmethod
    def initialize_sequences():
        """Initialize sequence records for all order types if they don't exist."""
        from .models import OrderSequence

        for order_type, _ in OrderSequence.ORDER_TYPE_CHOICES:
            OrderSequence.objects.get_or_create(
                order_type=order_type, defaults={"current_sequence": 0}
            )

    @classmethod
    def get_prefix_for_material(cls, material_name: str) -> str:
        """
        Derive a 3-letter prefix from the material name — always first 3 alpha chars, uppercase.
        Diamond → DIA, Gemstone → GEM, Gold → GOL, Silver → SIL, Copper → COP, etc.
        No special mapping needed; consistent for any new material added from master.
        """
        letters = "".join(c for c in material_name.upper() if c.isalpha())
        return letters[:3] if letters else "MAT"

    @classmethod
    def generate_material_purchase_id(cls, material_name: str) -> str:

        from .models import OrderSequence, RawMaterialPurchase

        prefix = cls.get_prefix_for_material(material_name)
        sequence_key = f"MAT_{prefix}"

        try:
            with transaction.atomic():
                sequence_obj, _ = OrderSequence.objects.select_for_update().get_or_create(
                    order_type=sequence_key, defaults={"current_sequence": 0}
                )

                while True:
                    sequence_obj.current_sequence += 1
                    next_number = sequence_obj.current_sequence
                    purchase_id = f"{prefix}{next_number:04d}"

                    if not RawMaterialPurchase.objects.filter(dia_id=purchase_id).exists():
                        break

                sequence_obj.save()

                logger.info(f"Generated Material Purchase ID: {purchase_id} for material: {material_name}")
                return purchase_id

        except Exception as e:
            logger.error(f"Failed to generate Material Purchase ID for {material_name}: {str(e)}")
            raise Exception(f"Material Purchase ID generation failed: {str(e)}")

    @classmethod
    def generate_order_id(cls, order_type: str) -> str:
        """
        Generate a unique Order ID for the given order type.

        Args:
            order_type: One of STOCK_JEWELRY, BESPOKE_NATURAL, BESPOKE_CVD, LOOSE_DIAMONDS, STOCK_PURCHASE

        Returns:
            str: Generated Order ID in format <PREFIX><SEQUENTIAL_NUMBER>
        """
        from .models import OrderSequence

        prefix = cls.PREFIX_MAPPING.get(order_type)
        if not prefix:
            raise ValidationError(
                f"Invalid order_type: {order_type}. Must be one of: {list(cls.PREFIX_MAPPING.keys())}"
            )

        try:
            with transaction.atomic():
                sequence_obj, _ = OrderSequence.objects.select_for_update().get_or_create(
                    order_type=order_type, defaults={"current_sequence": 0}
                )

                from .models import Order
                while True:
                    sequence_obj.current_sequence += 1
                    next_number = sequence_obj.current_sequence
                    order_id = f"{prefix}{next_number:04d}"

                    if not Order.objects.filter(bill_no=order_id).exists():
                        break

                sequence_obj.save()

                logger.info(f"Generated Order ID: {order_id} for type: {order_type}")
                return order_id

        except Exception as e:
            logger.error(f"Failed to generate Order ID for type {order_type}: {str(e)}")
            raise Exception(f"Order ID generation failed: {str(e)}")

    @classmethod
    def get_next_order_id_preview(cls, order_type: str) -> str:
        """
        Preview what the next Order ID would be without incrementing the sequence.
        Useful for UI display or validation.
        """
        from .models import OrderSequence

        try:
            sequence_obj = OrderSequence.objects.get(order_type=order_type)
            prefix = cls.get_prefix_for_order_type(order_type)
            next_number = sequence_obj.current_sequence + 1
            return f"{prefix}{next_number:04d}"
        except OrderSequence.DoesNotExist:
            prefix = cls.get_prefix_for_order_type(order_type)
            return f"{prefix}0001"

    @classmethod
    def reset_sequence(cls, order_type: str, new_value: int = 0) -> bool:
        """
        Reset sequence for a given order type. Use with caution!

        Args:
            order_type: Order type to reset
            new_value: New sequence value (default: 0)

        Returns:
            bool: True if reset successful
        """
        from .models import OrderSequence

        try:
            with transaction.atomic():
                sequence_obj = OrderSequence.objects.select_for_update().get(order_type=order_type)
                old_value = sequence_obj.current_sequence
                sequence_obj.current_sequence = new_value
                sequence_obj.save()

                logger.warning(f"SEQUENCE RESET: {order_type} from {old_value} to {new_value}")
                return True

        except Exception as e:
            logger.error(f"Failed to reset sequence for {order_type}: {str(e)}")
            return False

    @classmethod
    def get_sequence_status(cls) -> dict:
        """Get current status of all sequences."""
        from .models import OrderSequence

        status = {}
        for order_type, display_name in OrderSequence.ORDER_TYPE_CHOICES:
            try:
                sequence_obj = OrderSequence.objects.get(order_type=order_type)
                prefix = cls.get_prefix_for_order_type(order_type)
                status[order_type] = {
                    "display_name": display_name,
                    "prefix": prefix,
                    "current_sequence": sequence_obj.current_sequence,
                    "next_id": f"{prefix}{sequence_obj.current_sequence + 1:04d}",
                    "last_updated": sequence_obj.updated_at,
                }
            except OrderSequence.DoesNotExist:
                prefix = cls.get_prefix_for_order_type(order_type)
                status[order_type] = {
                    "display_name": display_name,
                    "prefix": prefix,
                    "current_sequence": 0,
                    "next_id": f"{prefix}0001",
                    "last_updated": None,
                }

        return status


# Utility functions for easy import
def generate_order_id(order_type: str) -> str:
    """Convenience function for generating Order IDs."""
    return OrderIDGenerator.generate_order_id(order_type)


def preview_next_order_id(order_type: str) -> str:
    """Convenience function for previewing next Order ID."""
    return OrderIDGenerator.get_next_order_id_preview(order_type)


def initialize_order_sequences():
    """Convenience function for initializing sequences."""
    return OrderIDGenerator.initialize_sequences()
