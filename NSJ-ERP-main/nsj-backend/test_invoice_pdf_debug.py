"""
Debug script to test invoice PDF generation
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from vouchers.models import Invoice

# Get the most recent invoice
try:
    invoice = (
        Invoice.objects.select_related("sale", "estimate", "sales_query")
        .prefetch_related("line_items")
        .first()
    )

    if not invoice:
        print("No invoices found in database")
    else:
        print(f"Invoice ID: {invoice.id}")
        print(f"Invoice Number: {invoice.invoice_number}")
        print(f"Customer Name: {invoice.customer_name}")
        print(f"Line Items Count: {invoice.line_items.count()}")

        # Check line items
        for idx, line in enumerate(invoice.line_items.all(), 1):
            print(f"\nLine Item {idx}:")
            print(f"  Particulars: {line.particulars}")
            print(f"  Weight: {line.weight}")
            print(f"  Rate: {line.rate}")
            print(f"  Amount: {line.amount}")
            print(f"  Unit: {line.unit}")

        # Test PDF generation
        print("\n" + "=" * 50)
        print("Testing PDF generation...")
        print("=" * 50)

        from vouchers.invoice_template_pdf import generate_invoice_template_pdf

        # Prepare line items
        line_items = []
        for line in invoice.line_items.all():
            line_items.append(
                {
                    "particulars": line.particulars,
                    "hsn_code": getattr(line, "hsn_code", "") or "",
                    "quantity": line.quantity,
                    "weight": float(line.weight) if line.weight else 0,
                    "rate": float(line.rate),
                    "unit": line.unit or "GMS",
                    "amount": float(line.amount),
                }
            )

        print(f"Prepared {len(line_items)} line items for PDF")

        # Get product image path if available
        product_image_path = None
        if invoice.estimate and invoice.estimate.product_image:
            try:
                product_image_path = invoice.estimate.product_image.path
                if os.path.exists(product_image_path):
                    print(f"Product image found: {product_image_path}")
                else:
                    print("Product image path exists in DB but file not found")
                    product_image_path = None
            except Exception as e:
                print(f"Could not get product image: {str(e)}")
                product_image_path = None
        else:
            print("No product image in estimate")

        # Generate PDF using clean template
        from vouchers.invoice_clean_template import generate_clean_invoice_pdf

        pdf_bytes = generate_clean_invoice_pdf(
            invoice_number=invoice.invoice_number,
            invoice_date=invoice.invoice_date.strftime("%d/%m/%Y"),
            customer_name=invoice.customer_name,
            customer_address=invoice.address or "",
            customer_gstin=invoice.pan_gstin or "",
            customer_state="Maharashtra",
            customer_state_code="27",
            line_items=line_items,
            subtotal=float(invoice.subtotal),
            gst_rate=float(invoice.gst_rate),
            gst_amount=float(invoice.gst_amount),
            total_amount=float(invoice.total_amount),
            payment_terms="Net 30 Days",
            place_of_supply="27",
            product_image_path=product_image_path,
        )

        print(f"\nPDF generated successfully! Size: {len(pdf_bytes)} bytes")

        # Save test PDF
        with open("test_invoice_output.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("Test PDF saved as: test_invoice_output.pdf")

except Exception as e:
    import traceback

    print(f"ERROR: {str(e)}")
    print("\nFull traceback:")
    print(traceback.format_exc())
