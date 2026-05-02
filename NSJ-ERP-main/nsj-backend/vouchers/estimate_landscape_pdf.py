"""
Estimate Landscape PDF Generator using PyMuPDF (fitz)

This module generates pixel-perfect landscape estimate PDFs by overlaying dynamic text
on top of the official Nitishah Jewels landscape template PDF.

The template uses Figtree font family. We use Century Gothic as a close visual match
since it's a standard Windows font that's always available.

Font matching:
- Template: Figtree-Bold @ 11pt for headers, Figtree-Regular @ 7.5pt for data
- Output: Century Gothic Bold @ 11pt for headers, Century Gothic @ 7.5pt for data
- Color: RGB(87, 14, 19) = #570E13 (dark maroon)
"""

import io
import os
import platform
import logging
from decimal import Decimal
from typing import List, Dict, Any, Optional, Union

import fitz  # PyMuPDF

# Set up logging
logger = logging.getLogger(__name__)


# =============================================================================
# PATHS AND FONT CONFIGURATION
# =============================================================================

MODULE_DIR = os.path.dirname(__file__)
TEMPLATE_PATH = os.path.join(MODULE_DIR, "templates", "Jewellery Estimate-Landscape.pdf")

# Font paths - Arial (for full Unicode and rupee symbol support, ensuring exactly one font family is used)
FONT_REGULAR_PATH = None
FONT_BOLD_PATH = None

if platform.system() == "Windows":
    _arial = "C:/Windows/Fonts/arial.ttf"
    _arial_bold = "C:/Windows/Fonts/arialbd.ttf"
    if os.path.exists(_arial):
        FONT_REGULAR_PATH = _arial
    if os.path.exists(_arial_bold):
        FONT_BOLD_PATH = _arial_bold
elif platform.system() == "Darwin":
    for path in [
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]:
        if os.path.exists(path):
            FONT_REGULAR_PATH = path
            break
    for path in [
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]:
        if os.path.exists(path):
            FONT_BOLD_PATH = path
            break
