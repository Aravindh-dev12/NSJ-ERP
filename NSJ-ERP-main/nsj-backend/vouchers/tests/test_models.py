import pytest
from django.core.exceptions import ValidationError

from core.models import Company
from users.models import User
from vouchers.models import Order, Voucher, Archives


@pytest.mark.django_db
def test_order_str_and_auto_fields():
    """Creating an Order without bill_no/job_no auto-generates them and __str__ uses bill_no."""
    company = Company.objects.create(name="TestCo", display_name="TestCo")
    user = User.objects.create_user(
        email="u@example.com", username="u1", password="pass", name="User One", company=company
    )

    order = Order(company=company, created_by=user)
    # ensure blank before save
    assert not order.bill_no
    assert not order.job_no

    order.save()

    # bill_no should start with order type prefix (A for STOCK_JEWELRY by default)
    assert order.bill_no is not None and str(order.bill_no).startswith("A")
    assert order.job_no is not None
    assert str(order).startswith("Order ")


@pytest.mark.django_db
def test_order_number_of_pieces_validation():
    """number_of_pieces has MinValueValidator(1) and should raise on invalid value when full_clean called."""
    company = Company.objects.create(name="TestCo2", display_name="TestCo2")
    user = User.objects.create_user(
        email="u2@example.com", username="u2", password="pass", name="User Two", company=company
    )

    order = Order(company=company, created_by=user, number_of_pieces=0)
    with pytest.raises(ValidationError):
        order.full_clean()


@pytest.mark.django_db
def test_archives_str_and_alias_voucher():
    company = Company.objects.create(name="TestCo3", display_name="TestCo3")
    user = User.objects.create_user(
        email="u3@example.com", username="u3", password="pass", name="User Three", company=company
    )

    arch = Archives.objects.create(company=company, created_by=user, bill_no="B-123")
    assert str(arch) == f"Archive {arch.bill_no}"

    # Voucher alias should point to Order class
    assert Voucher is Order
