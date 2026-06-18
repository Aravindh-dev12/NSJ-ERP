import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from vouchers.invoice_template_pdf import generate_invoice_template_pdf

# Mock data
line_items = [
    {
        "s_n": 1,
        "description": "Gold Ring",
        "hsn_code": "7113",
        "quantity": 1,
        "rate": 50000,
        "unit": "gms",
        "amount": 50000,
    },
    {
        "s_n": 2,
        "description": "Making Charges",
        "hsn_code": "9988",
        "quantity": 1,
        "rate": 5000,
        "unit": "gms",
        "amount": 5000,
    },
]

estimate_items = [
    {
        "particulars": "Gold Ring",
        "shape": "Round",
        "colour": "Yellow",
        "clarity": "VS",
        "quantity": 1,
        "carats": 0,
        "weight": 10.5,
        "rate": 50000,
        "amount": 525000,
    }
]

try:
    print("Generating PDF...")
    pdf_bytes = generate_invoice_template_pdf(
        invoice_number="INV-TEST",
        invoice_date="12/02/2026",
        customer_name="Test Customer",
        customer_address="123 Test St",
        customer_gstin="27ABCDE1234F1Z5",
        customer_state="Maharashtra",
        customer_state_code="27",
        line_items=line_items,
        subtotal=55000.0,
        gst_rate=3.0,
        gst_amount=1650.0,
        total_amount=56650.0,
        payment_terms="Net 30",
        place_of_supply="27",
        company_name="NSJ",
        company_address="Mumbai",
        company_phone="1234567890",
        product_image_path=None,  # Test without image first
        estimate_number="EST-001",
        item_name="Gold Ring",
        estimate_line_items=estimate_items,
        estimate_date="10/02/2026",
    )
    print(f"PDF Generated Successfully! Size: {len(pdf_bytes)} bytes")

    # Save to file
    with open("test_output.pdf", "wb") as f:
        f.write(pdf_bytes)

except Exception as e:
    print("\n\nCRASH DETECTED!")
    import traceback

    with open("error_trace.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
    print("Traceback written to error_trace.txt")
