#!/usr/bin/env python
"""
Test script for PDF generation - run this to test and calibrate coordinates.

Usage:
    cd nsj-backend/nsj-backend
    python -m vouchers.test_pdf_generation

This will generate test PDFs in the current directory.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vouchers.estimate_pdf import generate_estimate_pdf, generate_calibration_pdf


def test_generate_estimate():
    """Generate a test estimate PDF with sample data."""

    # Sample data matching a typical estimate
    item_name = "PENDANT"

    line_items = [
        {
            "particulars": "Gold",
            "shape": "",
            "colour": "",
            "clarity": "",
            "pc": None,
            "weight": 23.00,
            "unit": "GM",
            "rate": 332.00,
            "amount": 7636.00,
        },
        {
            "particulars": "Craftsmanship Fee",
            "shape": "",
            "colour": "",
            "clarity": "",
            "pc": None,
            "weight": 232.00,
            "unit": "",
            "rate": 323.00,
            "amount": 74936.00,
        },
    ]

    totals = {
        "taxable_value": 82572.00,
        "gst": 2477.16,
        "grand_total": 85049.16,
    }

    # Generate PDF
    pdf_bytes = generate_estimate_pdf(
        item_name=item_name,
        line_items=line_items,
        totals=totals,
    )

    # Save to file
    output_path = "test_estimate.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"✓ Generated test estimate PDF: {output_path} ({len(pdf_bytes)} bytes)")
    return output_path


def test_generate_calibration():
    """Generate a calibration PDF with grid overlay."""

    pdf_bytes = generate_calibration_pdf()

    output_path = "test_calibration.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"✓ Generated calibration PDF: {output_path} ({len(pdf_bytes)} bytes)")
    return output_path


def get_template_info():
    """Print information about the template PDF."""
    import fitz

    template_path = os.path.join(os.path.dirname(__file__), "templates", "estimate_template.pdf")

    if not os.path.exists(template_path):
        print(f"✗ Template not found: {template_path}")
        return

    doc = fitz.open(template_path)
    page = doc[0]
    rect = page.rect

    print("\n=== Template PDF Info ===")
    print(f"Path: {template_path}")
    print(f"Page count: {len(doc)}")
    print(f"Page dimensions: {rect.width:.1f} x {rect.height:.1f} points")
    print(f"Page dimensions: {rect.width * 0.3528:.1f} x {rect.height * 0.3528:.1f} mm")

    # Extract text to help identify positions
    text_dict = page.get_text("dict")
    print("\n=== Text Blocks Found ===")
    for block in text_dict.get("blocks", []):
        if block.get("type") == 0:  # Text block
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text and len(text) > 2:
                        origin = span.get("origin", [0, 0])
                        print(f"  '{text[:40]}...' at ({origin[0]:.0f}, {origin[1]:.0f})")

    doc.close()


if __name__ == "__main__":
    print("PDF Generation Test Script")
    print("=" * 50)

    # Get template info
    get_template_info()

    print("\n" + "=" * 50)

    # Generate test PDFs
    test_generate_estimate()
    test_generate_calibration()

    print("\n" + "=" * 50)
    print("Done! Open the generated PDFs to verify positioning.")
