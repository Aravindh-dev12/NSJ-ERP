"""
Packing List PDF Generator using Template Overlay Approach

This module uses page 2 of the Satyam Jewellery-Invoice-2026.pdf template
and overlays packing list data from estimates.

NOTE: This standalone generator is kept for backward compatibility.
The main invoice PDF generator (invoice_template_pdf.py) handles
packing list generation as part of the full invoice PDF.
"""

import io
import os
from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import fitz  # PyMuPDF
except ImportError:
    import PyMuPDF as fitz


def generate_packing_list_pdf(
    estimate_number: str,
    item_name: str,
    date: str,
    line_items: List[Dict[str, Any]] = None,
    product_image_path: str = None,
) -> bytes:
    """
    Generate packing list PDF using template overlay approach.
    Uses page 2 of the invoice template.

    Actual template page size: 595 x 842 px
    Section 1: y~185–375, Section 2: y~375–580
    """
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "Satyam Jewellery-Invoice-2026.pdf"
    )

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    # Open template and extract only page 2
    doc = fitz.open(template_path)
    new_doc = fitz.open()
    new_doc.insert_pdf(doc, from_page=1, to_page=1)
    page = new_doc[0]
    doc.close()

    # === FONT AND COLOR SETTINGS ===
    try:
        fontname = "Montserrat"
        page.insert_text((0, 0), "test", fontname=fontname, fontsize=1)
    except:
        fontname = "helv"

    text_color = (0.341, 0.055, 0.075)  # Dark maroon

    # === REDACTION: Remove all sample data ===
    def add_redact(rect):
        page.add_redact_annot(rect, fill=(1, 1, 1))

    # Section 1 header
    add_redact(fitz.Rect(55, 190, 230, 210))
    add_redact(fitz.Rect(230, 190, 445, 210))
    add_redact(fitz.Rect(445, 190, 560, 210))
    add_redact(fitz.Rect(55, 215, 125, 235))

    # Section 1 data rows
    for row_y_top in [228, 251, 274, 297]:
        add_redact(fitz.Rect(122, row_y_top, 560, row_y_top + 18))

    # Section 1 totals
    add_redact(fitz.Rect(500, 299, 560, 320))
    add_redact(fitz.Rect(500, 322, 560, 343))
    add_redact(fitz.Rect(500, 345, 560, 366))

    # Section 1 image
    add_redact(fitz.Rect(35, 245, 125, 330))

    # Section 2 (blank it out entirely)
    add_redact(fitz.Rect(55, 378, 560, 398))
    for row_y_top in [416, 439, 462, 485, 508]:
        add_redact(fitz.Rect(122, row_y_top, 560, row_y_top + 18))
    add_redact(fitz.Rect(500, 510, 560, 530))
    add_redact(fitz.Rect(500, 533, 560, 553))
    add_redact(fitz.Rect(500, 556, 560, 577))
    add_redact(fitz.Rect(33, 432, 127, 518))

    page.apply_redactions()

    # === OVERLAY DYNAMIC DATA ===
    # Header row (white text on dark maroon header bar)
    page.insert_text(
        (63, 205), estimate_number or "", fontsize=9, fontname=fontname, color=(1, 1, 1)
    )
    page.insert_text(
        (246, 205), (item_name or "").upper(), fontsize=9, fontname=fontname, color=(1, 1, 1)
    )
    page.insert_text((500, 205), date or "", fontsize=9, fontname=fontname, color=(1, 1, 1))

    # Estimate number in the first data cell (left of Particulars column)
    page.insert_text(
        (40, 243), estimate_number or "", fontsize=9, fontname=fontname, color=text_color
    )

    # Product image
    if product_image_path and os.path.exists(product_image_path):
        try:
            img_rect = fitz.Rect(38, 250, 121, 325)
            page.insert_image(img_rect, filename=product_image_path, keep_proportion=True)
        except Exception as e:
            print(f"Warning: Could not insert product image: {str(e)}")

    # Column boundaries (left_x, right_x) for each column in the template
    # These define the cell boundaries for right-aligned textbox insertion
    col_bounds = {
        "particulars": (125, 230),
        "shape": (230, 268),
        "colour": (268, 305),
        "clarity": (305, 340),
        "pcs": (340, 370),
        "carats": (370, 410),
        "grams": (410, 448),
        "rate": (448, 510),
        "amount": (510, 560),
    }

    # Helper: insert right-aligned text within a cell using textbox
    def insert_cell_text(text, col_name, y_top, y_bottom, fontsize=8, align=fitz.TEXT_ALIGN_LEFT):
        left, right = col_bounds[col_name]
        rect = fitz.Rect(left + 2, y_top, right - 2, y_bottom)
        page.insert_textbox(
            rect, text, fontsize=fontsize, fontname=fontname, color=text_color, align=align
        )

    # Table data rows
    # Track computed amounts for totals
    computed_line_amounts = []

    if line_items:
        row_y_top = 232  # top of first data row
        row_height = 23  # row height

        for idx, item in enumerate(line_items[:5]):
            yt = row_y_top + (idx * row_height)
            yb = yt + row_height

            particulars = item.get("particulars", "")
            if particulars:
                insert_cell_text(particulars[:25], "particulars", yt, yb, fontsize=9)

            shape = item.get("shape", "")
            if shape:
                insert_cell_text(
                    shape[:8], "shape", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                )

            colour = item.get("colour", "")
            if colour:
                insert_cell_text(
                    colour[:8], "colour", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                )

            clarity = item.get("clarity", "")
            if clarity:
                insert_cell_text(
                    clarity[:8], "clarity", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                )

            pcs = item.get("quantity", "")
            if pcs:
                insert_cell_text(str(pcs), "pcs", yt, yb, fontsize=9, align=fitz.TEXT_ALIGN_CENTER)

            carats = item.get("carats", "")
            if carats:
                insert_cell_text(
                    f"{float(carats):.2f}",
                    "carats",
                    yt,
                    yb,
                    fontsize=8,
                    align=fitz.TEXT_ALIGN_CENTER,
                )

            weight = item.get("weight", 0)
            if weight:
                insert_cell_text(
                    f"{float(weight):.3f}",
                    "grams",
                    yt,
                    yb,
                    fontsize=8,
                    align=fitz.TEXT_ALIGN_CENTER,
                )

            rate = item.get("rate", 0)
            if rate:
                rate_val = float(rate)
                # Standard formatting, no L suffix
                rate_str = f"Rs. {rate_val:,.2f}"
                insert_cell_text(rate_str, "rate", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_RIGHT)

            # AMOUNT - DYNAMICALLY COMPUTE from rate × weight (or rate × carats)
            # Don't trust the stored amount value
            rate_val = float(rate) if rate else 0

            # Determine which quantity to use: carats (if present) or weight/grams
            carats_val = float(carats) if carats else 0
            weight_val = float(weight) if weight else 0

            # Use carats if available, otherwise use weight
            quantity_val = carats_val if carats_val > 0 else weight_val

            computed_amount = rate_val * quantity_val
            computed_line_amounts.append(computed_amount)

            # Header says "Amount (Rs)", so we only show the number
            amount_str = f"{computed_amount:,.2f}"
            insert_cell_text(amount_str, "amount", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_RIGHT)

    # Totals - use dynamically computed amounts
    total_taxable = sum(computed_line_amounts)
    gst_amount = total_taxable * 0.03
    grand_total = total_taxable + gst_amount

    # Total row Y positions (these sit below the data rows in the summary area)
    total_y_top = 300
    total_row_h = 23

    def format_total(val):
        # Totals in the summary area
        return f"Rs. {val:,.2f}"

    insert_cell_text(
        format_total(total_taxable),
        "amount",
        total_y_top,
        total_y_top + total_row_h,
        fontsize=8,
        align=fitz.TEXT_ALIGN_RIGHT,
    )
    insert_cell_text(
        format_total(gst_amount),
        "amount",
        total_y_top + total_row_h,
        total_y_top + 2 * total_row_h,
        fontsize=8,
        align=fitz.TEXT_ALIGN_RIGHT,
    )
    insert_cell_text(
        format_total(grand_total),
        "amount",
        total_y_top + 2 * total_row_h,
        total_y_top + 3 * total_row_h,
        fontsize=9,
        align=fitz.TEXT_ALIGN_RIGHT,
    )

    # Save
    output = io.BytesIO()
    new_doc.save(output)
    new_doc.close()

    pdf_bytes = output.getvalue()
    output.close()

    return pdf_bytes
