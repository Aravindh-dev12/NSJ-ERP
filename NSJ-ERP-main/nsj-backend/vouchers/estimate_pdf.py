"""
Estimate PDF Generator using PyMuPDF (fitz)

This module generates pixel-perfect estimate PDFs by overlaying dynamic text
on top of the official Nitishah Jewels template PDF.

The template PDF is used as the base - we do NOT recreate the layout.
Only dynamic values (item name, line items, totals) are written at fixed coordinates.
The table structure/grid lines are preserved from the template.
"""

import io
import os
import platform
from decimal import Decimal
from typing import List, Dict, Any, Optional, Union

import fitz  # PyMuPDF


# =============================================================================
# COORDINATE MAPPING CONSTANTS (from template analysis)
# =============================================================================
# Template is A3 landscape: 1191 x 842 points (420mm x 297mm)
# PyMuPDF coordinate system: Origin (0,0) is TOP-LEFT corner
#
# Template text positions (from analysis):
#   ADDRESS: (736, 107)
#   GSTIN: (736, 140)
#   EMAIL: (736, 151)
#   PHONE: (736, 163)
#   Item name placeholder: (623, 235)
#   PARTICULARS header: (321, 257)
#   First data row (DIAMOND): Y=279
#   Row 2 (SEMI PRECIOUS): Y=300
#   Row 3 (18K GOLD): Y=425
#   Row 4 (CRAFTSMANSHIP): Y=446
#   TOTAL TAXABLE VALUE: Y=466
#   GST @ 3%: Y=487
#   GRAND TOTAL: Y=508

# Page dimensions
PAGE_WIDTH = 1191
PAGE_HEIGHT = 842

# Item name position - in the beige header bar where "item name with gold kt" placeholder is
# The placeholder text is at (623, 235) - we'll draw centered around X=720
ITEM_NAME_X = 720
ITEM_NAME_Y = 235  # Same Y as the placeholder text

# Image position in the IMAGE column (left side of table)
IMAGE_RECT = {
    "left": 168,
    "top": 280,
    "right": 295,
    "bottom": 440,
}

# Table column X positions (from template analysis)
# Headers at Y=257, data starts at Y=279
# Template data positions (right edge for right-aligned columns):
#   PARTICULARS: left-aligned at X=321
#   SHAPE: center at ~517
#   COLOUR: center at ~570
#   CLARITY: center at ~633
#   PC: center at ~693-696
#   WEIGHT: right-aligned, values end at ~780
#   UNIT: center at ~823-824
#   RATE: right-aligned, ₹48,000.00 ends at ~940
#   AMOUNT: right-aligned, 696,960.00 ends at ~1040
COLUMN_X = {
    "particulars": 321,  # Left-aligned
    "shape": 517,  # Center-aligned
    "colour": 580,  # Center-aligned
    "clarity": 640,  # Center-aligned
    "pc": 700,  # Center-aligned
    "weight": 780,  # Right-aligned (value ends here)
    "unit": 830,  # Center-aligned
    "rate": 935,  # Right-aligned (value ends here) - adjusted for Arial font
    "amount": 1035,  # Right-aligned (value ends here) - adjusted for Arial font
}

# Table row positions
# The template has rows at: 279, 300, (gap), 425, 446
# We'll use consistent spacing for our data
ROW_START_Y = 279
ROW_HEIGHT = 21
MAX_ROWS_PER_PAGE = 8

# Totals section positions (from template)
# Values are right-aligned, ending around X=1035
TOTALS_VALUE_X = 1035  # Right-aligned with amount column
TOTAL_TAXABLE_Y = 466
GST_Y = 487
DISCOUNT_Y = 497  # New discount row (between GST and Grand Total)
GRAND_TOTAL_Y = 508

# Font settings
# Use Arial for better Unicode support (including ₹ symbol)
# Fall back to Helvetica if Arial not available
FONT_NAME = "helv"  # Will be overridden if Arial is available
FONT_SIZE_NORMAL = 9
FONT_SIZE_HEADER = 11
FONT_SIZE_TOTALS = 10