elif platform.system() == "Linux":
    for path in [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        if os.path.exists(path):
            FONT_REGULAR_PATH = path
            break
    for path in [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]:
        if os.path.exists(path):
            FONT_BOLD_PATH = path
            break

# Font for rupee symbol and Unicode support
# Use the same font as regular text on Linux since Liberation Sans supports Unicode
UNICODE_FONT_PATH = None
if platform.system() == "Windows":
    _arial = "C:/Windows/Fonts/arial.ttf"
    if os.path.exists(_arial):
        UNICODE_FONT_PATH = _arial
elif platform.system() == "Darwin":
    _arial = "/Library/Fonts/Arial.ttf"
    if os.path.exists(_arial):
        UNICODE_FONT_PATH = _arial
elif platform.system() == "Linux":
    # On Linux, use Noto Sans, Liberation Sans or DejaVu Sans for Unicode
    # These fonts have excellent Unicode coverage including rupee symbol
    for _path in [
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]:
        if os.path.exists(_path):
            UNICODE_FONT_PATH = _path
            break

# Log font paths for debugging
logger.info(f"Platform: {platform.system()}")
logger.info(f"FONT_REGULAR_PATH: {FONT_REGULAR_PATH}")
logger.info(f"FONT_BOLD_PATH: {FONT_BOLD_PATH}")
logger.info(f"UNICODE_FONT_PATH: {UNICODE_FONT_PATH}")

FONT_REGULAR_NAME = "arial"
FONT_BOLD_NAME = "arial-bold"
FALLBACK_FONT = "helv"

# =============================================================================
# COORDINATE MAPPING (from template analysis)
# =============================================================================

PAGE_WIDTH = 841.89
PAGE_HEIGHT = 595.28

# Item name position - centered in the beige header bar (TAG ID area)
ITEM_NAME_X = 492.7
ITEM_NAME_Y = 236.9

# Image position
IMAGE_RECT = {"left": 30, "top": 265, "right": 140, "bottom": 350}

# Table column X positions - CENTER-ALIGNED COORDINATES
COLUMN_X = {
    "particulars": 227.55,  # Center of PARTICULARS (X range: 158.2 to 296.9)
    "shape": 325.15,       # Center of SHAPE (X range: 296.9 to 353.4)
    "colour": 381.6,       # Center of COLOUR (X range: 353.4 to 409.8)
    "clarity": 450.65,     # Center of CLARITY (X range: 409.8 to 491.5)
    "pc": 507.65,          # Center of PCS (X range: 491.5 to 523.8)
    "weight_ct": 552.05,   # Center of CARATS (X range: 523.8 to 580.3)
    "weight_gm": 611.35,   # Center of GRAMS (X range: 580.3 to 642.4)
    "rate": 686.95,        # Center of RATE (X range: 642.4 to 731.5)
    "amount": 779.35,      # Center of AMOUNT (X range: 731.5 to 827.2)
}

# Row positions
ROW_START_Y = 278.3
ROW_HEIGHT = 19.9
MAX_ROWS_PER_PAGE = 3

# Totals section positions (RIGHT SIDE) - MATCH AMOUNT COLUMN ALIGNMENT
TOTALS_LABEL_X = 717.6  # Label position
TOTALS_VALUE_X = 779.35  # Centered in the AMOUNT column (X range: 731.5 to 827.2)

# Totals Y positions - true vertical center of each row box (with ~3pt baseline offset)
# TOTAL TAXABLE row box: Y 401.8 to 421.7 → center = 411.75 + 3 = 414.8
# GST row box: Y 421.7 to 441.5 → center = 431.6 + 3 = 434.6
# GRAND TOTAL row box: Y 441.5 to 460.9 → center = 451.2 + 3 = 454.2
TOTAL_TAXABLE_Y = 414.8  # Vertically centered in row box
GST_Y = 434.6  # Vertically centered in row box
GRAND_TOTAL_Y = 454.2  # Vertically centered in row box
GRAND_TOTAL_Y_WITH_DISCOUNT = 454.2  # Same position - discount is on left side now

# DISCOUNT position (LEFT SIDE - BELOW the table, aligned with totals area)
DISCOUNT_LEFT_LABEL_X = 162.1  # Left side X position
DISCOUNT_LEFT_VALUE_X = 290.0  # Value position on left side (more space for value)
DISCOUNT_LEFT_Y = 420.0  # Y position - below table, in the totals area

# =============================================================================
# STYLE SETTINGS
# =============================================================================

FONT_SIZE_HEADER = 11.0
FONT_SIZE_DATA = 7.5
FONT_SIZE_TOTALS = 8.5  # Increased from 7.5 for better readability
FONT_SIZE_GRAND_TOTAL = 10.0  # Larger font for GRAND TOTAL

# Template text color: RGB(87, 14, 19) = #570E13
COLOR_TEMPLATE = (87 / 255, 14 / 255, 19 / 255)

# Lighter color for TAG ID (item name) to match account boxes - RGB(120, 50, 60)
COLOR_TAG_ID = (120 / 255, 50 / 255, 60 / 255)

# Background colors
COLOR_WHITE = (1, 1, 1)
COLOR_BEIGE = (254 / 255, 242 / 255, 229 / 255)

# =============================================================================
# CUSTOMER DETAILS POSITIONS (Top-left area of PDF)
# =============================================================================

# Customer details are in a table at the top-left of the estimate
# The template has labels in beige boxes on the left, and value boxes on the right
# PDF coordinate system: origin at bottom-left, Y increases upward
# Page dimensions: 841.89 x 595.28 points (landscape A4)

# Actual measured coordinates from template analysis:
# MAIN ACCOUNT label: x0=18.7, y0=131.9, x1=79.3, y1=140.9
# SUB ACCOUNT label: x0=18.7, y0=154.5, x1=74.2, y1=163.5
# PHONE label: x0=18.7, y0=177.2, x1=47.0, y1=186.2
# SALES REP. NAME label: x0=18.7, y0=199.9, x1=84.5, y1=208.9

# X position: Start of white value box (after the beige label box ends)
# Left side white boxes: labels end around X=85-95, white boxes are from ~100 to ~220
# Right side white boxes: labels end around X=270-280, white boxes are from ~285 to ~460
CUSTOMER_DETAILS_X = (
    164.1  # X position centered in Left value box (X range: 105.2 to 223.0)
)

# Y positions: Use the middle of each label box for text baseline
# Text baseline = (y0 + y1) / 2
MAIN_ACCOUNT_Y = 136.4  # Middle of MAIN ACCOUNT box (131.9 + 140.9) / 2
SUB_ACCOUNT_Y = 159.0  # Middle of SUB ACCOUNT box (154.5 + 163.5) / 2
PHONE_Y = 181.7  # Middle of PHONE box (177.2 + 186.2) / 2
SALES_REP_Y = 204.4  # Middle of SALES REP. NAME box (199.9 + 208.9) / 2

# ITEM NAME and ITEM SIZE positions (right side of customer details area)
# The right-side structure mirrors the left side:
# - ITEM NAME label ends at X=270.1, white box starts immediately after
# - ITEM SIZE label ends at X=264.1, white box starts immediately after
# The white boxes on the right side extend from ~280 to ~430
ITEM_NAME_VALUE_X = 354.3  # X position centered in Right value box (X range: 297.6 to 411.0)
ITEM_NAME_VALUE_Y = 136.4  # Same Y as MAIN ACCOUNT

ITEM_SIZE_VALUE_X = 354.3  # X position centered in Right value box (X range: 297.6 to 411.0)
ITEM_SIZE_VALUE_Y = 159.0  # Same Y as SUB ACCOUNT

# Gold Quality (KT) field - third row on right side
GOLD_QUALITY_VALUE_X = 354.3  # X position centered in Right value box (X range: 297.6 to 411.0)
GOLD_QUALITY_VALUE_Y = 181.7  # Same Y as PHONE (third row)

# Date fields - right side of page (company info section)
# Template label positions (measured):
# DATE OF ESTIMATE: label starts 564.9, ends 645.0, baseline Y ~189.4
# EXPIRY DATE OF ESTIMATE: label starts 564.9, ends 676.4, baseline Y ~202.4
# Values must start immediately after label ends to avoid overlap
DATE_VALUE_X = 648.0  # Right after "DATE OF ESTIMATE:" ends at ~645
EXPIRY_VALUE_X = 679.0  # Right after "EXPIRY DATE OF ESTIMATE:" ends at ~676
DATE_OF_ESTIMATE_Y = 192.0  # Slightly below label baseline
EXPIRY_DATE_Y = 205.0  # Slightly below label baseline

# =============================================================================
# TEXT POSITIONS TO REDACT (remove from template)
# =============================================================================

# Texts to search and remove (will be replaced with form data)
TEXTS_TO_SEARCH_AND_REMOVE = [
    "18K GOLD PENDANT + EARRING",  # Item name placeholder
    "DIAMOND",  # Sample line item 1
    "COLOUR STONE",  # Sample line item 2
    "GROSS WEIGHT",  # Unwanted label
    "GOLD NET WEIGHT",  # Unwanted label
    "MAKING CHARGES",  # Unwanted label
    "PARTICULARS",  # Column header - will be redrawn centered
]

# Rectangles to redact with specific background colors (for areas without searchable text)
RECTS_TO_REDACT = {
    # Sample line items in table (white background)
    "diamond": {"rect": (162.1, 269.3, 197.5, 278.3), "bg": COLOR_WHITE},
    "colour_stone": {"rect": (162.1, 289.2, 219.6, 298.2), "bg": COLOR_WHITE},
    # Labels to remove
    "gross_weight": {"rect": (162.1, 348.7, 218.5, 357.7), "bg": COLOR_WHITE},
    "gold_net_weight": {"rect": (162.1, 368.5, 229.9, 377.5), "bg": COLOR_WHITE},
    "making_charges": {"rect": (162.1, 388.4, 229.1, 397.4), "bg": COLOR_WHITE},
    # Clear original PARTICULARS header area (left-aligned) so we can redraw centered
    "particulars_header": {"rect": (158.2, 256.0, 296.9, 266.0), "bg": None},
}


# =============================================================================
# FORMATTING HELPERS
# =============================================================================


def format_currency_inr(
    value: Union[float, Decimal, int, None], include_symbol: bool = True
) -> str:
    """Format number as Indian Rupee with proper numbering system."""
    if value is None:
        return ""
    try:
        num = float(value)
    except (ValueError, TypeError):
        return str(value)

    is_negative = num < 0
    num = abs(num)

    formatted = f"{num:,.2f}"
    parts = formatted.split(".")
    integer_part = parts[0].replace(",", "")
    decimal_part = parts[1] if len(parts) > 1 else "00"

    # Indian numbering (lakhs, crores)
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
        result = "\u20b9" + result
    return result


def format_currency_smart(
    value: Union[float, Decimal, int, None], include_symbol: bool = True
) -> str:
    """Smart currency formatting that adjusts for large amounts."""
    if value is None:
        return ""

    try:
        num = float(value)
    except (ValueError, TypeError):
        return str(value)

    # For very large amounts (>= 10 lakhs), use compact format
    if abs(num) >= 1000000:  # >= 10 lakhs
        if abs(num) >= 10000000:  # >= 1 crore
            crores = num / 10000000
            result = f"{crores:.1f}Cr"
        else:  # lakhs
            lakhs = num / 100000
            result = f"{lakhs:.1f}L"

        if include_symbol:
            result = "\u20b9" + result
        return result

    # For smaller amounts, use regular formatting
    return format_currency_inr(value, include_symbol)


def get_amount_font_size(value: Union[float, Decimal, int, None]) -> float:
    """Get appropriate font size based on amount value."""
    if value is None:
        return FONT_SIZE_DATA

    try:
        num = abs(float(value))
    except (ValueError, TypeError):
        return FONT_SIZE_DATA

    # Adjust font size based on amount magnitude
    if num >= 10000000:  # >= 1 crore - use smaller font
        return FONT_SIZE_DATA - 1.0  # 6.5pt
    elif num >= 1000000:  # >= 10 lakhs - slightly smaller
        return FONT_SIZE_DATA - 0.5  # 7.0pt
    else:
        return FONT_SIZE_DATA  # 7.5pt


def format_decimal(value: Union[float, Decimal, int, None], decimals: int = 2) -> str:
    """Format number with specified decimal places."""
    if value is None:
        return ""
    try:
        return f"{float(value):.{decimals}f}"
    except (ValueError, TypeError):
        return str(value)


# =============================================================================
# TEXT DRAWING
# =============================================================================


def wrap_text(text: str, font_path: Optional[str], fontsize: float, max_width: float) -> List[str]:
    """Wrap text into multiple lines so that each line is at most max_width wide."""
    if not text:
        return []
    words = text.split()
    if not words:
        return []
    
    lines = []
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word])
        # Use fitz.get_text_length with Helvetica as standard approximation
        try:
            width = fitz.get_text_length(test_line, fontname="helv", fontsize=fontsize)
        except Exception:
            width = len(test_line) * (fontsize * 0.53)
            
        if width <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
                
    if current_line:
        lines.append(" ".join(current_line))
        
    return lines


