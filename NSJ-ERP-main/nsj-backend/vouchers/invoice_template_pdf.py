"""
Invoice PDF Generator using Template Overlay Approach

This module uses the Satyam Jewellery-Invoice-2026.pdf template
and overlays invoice data from sales queries and estimates.
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


def number_to_words_indian(number):
    """Convert number to Indian currency words"""
    try:
        number = int(float(number))
    except (ValueError, TypeError):
        return "ZERO ONLY"

    if number == 0:
        return "ZERO ONLY"

    # Indian numbering system
    ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"]
    tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"]
    teens = [
        "TEN",
        "ELEVEN",
        "TWELVE",
        "THIRTEEN",
        "FOURTEEN",
        "FIFTEEN",
        "SIXTEEN",
        "SEVENTEEN",
        "EIGHTEEN",
        "NINETEEN",
    ]

    def convert_below_thousand(n):
        if n == 0:
            return ""
        elif n < 10:
            return ones[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (" " + ones[n % 10] if n % 10 != 0 else "")
        else:
            return (
                ones[n // 100]
                + " HUNDRED"
                + (" " + convert_below_thousand(n % 100) if n % 100 != 0 else "")
            )

    if number < 1000:
        result = convert_below_thousand(number)
    elif number < 100000:  # Less than 1 lakh
        thousands = number // 1000
        remainder = number % 1000
        result = convert_below_thousand(thousands) + " THOUSAND"
        if remainder:
            result += " " + convert_below_thousand(remainder)
    elif number < 10000000:  # Less than 1 crore
        lakhs = number // 100000
        remainder = number % 100000
        result = convert_below_thousand(lakhs) + " LAKH"
        if remainder >= 1000:
            result += " " + convert_below_thousand(remainder // 1000) + " THOUSAND"
            if remainder % 1000:
                result += " " + convert_below_thousand(remainder % 1000)
        elif remainder:
            result += " " + convert_below_thousand(remainder)
    else:  # Crores
        crores = number // 10000000
        remainder = number % 10000000
        result = convert_below_thousand(crores) + " CRORE"
        if remainder >= 100000:
            result += " " + convert_below_thousand(remainder // 100000) + " LAKH"
            remainder = remainder % 100000
        if remainder >= 1000:
            result += " " + convert_below_thousand(remainder // 1000) + " THOUSAND"
            remainder = remainder % 1000
        if remainder:
            result += " " + convert_below_thousand(remainder)

    return "INR " + result.strip() + " ONLY"


def generate_invoice_template_pdf(
    invoice_number: str,
    invoice_date: str,
    customer_name: str,
    customer_address: str,
    customer_gstin: str,
    customer_state: str = "",
    customer_state_code: str = "",
    line_items: List[Dict[str, Any]] = None,
    subtotal: float = 0,
    gst_rate: float = 3.0,
    gst_amount: float = 0,
    total_amount: float = 0,
    payment_terms: str = "",
    place_of_supply: str = "",
    company_name: str = "SATYAM JEWELLERS",
    company_address: str = "624, BANK ROAD, MUKSTAR, PUNJAB",
    company_phone: str = "9814198040",
    company_gstin: str = "03AEFPG4541P1ZH",
    company_pan: str = "AEFPG4541P",
    company_state: str = "Punjab",
    company_state_code: str = "03",
    company_email: str = "hello@nitishahjewels.com",
    bank_account_holder: str = "NITI NILESH SHAH",
    bank_name: str = "HDFC BANK",
    bank_account_no: str = "50200111236249",
    bank_branch: str = "VILE PARLE EAST",
    bank_ifsc: str = "HDFC0000227",
    product_image_path: str = None,
    # Packing list parameters (for page 2)
    estimate_number: str = "",
    item_name: str = "",
    estimate_line_items: List[Dict[str, Any]] = None,
    estimate_date: str = "",  # Add estimate date parameter
) -> bytes:
    """
    Generate invoice PDF using template overlay approach with accurate coordinates.
    Now includes packing list on page 2.

    Args:
        product_image_path: Path to product image file (from estimate). If None, no image is added.
        estimate_number: Estimate/item code for packing list header
        item_name: Item name for packing list header
        estimate_line_items: Line items from estimate for packing list details
    """
    # Use ORIGINAL template (has all labels already)
    # We only overlay VALUES, not labels
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "Satyam Jewellery-Invoice-2026.pdf"
    )

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    # Open the template PDF
    doc = fitz.open(template_path)
    page = doc[0]

    # Load Arial font to support Rupee symbol and match template style
    # Try local copy first (more reliable permissions)
    local_font_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "arial_local.ttf")
    system_font_path = "C:/Windows/Fonts/arial.ttf"

    fontname = "helv"  # Default fallback
    if os.path.exists(local_font_path):
        print(f"Loading font from {local_font_path}")
        fontname = "arial"
        page.insert_font(fontname=fontname, fontfile=local_font_path)
    elif os.path.exists(system_font_path):
        print(f"Loading font from {system_font_path}")
        fontname = "arial"
        page.insert_font(fontname=fontname, fontfile=system_font_path)
    else:
        print("Arial font not found, using Helvetica")

    # Load Arial Bold font to match template labels
    fontname_bold = "hebo"  # Default fallback (Helvetica-Bold short code)
    width_font_bold = fitz.Font("Helvetica-Bold")  # Default font object for width calculation

    local_font_bold_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "arialbd_local.ttf"
    )
    system_font_bold_path = "C:/Windows/Fonts/arialbd.ttf"

    if os.path.exists(local_font_bold_path):
        print(f"Loading bold font from {local_font_bold_path}")
        fontname_bold = "arial-bold"
        page.insert_font(fontname=fontname_bold, fontfile=local_font_bold_path)
        # Re-create font object for accurate width calculation
        width_font_bold = fitz.Font(fontfile=local_font_bold_path)
    elif os.path.exists(system_font_bold_path):
        print(f"Loading bold font from {system_font_bold_path}")
        fontname_bold = "arial-bold"
        page.insert_font(fontname=fontname_bold, fontfile=system_font_bold_path)
        # Re-create font object for accurate width calculation
        width_font_bold = fitz.Font(fontfile=system_font_bold_path)
    else:
        print("Arial Bold font not found, using Helvetica-Bold")

    fontsize_normal = 9
    fontsize_small = 7
    fontsize_header = 9
    text_color = (0, 0, 0)

    # === COVER SAMPLE DATA WITH APPROPRIATE COLORS ===
    # Customer/Invoice sections: Use lighter beige (matches measured template color)
    # Table rows: Use WHITE (clean table)
    # TOTAL row: Use darker beige (matches measured template color)

    # Measured colors from template:
    # Header: (249, 242, 239) -> (0.976, 0.949, 0.937)
    # Total Row: (242, 228, 223) -> (0.949, 0.894, 0.875)

    header_bg_color = (0.976, 0.949, 0.937)  # Beige for Customer/Invoice sections
    total_bg_color = (0.949, 0.894, 0.875)  # Darker beige for TOTAL row
    white_color = (1, 1, 1)  # White for table data rows

    # CUSTOMER SECTION
    # Customer/Invoice sections: Use lighter beige (matches measured template color)
    customer_beige_areas = [
        # COVER ENTIRE BUYER DETAILS BLOCK (Name, Address, GSTIN, State)
        # to allow dynamic layout collapse.
        # "BUYER (BILL TO):" ends around y=156.
        # "DATED" starts around x=360.
        # Code ends around y=230.
        fitz.Rect(109, 156, 360, 230),
    ]

    # INVOICE SECTION
    invoice_beige_areas = [
        fitz.Rect(367, 178, 450, 190),
        fitz.Rect(487, 178, 556, 190),
        fitz.Rect(367, 194, 480, 212),
        fitz.Rect(487, 214, 556, 226),
    ]

    # ── TABLE GRID: per-cell WHITE boxes using EXACT template coordinates ──
    # Vertical lines: 109.89, 131.71, 280.07, 330.71, 383.71, 443.71, 474.71, 559.28
    # Safe box X ranges (inset by ~1.5pt to avoid touching lines)
    col_x_ranges = [
        (111.5, 130.0),  # S.N.
        (133.5, 278.0),  # Description
        (282.0, 329.0),  # HSN
        (332.5, 382.0),  # Quantity
        (385.5, 442.0),  # Rate
        (445.5, 473.0),  # Unit
        (476.5, 557.5),  # Amount
    ]

    table_white_areas = []

    # Row 1 (Item 1) - Covers "1.", "18K GOLD...", etc.
    y1_top, y1_bot = 262.0, 276.0
    for x_start, x_end in col_x_ranges:
        table_white_areas.append(fitz.Rect(x_start, y1_top, x_end, y1_bot))

    # Row 2 (Item 2) - Covers "2.", "18K GOLD...", etc.
    y2_top, y2_bot = 278.0, 292.0
    for x_start, x_end in col_x_ranges:
        table_white_areas.append(fitz.Rect(x_start, y2_top, x_end, y2_bot))

    # IGST Row (Baseline 386.4 -> Box 377-391)
    # Only cover: Rate, Unit (%), Amount. KEEP Description ("IGST - Output")
    # Rate col index 4, Unit col index 5, Amount col index 6
    y_igst_top, y_igst_bot = 377.0, 391.0
    tax_white_areas = [
        fitz.Rect(col_x_ranges[4][0], y_igst_top, col_x_ranges[4][1], y_igst_bot),  # Rate (3%)
        fitz.Rect(col_x_ranges[5][0], y_igst_top, col_x_ranges[5][1], y_igst_bot),  # Unit (%)
        fitz.Rect(col_x_ranges[6][0], y_igst_top, col_x_ranges[6][1], y_igst_bot),  # Amount
    ]

    # Round Off Row (Baseline 402.0 -> Box 393-407)
    # Only cover: Rate (Value), Amount. KEEP Description ("Round off")
    y_round_top, y_round_bot = 393.0, 407.0
    tax_white_areas.extend(
        [
            fitz.Rect(
                col_x_ranges[4][0], y_round_top, col_x_ranges[4][1], y_round_bot
            ),  # Rate (Value)
            fitz.Rect(col_x_ranges[6][0], y_round_top, col_x_ranges[6][1], y_round_bot),  # Amount
        ]
    )

    # TOTAL Row (Baseline 551.4 -> Box 542-556)
    # Cover: Quantity (Weight), Unit, Amount. KEEP Description ("TOTAL")
    # Qty col index 3, Unit col index 5, Amount col index 6
    y_total_top, y_total_bot = 542.0, 556.0
    total_beige_areas = [
        fitz.Rect(col_x_ranges[3][0], y_total_top, col_x_ranges[3][1], y_total_bot),  # Weight
        fitz.Rect(col_x_ranges[5][0], y_total_top, col_x_ranges[5][1], y_total_bot),  # Unit
        fitz.Rect(col_x_ranges[6][0], y_total_top, col_x_ranges[6][1], y_total_bot),  # Amount
    ]

    # Amount in words - Covers "INR TEN LAKH..."
    words_white_areas = [
        fitz.Rect(114, 569.1, 429, 580),
        fitz.Rect(114, 639.1, 379, 650),
    ]

    # HSN/SAC Tax table at bottom - Covers sample numbers
    tax_table_white_areas = [
        fitz.Rect(291, 610, 557, 624),
    ]

    # Draw BEIGE rectangles for customer section (cover sample data)
    for rect in customer_beige_areas:
        page.draw_rect(rect, color=header_bg_color, fill=header_bg_color, width=0)

    # Draw BEIGE rectangles for invoice section (cover sample data)
    for rect in invoice_beige_areas:
        page.draw_rect(rect, color=header_bg_color, fill=header_bg_color, width=0)

    # Draw WHITE rectangles for table data rows (cover sample data)
    for rect in table_white_areas:
        page.draw_rect(rect, color=white_color, fill=white_color, width=0)

    # Draw WHITE rectangles for tax section (cover sample data)
    for rect in tax_white_areas:
        page.draw_rect(rect, color=white_color, fill=white_color, width=0)

    # Draw BEIGE rectangles for TOTAL row (cover sample data, keep beige background)
    for rect in total_beige_areas:
        page.draw_rect(rect, color=total_bg_color, fill=total_bg_color, width=0)

    # Draw WHITE rectangles for amount in words (cover sample data)
    for rect in words_white_areas:
        page.draw_rect(rect, color=white_color, fill=white_color, width=0)

    # Draw WHITE rectangles for HSN/SAC tax table (cover sample data)
    for rect in tax_table_white_areas:
        page.draw_rect(rect, color=white_color, fill=white_color, width=0)

    # === NO SAMPLE DATA REMOVAL NEEDED - TEMPLATE IS CLEAN ===

    # Text color - Dark maroon matching template (RGB: 87, 14, 19)
    text_color = (0.341, 0.055, 0.075)

    # === FORMATTING FUNCTIONS ===
    def format_currency(amount):
        """Format as X,XXX.XX (no currency symbol - template provides context)"""
        try:
            return f"{float(amount):,.2f}"
        except (ValueError, TypeError):
            return "0.00"

    def format_weight(weight):
        """Format as X.XXX GMS"""
        try:
            return f"{float(weight):.3f} GMS"
        except (ValueError, TypeError):
            return "0.000 GMS"

    def format_percentage(rate):
        """Format as X.X%"""
        try:
            return f"{float(rate):.1f}%"
        except (ValueError, TypeError):
            return "0.0%"

    # === OVERLAY DYNAMIC DATA WITH EXACT COORDINATES ===
    # Using BASELINE Y coordinates (bottom of text bounding box)

    # BUYER SECTION (Left side, below "BUYER (BILL TO):")
    # Redacted entire block, so we must draw labels and values dynamically.
    cursor_y = 166.4  # Starting Y (Baseline for Name)
    line_height = 12  # Standard line spacing

    # 1. Customer Name
    if customer_name:
        page.insert_text(
            (109.9, cursor_y), customer_name, fontsize=10, fontname=fontname_bold, color=text_color
        )
        cursor_y += line_height

    # 2. Customer Address
    if customer_address:
        # Clean and format address
        address_text = customer_address.replace("\n", ", ")
        page.insert_text(
            (109.9, cursor_y),
            address_text[:60],  # Limit length
            fontsize=8.75,
            fontname=fontname,
            color=text_color,
        )
        cursor_y += line_height

    # 3. GSTIN (Conditional)
    if customer_gstin:
        # Draw Label (Bold) and Value (Regular)
        label = "GSTIN/UIN: "
        page.insert_text(
            (109.9, cursor_y), label, fontsize=8.75, fontname=fontname_bold, color=text_color
        )

        # Calculate width using the font object (points)
        label_width = width_font_bold.text_length(label, fontsize=8.75)

        # Draw Value immediately after label (plus small gap? PyMuPDF coordinates are tight)
        page.insert_text(
            (109.9 + label_width, cursor_y),
            customer_gstin,
            fontsize=8.75,
            fontname=fontname,
            color=text_color,
        )
        cursor_y += line_height

    # 4. State Info (Stacked)
    if customer_state:
        label = "State Name: "
        page.insert_text(
            (109.9, cursor_y), label, fontsize=8.75, fontname=fontname_bold, color=text_color
        )

        label_width = width_font_bold.text_length(label, fontsize=8.75)

        page.insert_text(
            (109.9 + label_width, cursor_y),
            customer_state,
            fontsize=8.75,
            fontname=fontname,
            color=text_color,
        )
        cursor_y += line_height

    if customer_state_code:
        label = "Code: "
        page.insert_text(
            (109.9, cursor_y), label, fontsize=8.75, fontname=fontname_bold, color=text_color
        )

        label_width = width_font_bold.text_length(label, fontsize=8.75)

        page.insert_text(
            (109.9 + label_width, cursor_y),
            customer_state_code,
            fontsize=8.75,
            fontname=fontname,
            color=text_color,
        )
        cursor_y += line_height

    # INVOICE SECTION (Right side)
    # DATED value at x=367.2, y_baseline=186.7 (where "03/01/2026" was)
    page.insert_text(
        (367.2, 186.7), invoice_date, fontsize=8.36, fontname=fontname, color=text_color
    )

    # INVOICE NO. value at x=487.9, y_baseline=186.7 (where "28" was)
    page.insert_text(
        (487.9, 186.7), invoice_number, fontsize=8.36, fontname=fontname, color=text_color
    )

    # MODE/TERMS OF PAYMENT value at x=367.2, y_baseline=204 (estimated)
    if payment_terms:
        page.insert_text(
            (367.2, 204.0), payment_terms, fontsize=8.36, fontname=fontname, color=text_color
        )

    # Place of Supply at x=487.9, y_baseline=221.8 (where "03 (Punjab)" was)
    place_text = f"{customer_state_code} ({customer_state})" if customer_state else place_of_supply
    if place_text:
        page.insert_text(
            (487.9, 221.8), place_text, fontsize=8.36, fontname=fontname, color=text_color
        )

    # LINE ITEMS TABLE
    # Based on exact BASELINE coordinates from template extraction
    # Column positions (x coordinates):
    col_sn = 113.9  # S.N. (where "1." appears)
    col_desc = 135.6  # DESCRIPTION OF GOODS (where "18K GOLD JEWELLERY" appears)
    col_hsn = 289.7  # HSN CODE (header position)
    col_qty = 336.8  # QUANTITY (where "4.910 GMS" appears)
    col_rate_rupee = 400.0  # Rupee symbol position (in RATE column, template x0=400.5)
    col_rate = 406.0  # RATE value (template x0=406.2)
    col_unit = 450.3  # UNIT (where "GMS" appears, template x0=450.3)
    col_amount_rupee = 512.0  # Rupee symbol position (in AMOUNT column, template x0=512.4)
    col_amount = 518.0  # AMOUNT value (template x0=518.1)

    # Row positions (BASELINE y coordinates):
    table_y_start = 273.4  # First data row BASELINE (where row 1 data appears)
    line_height = 15.6  # Distance between row baselines (289.0 - 273.4)

    # Track computed amounts for dynamic totals calculation
    computed_line_amounts = []

    if line_items:
        for idx, item in enumerate(line_items[:10]):  # Max 10 items
            y = table_y_start + (idx * line_height)

            # S.N. at x=113.9
            page.insert_text(
                (col_sn, y), f"{idx + 1}.", fontsize=7.88, fontname=fontname, color=text_color
            )

            # DESCRIPTION OF GOODS at x=135.6
            desc = item.get("particulars", "")
            page.insert_text(
                (col_desc, y),
                desc[:30],  # Limit to 30 chars
                fontsize=7.88,
                fontname=fontname,
                color=text_color,
            )

            # HSN CODE at x=289.7
            hsn = item.get("hsn_code", "")
            if hsn:
                page.insert_text(
                    (col_hsn, y), hsn, fontsize=7.88, fontname=fontname, color=text_color
                )

            # QUANTITY at x=336.8 (format: "4.910 GMS")
            weight = item.get("weight", 0)
            unit = item.get("unit", "GMS")
            if weight:
                qty_text = f"{float(weight):.3f} {unit}"
                page.insert_text(
                    (col_qty, y), qty_text, fontsize=7.88, fontname=fontname, color=text_color
                )

            # RATE value
            rate = item.get("rate", 0)
            rate_text = f"{float(rate):,.2f}"
            page.insert_text(
                (col_rate, y), rate_text, fontsize=7.88, fontname=fontname, color=text_color
            )

            # UNIT column
            page.insert_text(
                (col_unit, y), unit, fontsize=7.88, fontname=fontname, color=text_color
            )

            # AMOUNT - DYNAMICALLY COMPUTE as rate × weight (don't trust stored amount)
            rate_val = float(rate) if rate else 0
            weight_val = float(weight) if weight else 0
            computed_amount = rate_val * weight_val
            computed_line_amounts.append(computed_amount)

            amount_text = f"{computed_amount:,.2f}"
            page.insert_text(
                (col_amount, y), amount_text, fontsize=7.88, fontname=fontname, color=text_color
            )

    # TAX SECTION (below line items)
    # Dynamically compute ALL values from line items
    num_items = len(line_items) if line_items else 0
    y_igst = 388.3  # IGST baseline Y
    y_roundoff = 403.9  # Round off baseline Y

    # Dynamically compute subtotal from computed line amounts
    computed_subtotal = sum(computed_line_amounts)

    # Dynamically compute GST
    computed_gst = computed_subtotal * (float(gst_rate) / 100.0)

    # Dynamically compute grand total before rounding
    pre_round_total = computed_subtotal + computed_gst

    # Dynamically compute round-off (round to nearest integer)
    rounded_total = round(pre_round_total)
    computed_round_off = round(rounded_total - pre_round_total, 2)

    # Final total
    computed_total = rounded_total

    # IGST VALUES ONLY (label already in template)
    # IGST percentage in RATE column area (template: x0=411.3)
    page.insert_text(
        (411.0, y_igst), f"{gst_rate:.0f}", fontsize=7.88, fontname=fontname, color=text_color
    )
    # % symbol (template: x0=456.1)
    page.insert_text((456.0, y_igst), "%", fontsize=7.88, fontname=fontname, color=text_color)
    # IGST amount in AMOUNT column
    page.insert_text(
        (col_amount, y_igst),
        f"{computed_gst:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # Round off VALUE ONLY (label already in template)
    # Value in RATE column area (template: x0=408.7)
    page.insert_text(
        (408.7, y_roundoff),
        f"{abs(computed_round_off):.1f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )
    # Round off amount in AMOUNT column
    page.insert_text(
        (col_amount, y_roundoff),
        f"{computed_round_off:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # TOTAL VALUES ONLY (label already in template)
    y_total = 553.3
    total_weight = sum(float(item.get("weight", 0)) for item in (line_items or []))
    total_unit = "GMS"  # Default
    if line_items:
        # Use the unit from the first item if available
        total_unit = line_items[0].get("unit", "GMS")

    # Total weight at x=336.6 (in QUANTITY column)
    page.insert_text(
        (336.6, y_total),
        f"{float(total_weight):.3f} {total_unit}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )
    # Unit in UNIT column (template: x0=453.9)
    page.insert_text(
        (453.9, y_total), total_unit, fontsize=7.88, fontname=fontname, color=text_color
    )
    # Total amount in AMOUNT column
    page.insert_text(
        (col_amount, y_total),
        f"{computed_total:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # AMOUNT CHARGEABLE IN WORDS at x=113.89, y_baseline=578.6
    amount_words = number_to_words_indian(computed_total)
    page.insert_text(
        (113.89, 578.6), amount_words, fontsize=8.0, fontname=fontname, color=text_color
    )

    # Second occurrence at y_baseline=648.7
    page.insert_text(
        (113.89, 648.7), amount_words, fontsize=8.0, fontname=fontname, color=text_color
    )

    # TAX TABLE (HSN/SAC section below Amount Chargeable)
    # Row 1 data: S.N.=1, Taxable Value, IGST Rate, IGST Amount, Total Tax Amount
    # TAX TABLE (HSN/SAC section below Amount Chargeable)
    # Row 1 data: S.N.=1, Taxable Value, IGST Rate, IGST Amount, Total Tax Amount
    y_tax_row = 621.0  # Baseline Y for tax table data row 1 (matches template, inside redaction)

    # S.N. "1" (at left of table, template x0=119.1)
    page.insert_text((119.0, y_tax_row), "1", fontsize=7.88, fontname=fontname, color=text_color)

    # Taxable Value (subtotal before GST)
    # Header is at x=292, align value slightly right
    page.insert_text(
        (300.0, y_tax_row),
        f"{computed_subtotal:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # IGST Rate
    # Header RATE is at x=349
    page.insert_text(
        (355.0, y_tax_row), f"{gst_rate:.0f}%", fontsize=7.88, fontname=fontname, color=text_color
    )

    # IGST Amount
    # Header AMOUNT is at x=400
    page.insert_text(
        (405.0, y_tax_row),
        f"{computed_gst:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # Total Tax Amount (= GST amount)
    page.insert_text(
        (col_amount_rupee, y_tax_row), "₹", fontsize=7.88, fontname=fontname, color=text_color
    )
    page.insert_text(
        (col_amount, y_tax_row),
        f" {computed_gst:,.2f}",
        fontsize=7.88,
        fontname=fontname,
        color=text_color,
    )

    # BANK DETAILS - Already in clean template, preserved
    # Do NOT overlay anything on bank details section

    # INSERT PRODUCT IMAGE (if provided)
    if product_image_path and os.path.exists(product_image_path):
        try:
            img_rect = fitz.Rect(20, 50, 120, 180)
            page.insert_text((0, 0), "test", fontname=fontname, fontsize=1)
        except Exception as e:
            print(f"Warning: Could not insert product image: {str(e)}")

    # === PROCESS PAGE 2 (PACKING LIST) ===
    # Template page 2 is ~595 x 842 px. It has TWO stacked packing list
    # sections with pre-filled sample data.  We redact ALL sample data
    # and re-populate ONLY section 1 with estimate data.
    #
    # Actual template text coordinates (from extraction):
    #   Section 1 header:  SJER174 (62,196) | GOLD EARRING (245,196) | DATE (446,196) | 03/01/2026 (499,196)
    #   Section 1 subheader: SJER174 (63,221)
    #   Section 1 col headers row: y≈216  Particulars(126) Shape(232) Colour(266) Clarity(300) Pcs(336) Carats(361) Grams(396) Rate(448) Amount(508)
    #   Section 1 data rows:        y≈235, 259, 282   (line_height ≈ 23)
    #   Section 1 totals:           y≈305, 328, 351
    #   Section 1 image:            (38,250)-(120,324)
    #
    #   Section 2 header:  SJLRN324 (59,384) | LADIES RING (250,384) | DATE (446,384) | 03/01/2026 (499,384)
    #   Section 2 col headers row:  y≈404
    #   Section 2 data rows:        y≈423, 447, 470, 493
    #   Section 2 totals:           y≈516, 539, 562
    #   Section 2 image:            (37,438)-(122,512)

    if len(doc) > 1:
        page2 = doc[1]

        # Ensure Page 2 has the custom font loaded if we are using it
        # PyMuPDF requires fonts to be registered per-page for non-standard fonts
        text_color = (0.341, 0.055, 0.075)

        # ── REDACTION: cover ALL pre-filled sample data with white ──
        # We use PyMuPDF's real redaction API so the text is truly removed.

        # Helper: add a redaction annotation (white fill, no outline)
        def add_redact(rect):
            annot = page2.add_redact_annot(rect, fill=(1, 1, 1))

        # --- Section 1 (y ≈ 185 - 375) ---
        # Header bar text (estimate no, item name, date) — dark bg, white text
        add_redact(fitz.Rect(55, 190, 230, 210))  # estimate code + item code
        add_redact(fitz.Rect(230, 190, 445, 210))  # item name
        add_redact(fitz.Rect(445, 190, 560, 210))  # DATE + value

        # Sub-header estimate number (below main header)
        add_redact(fitz.Rect(55, 215, 125, 235))  # SJER174 sub-header

        # Aggressive Redaction for Section 1 Data+Totals area
        # Must cover full width (35 to 560) to catch ALL template grid lines
        # Template grid spans from y=212 (col headers) down to y=366.8 (bottom)
        # We redact from y=228.2 (below col headers) to y=367 (bottom)
        add_redact(fitz.Rect(35, 228, 560, 367))

        # Section 1 product image area
        add_redact(fitz.Rect(35, 245, 125, 330))

        # --- Section 2 (y ≈ 375 - 580) — fully blank it out ---
        # Header bar
        add_redact(fitz.Rect(55, 378, 560, 398))

        # Sub-row area (data + totals)
        for row_y_top in [416, 439, 462, 485, 508]:
            add_redact(fitz.Rect(122, row_y_top, 560, row_y_top + 18))

        # Section 2 totals
        add_redact(fitz.Rect(500, 510, 560, 530))
        add_redact(fitz.Rect(500, 533, 560, 553))
        add_redact(fitz.Rect(500, 556, 560, 577))

        # Section 2 product image
        add_redact(fitz.Rect(33, 432, 127, 518))

        # Apply all redactions
        page2.apply_redactions()

        # Re-register font on Page 2 AFTER redactions (redactions strip font resources)
        if fontname == "arial":
            if os.path.exists(local_font_path):
                page2.insert_font(fontname="arial", fontfile=local_font_path)
            elif os.path.exists(system_font_path):
                page2.insert_font(fontname="arial", fontfile=system_font_path)

        # ── DATA INSERTION ──
        if estimate_line_items:
            print(f"\n=== PACKING LIST DEBUG ===")
            print(f"Estimate Number: {estimate_number}")
            print(f"Item Name: {item_name}")
            print(f"Estimate Date: {estimate_date if estimate_date else invoice_date}")
            print(f"Product Image Path: {product_image_path}")
            print(f"Number of line items: {len(estimate_line_items)}")
            for idx, item in enumerate(estimate_line_items):
                print(f"  Line {idx + 1}: {item}")
            print(f"=========================\n")

            packing_date = estimate_date if estimate_date else invoice_date

            # -- Column boundaries (left_x, right_x) for textbox insertion --
            # Template vertical lines: 36.1, 122.6, 227.6, 261.6, 295.6, 330.6,
            #                          356.6, 390.6, 427.6, 486.6, 559.2
            col_bounds_p2 = {
                "particulars": (122.6, 227.6),
                "shape": (227.6, 261.6),
                "colour": (261.6, 295.6),
                "clarity": (295.6, 330.6),
                "pcs": (330.6, 356.6),
                "carats": (356.6, 390.6),
                "grams": (390.6, 427.6),
                "rate": (427.6, 486.6),
                "amount": (486.6, 559.2),
            }

            # Kept for Section 2 grid drawing reference
            v_lines = [122.6, 227.6, 261.6, 295.6, 330.6, 356.6, 390.6, 427.6, 486.6, 559.2]

            # Helper: insert text within a cell using textbox (bounded, aligned)
            def insert_p2_cell(
                text, col_name, y_top, y_bottom, fontsize=8, align=fitz.TEXT_ALIGN_LEFT
            ):
                left, right = col_bounds_p2[col_name]
                rect = fitz.Rect(left + 2, y_top, right - 2, y_bottom)
                page2.insert_textbox(
                    rect, text, fontsize=fontsize, fontname=fontname, color=text_color, align=align
                )

            def format_num(val):
                return f"{float(val):,.2f}"

            def format_rs(val):
                return f"Rs. {float(val):,.2f}"

            # -- Header (Section 1, dark background row) --
            # Estimate code
            if estimate_number:
                page2.insert_text(
                    (63, 205),
                    estimate_number.upper(),
                    fontsize=9,
                    fontname=fontname,
                    color=(1, 1, 1),
                )
                # Sub-header: estimate number in the first data cell (left of Particulars)
                page2.insert_text(
                    (40, 243),
                    estimate_number.upper(),
                    fontsize=9,
                    fontname=fontname,
                    color=text_color,
                )

            # Item name
            if item_name:
                page2.insert_text(
                    (246, 205), item_name.upper(), fontsize=9, fontname=fontname, color=(1, 1, 1)
                )

            # Date
            page2.insert_text(
                (500, 205), packing_date, fontsize=9, fontname=fontname, color=(1, 1, 1)
            )

            # Insert Product Image if available (Section 1 image area)
            if product_image_path and os.path.exists(product_image_path):
                print(f"DEBUG: Inserting image from {product_image_path}")
                # Image area: x=36.1 to 122.6, y=228.2 to 251.3 (roughly matching cell size?)
                # Actually spans 3 rows: 228.2 to 297.5
                img_rect = fitz.Rect(36.1, 228.2, 122.6, 297.5)
                # Draw white box first ensure clean background
                page2.draw_rect(img_rect, color=None, fill=(1, 1, 1))
                try:
                    page2.insert_image(img_rect, filename=product_image_path, keep_proportion=True)
                    print(f"DEBUG: Image inserted successfully at {img_rect}")
                except Exception as e:
                    print(f"ERROR: Failed to insert image: {e}")
            else:
                print(f"DEBUG: No product image found at: {product_image_path}")

            # -- Draw Table Grid (EXACT template coordinates) --
            # Full-height vertical lines (left-inner, Rate divider, Right border)
            for vx in [36.1, 122.6, 486.6, 559.2]:
                page2.draw_line((vx, 228.2), (vx, 366.8), color=text_color, width=0.5)

            # Data-only vertical lines (internal column dividers) — stop at y=297.5
            for vx in [227.6, 261.6, 295.6, 330.6, 356.6, 390.6, 427.6]:
                page2.draw_line((vx, 228.2), (vx, 297.5), color=text_color, width=0.5)

            # Horizontal lines (EXACT from template)
            h_y_values = [228.2, 251.3, 274.4, 297.5, 320.6, 343.7, 366.8]
            for hy in h_y_values:
                if hy <= 297.5:
                    page2.draw_line((122.6, hy), (559.2, hy), color=text_color, width=0.5)
                else:
                    page2.draw_line((122.6, hy), (559.2, hy), color=text_color, width=0.5)
                    page2.draw_line((36.1, hy), (122.6, hy), color=text_color, width=0.5)

            # Data rows: use textbox-based insertion within cell boundaries
            # Template row tops: 228.2, 251.3, 274.4  (row bottoms: 251.3, 274.4, 297.5)
            row_tops = [228.2, 251.3, 274.4]
            row_bottoms = [251.3, 274.4, 297.5]
            max_rows = 3  # Template has exactly 3 data rows

            # Track computed amounts for totals
            section1_computed_amounts = []

            items_inserted = 0
            for idx, item in enumerate(estimate_line_items[:max_rows]):
                yt = row_tops[idx]
                yb = row_bottoms[idx]

                particulars = item.get("particulars", "")
                if particulars:
                    insert_p2_cell(particulars[:25], "particulars", yt, yb, fontsize=9)
                    items_inserted += 1

                shape = item.get("shape", "")
                if shape:
                    insert_p2_cell(
                        shape[:8], "shape", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                    )

                colour = item.get("colour", "")
                if colour:
                    insert_p2_cell(
                        colour[:8], "colour", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                    )

                clarity = item.get("clarity", "")
                if clarity:
                    insert_p2_cell(
                        clarity[:8], "clarity", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_CENTER
                    )

                quantity = item.get("quantity", 0)
                if quantity:
                    insert_p2_cell(
                        str(int(quantity)), "pcs", yt, yb, fontsize=9, align=fitz.TEXT_ALIGN_CENTER
                    )

                carats = item.get("carats", "")
                if carats:
                    insert_p2_cell(
                        f"{float(carats):.2f}",
                        "carats",
                        yt,
                        yb,
                        fontsize=8,
                        align=fitz.TEXT_ALIGN_CENTER,
                    )

                weight = item.get("weight", 0)
                if weight:
                    insert_p2_cell(
                        f"{float(weight):.3f}",
                        "grams",
                        yt,
                        yb,
                        fontsize=8,
                        align=fitz.TEXT_ALIGN_CENTER,
                    )

                rate = item.get("rate", 0)
                if rate:
                    insert_p2_cell(
                        format_rs(rate), "rate", yt, yb, fontsize=8, align=fitz.TEXT_ALIGN_RIGHT
                    )

                # AMOUNT - DYNAMICALLY COMPUTE from rate × weight/carats
                rate_val = float(rate) if rate else 0
                carats_val = float(carats) if carats else 0
                weight_val = float(weight) if weight else 0

                # Use carats if available, otherwise use weight
                quantity_val = carats_val if carats_val > 0 else weight_val

                computed_amount = rate_val * quantity_val
                section1_computed_amounts.append(computed_amount)

                # Amount column header has (Rs), so just number here
                insert_p2_cell(
                    format_num(computed_amount),
                    "amount",
                    yt,
                    yb,
                    fontsize=8,
                    align=fitz.TEXT_ALIGN_RIGHT,
                )

            print(f"✅ Inserted {items_inserted} line items into section 1")

            # -- Totals - use dynamically computed amounts --
            packing_total_taxable = sum(section1_computed_amounts)
            packing_gst = packing_total_taxable * 0.03
            packing_grand_total = packing_total_taxable + packing_gst

            # Totals labels (EXACT positions from template text extraction)
            # Rows: 297.5-320.6, 320.6-343.7, 343.7-366.8
            page2.insert_text(
                (407.9, 312.9),
                "Total Taxable Value",
                fontsize=7.9,
                fontname=fontname,
                color=text_color,
            )
            insert_p2_cell(
                format_rs(packing_total_taxable),
                "amount",
                297.5,
                320.6,
                fontsize=8,
                align=fitz.TEXT_ALIGN_RIGHT,
            )

            page2.insert_text(
                (446.2, 336.0), "GST@3%", fontsize=7.9, fontname=fontname, color=text_color
            )
            insert_p2_cell(
                format_rs(packing_gst),
                "amount",
                320.6,
                343.7,
                fontsize=8,
                align=fitz.TEXT_ALIGN_RIGHT,
            )

            page2.insert_text(
                (438.0, 359.1), "Grand Total", fontsize=7.9, fontname=fontname, color=text_color
            )
            insert_p2_cell(
                format_rs(packing_grand_total),
                "amount",
                343.7,
                366.8,
                fontsize=9,
                align=fitz.TEXT_ALIGN_RIGHT,
            )

            print(
                f"✅ Totals - Taxable: ₹{packing_total_taxable:,.2f}, GST: ₹{packing_gst:,.2f}, Grand: ₹{packing_grand_total:,.2f}"
            )

            # -- If there are more than 5 items, populate Section 2 --
            remaining_items = estimate_line_items[max_rows:]
            if remaining_items:
                # Section 2 header
                page2.insert_text(
                    (60, 393),
                    estimate_number.upper() if estimate_number else "",
                    fontsize=9,
                    fontname=fontname,
                    color=(1, 1, 1),
                )
                page2.insert_text(
                    (251, 393),
                    (item_name or "").upper(),
                    fontsize=9,
                    fontname=fontname,
                    color=(1, 1, 1),
                )
                page2.insert_text(
                    (500, 393), packing_date, fontsize=9, fontname=fontname, color=(1, 1, 1)
                )

                # -- Draw Table Grid (Restore Section 2) --
                # Extended to 577 to populate full totals area
                for vx in v_lines:
                    page2.draw_line((vx, 403), (vx, 577), color=text_color, width=0.5)
                # Horizontal lines (Header)
                page2.draw_line((122, 416), (560, 416), color=text_color, width=0.5)
                # Horizontal lines for Rows
                for i in range(1, 8):
                    y_line = 416 + (i * 23)
                    page2.draw_line((122, y_line), (560, y_line), color=text_color, width=0.5)

                sec2_row_tops = [416, 439, 462, 485]
                sec2_row_bottoms = [439, 462, 485, 508]
                sec2_max = 4  # Reduced to 4 to avoid overlap with Totals

                # Track computed amounts for section 2 totals
                section2_computed_amounts = []

                for idx, item in enumerate(remaining_items[:sec2_max]):
                    s2_yt = sec2_row_tops[idx]
                    s2_yb = sec2_row_bottoms[idx]

                    particulars = item.get("particulars", "")
                    if particulars:
                        insert_p2_cell(particulars[:25], "particulars", s2_yt, s2_yb, fontsize=9)

                    shape = item.get("shape", "")
                    if shape:
                        insert_p2_cell(
                            shape[:8],
                            "shape",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    colour = item.get("colour", "")
                    if colour:
                        insert_p2_cell(
                            colour[:8],
                            "colour",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    clarity = item.get("clarity", "")
                    if clarity:
                        insert_p2_cell(
                            clarity[:8],
                            "clarity",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    quantity = item.get("quantity", 0)
                    if quantity:
                        insert_p2_cell(
                            str(int(quantity)),
                            "pcs",
                            s2_yt,
                            s2_yb,
                            fontsize=9,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    carats = item.get("carats", "")
                    if carats:
                        insert_p2_cell(
                            f"{float(carats):.2f}",
                            "carats",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    weight = item.get("weight", 0)
                    if weight:
                        insert_p2_cell(
                            f"{float(weight):.3f}",
                            "grams",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_CENTER,
                        )

                    rate = item.get("rate", 0)
                    if rate:
                        insert_p2_cell(
                            format_rs(rate),
                            "rate",
                            s2_yt,
                            s2_yb,
                            fontsize=8,
                            align=fitz.TEXT_ALIGN_RIGHT,
                        )

                    # AMOUNT - DYNAMICALLY COMPUTE from rate × weight/carats
                    rate_val = float(rate) if rate else 0
                    carats_val = float(carats) if carats else 0
                    weight_val = float(weight) if weight else 0

                    # Use carats if available, otherwise use weight
                    quantity_val = carats_val if carats_val > 0 else weight_val

                    computed_amount = rate_val * quantity_val
                    section2_computed_amounts.append(computed_amount)

                    # Amount column header has (Rs), so just number here
                    insert_p2_cell(
                        format_num(computed_amount),
                        "amount",
                        s2_yt,
                        s2_yb,
                        fontsize=8,
                        align=fitz.TEXT_ALIGN_RIGHT,
                    )

                # Section 2 totals - use dynamically computed amounts
                sec2_total = sum(section2_computed_amounts)
                sec2_gst = sec2_total * 0.03
                sec2_grand = sec2_total + sec2_gst
                insert_p2_cell(
                    format_rs(sec2_total),
                    "amount",
                    508,
                    531,
                    fontsize=8,
                    align=fitz.TEXT_ALIGN_RIGHT,
                )
                insert_p2_cell(
                    format_rs(sec2_gst), "amount", 531, 554, fontsize=8, align=fitz.TEXT_ALIGN_RIGHT
                )
                insert_p2_cell(
                    format_rs(sec2_grand),
                    "amount",
                    554,
                    577,
                    fontsize=9,
                    align=fitz.TEXT_ALIGN_RIGHT,
                )

                print(f"✅ Populated section 2 with {len(remaining_items[:sec2_max])} items")
            else:
                # If no remaining items, hide Section 2 completely
                # Cover Header Bar (378) to Bottom (580)
                print("DEBUG: Hiding Section 2 (Unused)")
                page2.draw_rect(fitz.Rect(30, 375, 580, 580), color=(1, 1, 1), fill=(1, 1, 1))

            print(f"=== PACKING LIST PROCESSING COMPLETE ===\n")

    # Save to bytes
    output = io.BytesIO()
    doc.save(output)
    doc.close()

    pdf_bytes = output.getvalue()
    output.close()

    return pdf_bytes