COLOR_BLACK = (0, 0, 0)

# Try to find Arial font for rupee symbol support
ARIAL_FONT_PATH = None
if platform.system() == "Windows":
    import os as _os

    _arial = _os.path.join("C:/Windows/Fonts", "arial.ttf")
    if _os.path.exists(_arial):
        ARIAL_FONT_PATH = _arial
elif platform.system() == "Darwin":  # macOS
    import os as _os

    _arial = "/Library/Fonts/Arial.ttf"
    if _os.path.exists(_arial):
        ARIAL_FONT_PATH = _arial
elif platform.system() == "Linux":
    import os as _os

    # Common locations for Arial on Linux
    for _path in [
        "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
        "/usr/share/fonts/TTF/arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf",
    ]:
        if _os.path.exists(_path):
            ARIAL_FONT_PATH = _path
            break


# =============================================================================
# FORMATTING HELPER FUNCTIONS
# =============================================================================


def format_currency_inr(
    value: Union[float, Decimal, int, None], include_symbol: bool = True
) -> str:
    """Format a number as Indian Rupee currency with proper Indian numbering system."""
    if value is None:
        return ""

    try:
        num = float(value)
    except (ValueError, TypeError):
        return str(value)

    is_negative = num < 0
    num = abs(num)

    # Format with 2 decimal places
    formatted = f"{num:,.2f}"
    parts = formatted.split(".")
    integer_part = parts[0].replace(",", "")
    decimal_part = parts[1] if len(parts) > 1 else "00"

    # Apply Indian numbering system (lakhs, crores)
    # Format: 1,23,45,678.00 (last 3 digits, then groups of 2)
    if len(integer_part) <= 3:
        indian_format = integer_part
    else:
        indian_format = integer_part[-3:]
        remaining = integer_part[:-3]

        while remaining:
            if len(remaining) <= 2:
                indian_format = remaining + "," + indian_format
                remaining = ""
            else:
                indian_format = remaining[-2:] + "," + indian_format
                remaining = remaining[:-2]

    result = f"{indian_format}.{decimal_part}"
    if is_negative:
        result = "-" + result
    if include_symbol:
        # Use Unicode rupee symbol if Arial font is available, otherwise use "Rs."
        if ARIAL_FONT_PATH:
            result = "\u20b9" + result
        else:
            result = "Rs." + result

    return result


def format_decimal(value: Union[float, Decimal, int, None], decimals: int = 2) -> str:
    """Format a number with specified decimal places."""
    if value is None:
        return ""

    try:
        num = float(value)
        return f"{num:.{decimals}f}"
    except (ValueError, TypeError):
        return str(value)


# =============================================================================
# PDF TEXT DRAWING FUNCTIONS
# =============================================================================


def draw_text(
    page: fitz.Page,
    x: float,
    y: float,
    text: str,
    fontsize: float = FONT_SIZE_NORMAL,
    fontname: str = FONT_NAME,
    color: tuple = COLOR_BLACK,
    align: str = "left",
) -> None:
    """Draw text on a PDF page at specified coordinates.

    Uses Arial font if available for better Unicode support (₹ symbol).
    Falls back to Helvetica otherwise.
    """
    if not text:
        return

    text = str(text)

    # Check if text contains rupee symbol and we have Arial available
    use_arial = ARIAL_FONT_PATH and ("\u20b9" in text or "₹" in text)

    if use_arial:
        # For Arial, we need to estimate text width differently
        # Use a simple approximation based on character count and font size
        # Average character width is approximately 0.5 * fontsize for Arial
        avg_char_width = fontsize * 0.55
        text_width = len(text) * avg_char_width

        if align == "right":
            actual_x = x - text_width
        elif align == "center":
            actual_x = x - (text_width / 2)
        else:
            actual_x = x

        page.insert_text(
            point=(actual_x, y),
            text=text,
            fontsize=fontsize,
            fontname="arial",
            fontfile=ARIAL_FONT_PATH,
            color=color,
        )
    else:
        # Use built-in font
        text_width = fitz.get_text_length(text, fontname=fontname, fontsize=fontsize)

        if align == "right":
            actual_x = x - text_width
        elif align == "center":
            actual_x = x - (text_width / 2)
        else:
            actual_x = x

        page.insert_text(
            point=(actual_x, y),
            text=text,
            fontsize=fontsize,
            fontname=fontname,
            color=color,
        )