def draw_text(
    page: fitz.Page,
    x: float,
    y: float,
    text: str,
    fontsize: float,
    bold: bool = False,
    color: tuple = COLOR_TEMPLATE,
    align: str = "left",
) -> None:
    """Draw text using a single font family (Arial) to ensure visual consistency."""
    if not text:
        return

    text = str(text)

    font_path = FONT_BOLD_PATH if bold else FONT_REGULAR_PATH
    font_name = FONT_BOLD_NAME if bold else FONT_REGULAR_NAME

    # Average character width approximation for centering calculation
    # Arial characters have average width ~0.53 of font size
    avg_char_width = fontsize * 0.53

    # Calculate text width for alignment
    if font_path and os.path.exists(font_path):
        text_width = len(text) * avg_char_width
    else:
        text_width = fitz.get_text_length(text, fontname=FALLBACK_FONT, fontsize=fontsize)

    # Apply alignment
    if align == "right":
        actual_x = x - text_width
    elif align == "center":
        actual_x = x - (text_width / 2)
    else:
        actual_x = x

    # Insert text - use the font if available, otherwise use fallback
    if font_path and os.path.exists(font_path):
        try:
            page.insert_text(
                point=(actual_x, y),
                text=text,
                fontsize=fontsize,
                fontname=font_name,
                fontfile=font_path,
                color=color,
                render_mode=0,  # Fill
            )
        except Exception as e:
            logger.error(f"Failed to insert text with custom font: {e}")
            # Fallback to Helvetica
            page.insert_text(
                point=(actual_x, y),
                text=text,
                fontsize=fontsize,
                fontname=FALLBACK_FONT,
                color=color,
            )
    else:
        # Fallback to Helvetica (built-in font)
        page.insert_text(
            point=(actual_x, y),
            text=text,
            fontsize=fontsize,
            fontname=FALLBACK_FONT,
            color=color,
        )