# =============================================================================
# MAIN PDF GENERATION FUNCTION
# =============================================================================


def generate_estimate_pdf(
    item_name: str,
    line_items: List[Dict[str, Any]],
    totals: Dict[str, float],
    image_data: Optional[bytes] = None,
    size_details: Optional[str] = None,
) -> bytes:
    """
    Generate an estimate PDF by overlaying data on the template.

    The template's static content (header, address, terms & conditions) is preserved.
    Only the sample DATA text is redacted and replaced with actual form data.
    Grid lines and table structure are preserved.
    """
    template_path = os.path.join(os.path.dirname(__file__), "templates", "estimate_template.pdf")

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    doc = fitz.open(template_path)
    page = doc[0]

    # ==========================================================================
    # REDACT ONLY THE TEXT CONTENT (NOT THE GRID LINES)
    # ==========================================================================
    # We search for specific sample text and redact only those text instances.
    # This preserves the table grid lines and structure.
    #
    # Key: We use text search to find exact text positions, then redact with
    # a fill color that matches the background (white for table cells,
    # beige/yellow for the header row).

    # Sample data text to redact from the template
    # These are the exact placeholder values in the template
    sample_texts_to_redact = [
        # Item name placeholder in the beige header
        "item name with gold kt",
        # Sample data in table rows
        "DIAMOND",
        "SEMI PRECIOUS COLOUR STONE",
        "18K GOLD",
        "CRAFTSMANSHIP FEE",
        # Shape values
        "RD",
        "EM",
        # Colour/Clarity values
        "F - G",
        "VVS",
        # PC values
        "234",
        "21",
        # Weight values
        "14.52",
        "21.93",
        "18.92",
        # Unit values (be careful - only in data rows)
        # Rate values
        "₹48,000.00",
        "₹12,000.00",
        "₹7,950.00",
        # Amount values
        "696,960.00",
        "263,160.00",
        "150,414.00",
        "28,950.00",
        # Totals values
        "1,139,484.00",
        "34,184.52",
        "1,173,668.52",
    ]

    # Beige/yellow color for the header row (RGB normalized to 0-1)
    # The template header appears to be a light beige/cream color
    BEIGE_COLOR = (0.98, 0.95, 0.85)  # Light beige/cream
    WHITE_COLOR = (1, 1, 1)  # White for table cells

    for sample_text in sample_texts_to_redact:
        text_instances = page.search_for(sample_text)
        for inst in text_instances:
            y_pos = inst.y0

            # Determine fill color based on position
            # Item name row (beige header) is around Y=220-248
            if 220 <= y_pos <= 248:
                fill_color = BEIGE_COLOR
            else:
                fill_color = WHITE_COLOR

            # Only redact if in the data area (not in static areas like address)
            # Data area: Y > 200 (below header info)
            # Exclude Terms & Conditions area: Y < 550
            if 200 < y_pos < 550:
                page.add_redact_annot(inst, fill=fill_color)

    # Also redact the CT and GM unit values in data rows (need to be careful)
    for unit_text in ["CT", "GM"]:
        text_instances = page.search_for(unit_text)
        for inst in text_instances:
            y_pos = inst.y0
            x_pos = inst.x0
            # Only redact if in the UNIT column area (X around 820-830) and data rows
            if 265 < y_pos < 460 and 815 < x_pos < 835:
                page.add_redact_annot(inst, fill=WHITE_COLOR)

    # Redact standalone rupee symbols in the AMOUNT column (X around 960-970)
    # These appear separately from the amount values in the template
    rupee_instances = page.search_for("₹")
    for inst in rupee_instances:
        y_pos = inst.y0
        x_pos = inst.x0
        # Only redact if in the AMOUNT column area and data/totals rows
        if 265 < y_pos < 520 and 960 < x_pos < 980:
            page.add_redact_annot(inst, fill=WHITE_COLOR)

    # Apply all redactions
    page.apply_redactions()

    # ==========================================================================
    # FILTER LINE ITEMS - only include items with actual data
    # ==========================================================================
    valid_line_items = []
    for item in line_items:
        particulars = str(item.get("particulars", "")).strip()
        amount = item.get("amount", 0)
        weight = item.get("weight", 0)
        rate = item.get("rate", 0)

        has_data = (
            (amount and float(amount or 0) != 0)
            or (weight and float(weight or 0) != 0)
            or (rate and float(rate or 0) != 0)
        )

        if particulars and has_data:
            valid_line_items.append(item)

    # ==========================================================================
    # DRAW ITEM NAME (in the beige header bar - replacing placeholder)
    # ==========================================================================
    if item_name:
        # Display item name
        item_display = item_name.upper()
        # Add size details if provided
        if size_details:
            item_display += f" - {size_details.upper()}"

        draw_text(
            page,
            ITEM_NAME_X,
            ITEM_NAME_Y,
            item_display,
            fontsize=FONT_SIZE_HEADER,
            fontname=FONT_NAME,
            align="center",
        )

    # ==========================================================================
    # DRAW LINE ITEMS (table rows)
    # ==========================================================================
    for row_idx, item in enumerate(valid_line_items):
        if row_idx >= MAX_ROWS_PER_PAGE:
            break

        y = ROW_START_Y + (row_idx * ROW_HEIGHT)

        # PARTICULARS - left aligned
        particulars = str(item.get("particulars", "")).strip()
        if particulars:
            draw_text(page, COLUMN_X["particulars"], y, particulars, align="left")

        # SHAPE - center aligned
        shape = str(item.get("shape", "")).strip()
        if shape:
            draw_text(page, COLUMN_X["shape"], y, shape, align="center")

        # COLOUR - center aligned
        colour = str(item.get("colour", "")).strip()
        if colour:
            draw_text(page, COLUMN_X["colour"], y, colour, align="center")

        # CLARITY - center aligned
        clarity = str(item.get("clarity", "")).strip()
        if clarity:
            draw_text(page, COLUMN_X["clarity"], y, clarity, align="center")

        # PC - center aligned
        pc_val = item.get("pc")
        if pc_val is not None and pc_val != "" and int(pc_val or 0) != 0:
            draw_text(page, COLUMN_X["pc"], y, str(int(pc_val)), align="center")

        # WEIGHT - right aligned
        weight_val = item.get("weight")
        if weight_val is not None and weight_val != "" and float(weight_val or 0) != 0:
            draw_text(page, COLUMN_X["weight"], y, format_decimal(weight_val, 2), align="right")

        # UNIT - center aligned
        unit = str(item.get("unit", "")).strip()
        if unit:
            draw_text(page, COLUMN_X["unit"], y, unit, align="center")

        # RATE - right aligned with currency
        rate_val = item.get("rate")
        if rate_val is not None and rate_val != "" and float(rate_val or 0) != 0:
            draw_text(page, COLUMN_X["rate"], y, format_currency_inr(rate_val), align="right")

        # AMOUNT - right aligned with currency
        amount_val = item.get("amount", 0)
        if amount_val is not None and float(amount_val or 0) != 0:
            draw_text(page, COLUMN_X["amount"], y, format_currency_inr(amount_val), align="right")

    # ==========================================================================
    # DRAW TOTALS
    # ==========================================================================
    taxable_value = totals.get("taxable_value", 0)
    gst = totals.get("gst", 0)
    discount = totals.get("discount", 0)
    grand_total = totals.get("grand_total", 0)

    if taxable_value:
        draw_text(
            page,
            TOTALS_VALUE_X,
            TOTAL_TAXABLE_Y,
            format_currency_inr(taxable_value),
            fontsize=FONT_SIZE_TOTALS,
            align="right",
        )

    if gst:
        draw_text(
            page,
            TOTALS_VALUE_X,
            GST_Y,
            format_currency_inr(gst),
            fontsize=FONT_SIZE_TOTALS,
            align="right",
        )

    # Draw discount if present (shown as negative/deduction)
    if discount and float(discount) > 0:
        draw_text(
            page,
            TOTALS_VALUE_X,
            DISCOUNT_Y,
            f"-{format_currency_inr(discount)}",
            fontsize=FONT_SIZE_TOTALS,
            align="right",
        )

    if grand_total:
        draw_text(
            page,
            TOTALS_VALUE_X,
            GRAND_TOTAL_Y,
            format_currency_inr(grand_total),
            fontsize=FONT_SIZE_TOTALS,
            align="right",
        )

    # ==========================================================================
    # INSERT PRODUCT IMAGE
    # ==========================================================================
    if image_data:
        try:
            img_rect = fitz.Rect(
                IMAGE_RECT["left"], IMAGE_RECT["top"], IMAGE_RECT["right"], IMAGE_RECT["bottom"]
            )
            page.insert_image(img_rect, stream=image_data)
        except Exception as e:
            print(f"Warning: Could not insert image: {e}")

    # Save to bytes
    output = io.BytesIO()
    doc.save(output)
    doc.close()

    return output.getvalue()