# =============================================================================
# MAIN PDF GENERATION
# =============================================================================


def generate_estimate_landscape_pdf(
    item_name: str,
    line_items: List[Dict[str, Any]],
    totals: Dict[str, float],
    image_data: Optional[bytes] = None,
    customer_details: Optional[Dict[str, str]] = None,
    jewellery_details: Optional[Dict[str, str]] = None,
    estimate_details: Optional[Dict[str, str]] = None,
) -> bytes:
    """
    Generate landscape estimate PDF by overlaying data on template.

    Args:
        item_name: Name of the jewelry item
        line_items: List of line item dictionaries
        totals: Dictionary with taxable_value, gst, discount, grand_total
        image_data: Optional image bytes to embed
        customer_details: Optional dict with main_account, sub_account, phone, sales_person_name
        jewellery_details: Optional dict with jewellery_type, size_details, gold_quality
        estimate_details: Optional dict with date, expiry_date

    Changes from template:
    - Removes sample text (18K GOLD PENDANT, DIAMOND, COLOUR STONE)
    - Removes GROSS WEIGHT, GOLD NET WEIGHT, MAKING CHARGES labels
    - Adds DISCOUNT row with percentage and amount
    - Writes item name directly on beige header (no white overlay)
    - Adds customer details (main account, sub account, phone, sales rep name)
    - Adds jewellery details (jewellery type, size details)
    - Adds estimate details (date, expiry_date)
    """
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    doc = fitz.open(TEMPLATE_PATH)
    page = doc[0]

    # =========================================================================
    # STEP 1: REMOVE TEMPLATE TEXT
    # =========================================================================
    # For item name: search for exact text and redact with no fill (transparent)
    # This removes the text without creating a visible rectangle

    # Search and remove the item name placeholder text
    item_name_instances = page.search_for("18K GOLD PENDANT + EARRING")
    for inst in item_name_instances:
        # Use redaction with no fill - just removes the text
        page.add_redact_annot(inst, text="", fill=False)

    # Search and remove other template texts
    for text_to_remove in [
        "DIAMOND",
        "COLOUR STONE",
        "GROSS WEIGHT",
        "GOLD NET WEIGHT",
        "MAKING CHARGES",
        "PARTICULARS",
    ]:
        instances = page.search_for(text_to_remove)
        for inst in instances:
            # Check Y position to only remove from specific areas
            y_pos = inst.y0
            # DIAMOND and COLOUR STONE are in table rows (Y 265-320)
            # GROSS WEIGHT, GOLD NET WEIGHT, MAKING CHARGES are in totals area (Y 345-400)
            # PARTICULARS is the column header (around Y 260)
            if (265 < y_pos < 320) or (345 < y_pos < 400) or (250 < y_pos < 270):
                if text_to_remove == "PARTICULARS":
                    page.add_redact_annot(inst, text="", fill=False)
                else:
                    page.add_redact_annot(inst, text="", fill=COLOR_WHITE)

    # Apply rectangle redactions for areas without searchable text
    for name, config in RECTS_TO_REDACT.items():
        rect = fitz.Rect(config["rect"])
        page.add_redact_annot(rect, text="", fill=config["bg"])

    # Apply all redactions
    page.apply_redactions()

    # =========================================================================
    # STEP 1.5: REDRAW PARTICULARS HEADER CENTERED
    # =========================================================================
    PARTICULARS_HEADER_Y = 256.6
    draw_text(
        page,
        COLUMN_X["particulars"],
        PARTICULARS_HEADER_Y,
        "PARTICULARS",
        fontsize=FONT_SIZE_DATA,
        bold=True,
        align="center",
    )

    # =========================================================================
    # STEP 2: FILTER VALID LINE ITEMS
    # =========================================================================
    valid_items = []
    for item in line_items:
        particulars = str(item.get("particulars", "")).strip()
        has_data = (
            (item.get("amount") and float(item.get("amount") or 0) != 0)
            or (item.get("weight") and float(item.get("weight") or 0) != 0)
            or (item.get("rate") and float(item.get("rate") or 0) != 0)
        )
        if particulars and has_data:
            valid_items.append(item)

    # =========================================================================
    # STEP 3: DRAW CUSTOMER DETAILS AND JEWELLERY INFO (top-left table)
    # =========================================================================
    if customer_details:
        # Main Account
        if customer_details.get("main_account"):
            draw_text(
                page,
                CUSTOMER_DETAILS_X,
                MAIN_ACCOUNT_Y,
                str(customer_details["main_account"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

        # Sub Account
        if customer_details.get("sub_account"):
            draw_text(
                page,
                CUSTOMER_DETAILS_X,
                SUB_ACCOUNT_Y,
                str(customer_details["sub_account"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

        # Phone
        if customer_details.get("phone"):
            draw_text(
                page,
                CUSTOMER_DETAILS_X,
                PHONE_Y,
                str(customer_details["phone"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

        # Sales Rep Name - use nsj_representative if available, otherwise fall back to sales_person_name
        sales_rep = (
            customer_details.get("nsj_representative")
            or customer_details.get("sales_person_name")
            or ""
        )
        if sales_rep:
            draw_text(
                page,
                CUSTOMER_DETAILS_X,
                SALES_REP_Y,
                str(sales_rep).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

    # Draw jewellery details in the right side of customer details table
    if jewellery_details:
        # Item Name (jewellery type) in the ITEM NAME field
        if jewellery_details.get("jewellery_type"):
            draw_text(
                page,
                ITEM_NAME_VALUE_X,
                ITEM_NAME_VALUE_Y,
                str(jewellery_details["jewellery_type"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

        # Size Details in the ITEM SIZE field
        if jewellery_details.get("size_details"):
            draw_text(
                page,
                ITEM_SIZE_VALUE_X,
                ITEM_SIZE_VALUE_Y,
                str(jewellery_details["size_details"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

        # Gold Quality (KT) in the GOLD QUALITY field
        if jewellery_details.get("gold_quality"):
            draw_text(
                page,
                GOLD_QUALITY_VALUE_X,
                GOLD_QUALITY_VALUE_Y,
                str(jewellery_details["gold_quality"]).strip(),
                fontsize=FONT_SIZE_DATA,
                align="center",
            )

    # =========================================================================
    # STEP 3.5: DRAW ESTIMATE DETAILS (date, expiry_date)
    # =========================================================================
    print(f"[PDF GEN] estimate_details: {estimate_details}")
    if estimate_details:
        # Date of Estimate
        date_value = estimate_details.get("date", "")
        if date_value:
            draw_text(
                page,
                DATE_VALUE_X,
                DATE_OF_ESTIMATE_Y,
                str(date_value).strip(),
                fontsize=FONT_SIZE_DATA,
                align="left",
            )

        # Expiry Date of Estimate
        expiry_value = estimate_details.get("expiry_date", "")
        if expiry_value:
            draw_text(
                page,
                EXPIRY_VALUE_X,
                EXPIRY_DATE_Y,
                str(expiry_value).strip(),
                fontsize=FONT_SIZE_DATA,
                align="left",
            )

    # =========================================================================
    # STEP 4: DRAW MAIN ITEM NAME (bold, centered on beige header - TAG ID area)
    # =========================================================================
    if item_name:
        draw_text(
            page,
            ITEM_NAME_X,
            ITEM_NAME_Y,
            item_name.upper(),
            fontsize=FONT_SIZE_HEADER,
            bold=True,
            color=COLOR_TAG_ID,
            align="center",
        )

    # =========================================================================
    # STEP 5: DRAW LINE ITEMS
    # =========================================================================
    for idx, item in enumerate(valid_items[:MAX_ROWS_PER_PAGE]):
        y = ROW_START_Y + (idx * ROW_HEIGHT)

        # Particulars (centered with text wrapping)
        if item.get("particulars"):
            particulars_text = str(item["particulars"]).strip()
            # Wrap text to fit particulars column width (X starts at 158.2, ends at 296.9)
            lines = wrap_text(particulars_text, FONT_REGULAR_PATH, FONT_SIZE_DATA, max_width=125)
            if len(lines) == 1:
                draw_text(
                    page,
                    COLUMN_X["particulars"],
                    y,
                    lines[0],
                    FONT_SIZE_DATA,
                    align="center",
                )
            elif len(lines) >= 2:
                # Center vertically and horizontally by drawing two lines offset from middle
                line1 = lines[0]
                line2 = lines[1]
                if len(lines) > 2:
                    line2 = line2[:20] + "..."
                draw_text(
                    page,
                    COLUMN_X["particulars"],
                    y - 3.8,
                    line1,
                    FONT_SIZE_DATA,
                    align="center",
                )
                draw_text(
                    page,
                    COLUMN_X["particulars"],
                    y + 4.2,
                    line2,
                    FONT_SIZE_DATA,
                    align="center",
                )

        # Shape (center)
        if item.get("shape"):
            draw_text(
                page,
                COLUMN_X["shape"],
                y,
                str(item["shape"]).strip(),
                FONT_SIZE_DATA,
                align="center",
            )

        # Colour (center)
        if item.get("colour"):
            draw_text(
                page,
                COLUMN_X["colour"],
                y,
                str(item["colour"]).strip(),
                FONT_SIZE_DATA,
                align="center",
            )

        # Clarity (center)
        if item.get("clarity"):
            draw_text(
                page,
                COLUMN_X["clarity"],
                y,
                str(item["clarity"]).strip(),
                FONT_SIZE_DATA,
                align="center",
            )

        # PCS (center)
        pc = item.get("pc")
        if pc is not None and pc != "" and int(pc or 0) != 0:
            draw_text(page, COLUMN_X["pc"], y, str(int(pc)), FONT_SIZE_DATA, align="center")

        # Weight (in appropriate column)
        weight = item.get("weight")
        unit = str(item.get("unit", "")).strip().upper()
        if weight is not None and weight != "" and float(weight or 0) != 0:
            col = COLUMN_X["weight_ct"] if unit == "CT" else COLUMN_X["weight_gm"]
            draw_text(page, col, y, format_decimal(weight, 3), FONT_SIZE_DATA, align="center")

        # Rate (centered, with currency)
        rate = item.get("rate")
        if rate is not None and rate != "" and float(rate or 0) != 0:
            draw_text(
                page, COLUMN_X["rate"], y, format_currency_inr(rate), FONT_SIZE_DATA, align="center"
            )

        # Amount (centered, with currency)
        amount = item.get("amount", 0)
        if amount is not None and float(amount or 0) != 0:
            draw_text(
                page,
                COLUMN_X["amount"],
                y,
                format_currency_inr(amount),
                FONT_SIZE_DATA,
                align="center",
            )

    # =========================================================================
    # STEP 5: DRAW TOTALS (DISCOUNT on LEFT, others on RIGHT)
    # =========================================================================

    # Check if we have a discount to show
    discount = totals.get("discount", 0)
    discount_percent = totals.get("discount_percent", 0)
    has_discount = discount and float(discount) > 0

    # DISCOUNT (LEFT SIDE - where GROSS WEIGHT etc. used to be)
    if has_discount:
        # Draw discount label with percentage (BOLD)
        if discount_percent and float(discount_percent) > 0:
            discount_label = f"DISCOUNT @ {discount_percent:.0f}%"
        else:
            discount_label = "DISCOUNT"

        # Draw label on LEFT side (left-aligned, BOLD)
        draw_text(
            page,
            DISCOUNT_LEFT_LABEL_X,
            DISCOUNT_LEFT_Y,
            discount_label,
            FONT_SIZE_TOTALS,
            bold=True,
            align="left",
        )

        # Draw discount value on LEFT side (negative amount) - FIXED ALIGNMENT ONLY
        draw_text(
            page,
            DISCOUNT_LEFT_VALUE_X,
            DISCOUNT_LEFT_Y,
            f"-{format_currency_inr(discount)}",
            FONT_SIZE_TOTALS,
            align="left",
        )

    # TOTAL TAXABLE VALUE (right side) - FIXED ALIGNMENT ONLY
    if totals.get("taxable_value"):
        draw_text(
            page,
            TOTALS_VALUE_X,
            TOTAL_TAXABLE_Y,
            format_currency_inr(totals["taxable_value"]),
            FONT_SIZE_TOTALS,
            align="center",
        )

    # GST @ 3% (right side) - FIXED ALIGNMENT ONLY
    if totals.get("gst"):
        draw_text(
            page,
            TOTALS_VALUE_X,
            GST_Y,
            format_currency_inr(totals["gst"]),
            FONT_SIZE_TOTALS,
            align="center",
        )

    # GRAND TOTAL (right side - LARGER FONT) - FIXED ALIGNMENT ONLY
    if totals.get("grand_total"):
        grand_total_y = GRAND_TOTAL_Y_WITH_DISCOUNT if has_discount else GRAND_TOTAL_Y
        draw_text(
            page,
            TOTALS_VALUE_X,
            grand_total_y,
            format_currency_inr(totals["grand_total"]),
            FONT_SIZE_GRAND_TOTAL,
            bold=True,
            align="center",
        )

    # =========================================================================
    # STEP 6: INSERT IMAGE
    # =========================================================================
    if image_data:
        try:
            rect = fitz.Rect(
                IMAGE_RECT["left"], IMAGE_RECT["top"], IMAGE_RECT["right"], IMAGE_RECT["bottom"]
            )
            page.insert_image(rect, stream=image_data)
        except Exception as e:
            print(f"Warning: Could not insert image: {e}")

    # Save and return
    output = io.BytesIO()
    doc.save(output)
    doc.close()
    return output.getvalue()


# =============================================================================
# CALIBRATION HELPER
# =============================================================================


def generate_calibration_landscape_pdf() -> bytes:
    """Generate calibration PDF with grid overlay."""
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    doc = fitz.open(TEMPLATE_PATH)
    page = doc[0]
    w, h = page.rect.width, page.rect.height

    page.insert_text((10, 15), f"Page: {w:.0f} x {h:.0f} pts", fontsize=8)

    for name, x in COLUMN_X.items():
        page.draw_line((x, 0), (x, h), color=(1, 0, 0), width=0.5)
        page.insert_text((x + 2, 25), f"{name}:{x}", fontsize=5, color=(1, 0, 0))

    for row in range(MAX_ROWS_PER_PAGE + 2):
        y = ROW_START_Y + (row * ROW_HEIGHT)
        page.draw_line((0, y), (w, y), color=(0, 0, 1), width=0.3)
        page.insert_text((5, y + 3), f"Row{row} Y={y:.0f}", fontsize=5, color=(0, 0, 1))

    for label, y in [
        ("TAXABLE", TOTAL_TAXABLE_Y),
        ("GST", GST_Y),
        ("DISCOUNT_LEFT", DISCOUNT_LEFT_Y),
        ("GRAND", GRAND_TOTAL_Y),
    ]:
        page.draw_line((0, y), (w, y), color=(0, 0.7, 0), width=0.5)

    page.draw_line((0, ITEM_NAME_Y), (w, ITEM_NAME_Y), color=(1, 0.5, 0), width=0.5)
    page.draw_line((ITEM_NAME_X, 0), (ITEM_NAME_X, h), color=(1, 0.5, 0), width=0.5)

    output = io.BytesIO()
    doc.save(output)
    doc.close()
    return output.getvalue()