# =============================================================================
# COORDINATE CALIBRATION HELPER
# =============================================================================


def generate_calibration_pdf() -> bytes:
    """Generate a calibration PDF with grid lines and coordinate markers."""
    template_path = os.path.join(os.path.dirname(__file__), "templates", "estimate_template.pdf")

    doc = fitz.open(template_path)
    page = doc[0]

    rect = page.rect
    actual_width = rect.width
    actual_height = rect.height

    page.insert_text(
        (10, 15),
        f"Page: {actual_width:.0f} x {actual_height:.0f} pts | Calibration Grid",
        fontsize=8,
        color=(0, 0, 0),
    )

    for col_name, x in COLUMN_X.items():
        page.draw_line((x, 0), (x, actual_height), color=(1, 0, 0), width=0.5)
        page.insert_text((x + 2, 25), f"{col_name}:{x}", fontsize=5, color=(1, 0, 0))

    for row in range(MAX_ROWS_PER_PAGE + 2):
        y = ROW_START_Y + (row * ROW_HEIGHT)
        page.draw_line((0, y), (actual_width, y), color=(0, 0, 1), width=0.3)
        page.insert_text((5, y + 3), f"Row{row} Y={y:.0f}", fontsize=5, color=(0, 0, 1))

    for label, y in [("TAXABLE", TOTAL_TAXABLE_Y), ("GST", GST_Y), ("GRAND", GRAND_TOTAL_Y)]:
        page.draw_line((0, y), (actual_width, y), color=(0, 0.7, 0), width=0.5)
        page.insert_text((5, y + 3), f"{label} Y={y:.0f}", fontsize=5, color=(0, 0.7, 0))

    page.draw_line((0, ITEM_NAME_Y), (actual_width, ITEM_NAME_Y), color=(1, 0.5, 0), width=0.5)
    page.draw_line((ITEM_NAME_X, 0), (ITEM_NAME_X, actual_height), color=(1, 0.5, 0), width=0.5)

    img_rect = fitz.Rect(
        IMAGE_RECT["left"], IMAGE_RECT["top"], IMAGE_RECT["right"], IMAGE_RECT["bottom"]
    )
    page.draw_rect(img_rect, color=(0.5, 0, 0.5), width=1)

    for x in range(0, int(actual_width), 50):
        page.draw_line((x, 0), (x, actual_height), color=(0.85, 0.85, 0.85), width=0.2)
        page.insert_text((x + 1, 10), str(x), fontsize=4, color=(0.6, 0.6, 0.6))

    for y in range(0, int(actual_height), 50):
        page.draw_line((0, y), (actual_width, y), color=(0.85, 0.85, 0.85), width=0.2)
        page.insert_text((2, y + 4), str(y), fontsize=4, color=(0.6, 0.6, 0.6))

    output = io.BytesIO()
    doc.save(output)
    doc.close()

    return output.getvalue()
