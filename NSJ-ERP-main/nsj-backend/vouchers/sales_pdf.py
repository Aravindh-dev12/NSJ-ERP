"""
Sales Query PDF Generator using PyMuPDF (fitz)

This module generates pixel-perfect sales query PDFs by overlaying dynamic text
on top of the official Nitishah Jewels template PDF.

Template: Sales Queries.pdf (A4 portrait: 595.276 x 841.89 points)

The template has the following structure:
- Header with company logo and title
- IMPORTANT DATES section (top right area)
- CLIENT DETAILS section
- OCCASION & INTENT section
- JEWELLERY DETAILS section
- DIAMOND/GEMSTONE section
- BUDGET & NOTES section
- ADVANCE HANDLING section
- DEPARTMENT INSTRUCTIONS section

Each field has a LABEL on the left and a BLANK CELL on the right where we overlay text.
"""

import io
import os
import platform
from typing import Dict, Any, List

import fitz  # PyMuPDF

# =============================================================================
# PAGE DIMENSIONS (A4 Portrait)
# =============================================================================
PAGE_WIDTH = 595.276
PAGE_HEIGHT = 841.89

# =============================================================================
# FONT SETTINGS
# =============================================================================
FONT_NAME = "helv"
FONT_SIZE = 8
FONT_SIZE_SMALL = 7
FONT_SIZE_HEADER = 9
COLOR_BLACK = (0, 0, 0)

# Font paths - Century Gothic (matching estimate PDF for consistency)
FONT_REGULAR_PATH = None
FONT_BOLD_PATH = None
ARIAL_FONT_PATH = None  # Fallback for rupee symbol

if platform.system() == "Windows":
    # Century Gothic
    _gothic = "C:/Windows/Fonts/GOTHIC.TTF"
    _gothic_bold = "C:/Windows/Fonts/GOTHICB.TTF"
    if os.path.exists(_gothic):
        FONT_REGULAR_PATH = _gothic
    if os.path.exists(_gothic_bold):
        FONT_BOLD_PATH = _gothic_bold
    # Arial fallback for rupee symbol
    _arial = "C:/Windows/Fonts/arial.ttf"
    if os.path.exists(_arial):
        ARIAL_FONT_PATH = _arial
elif platform.system() == "Darwin":
    # macOS
    for path in [
        "/Library/Fonts/Century Gothic.ttf",
        "/System/Library/Fonts/Supplemental/Century Gothic.ttf",
    ]:
        if os.path.exists(path):
            FONT_REGULAR_PATH = path
            break
elif platform.system() == "Linux":
    # Linux - use Liberation Sans as Century Gothic alternative
    for _path in [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        if os.path.exists(_path):
            FONT_REGULAR_PATH = _path
            ARIAL_FONT_PATH = _path  # Use same for fallback
            break

# =============================================================================
# COORDINATE MAPPING FOR SALES QUERIES PDF TEMPLATE
# =============================================================================
# The template is A4 portrait (595.276 x 841.89 points)
# Origin (0,0) is TOP-LEFT corner
#
# IMPORTANT: These coordinates are calibrated to match the actual PDF template.
# The form has labels on the LEFT and blank value cells on the RIGHT.
# We place text in the VALUE CELLS (after the label text ends).
#
# The PDF template structure (based on "Sales Queries.pdf"):
# - Company header at top
# - Form divided into sections with bordered boxes
# - Each row: LABEL TEXT | BLANK VALUE CELL
# - Two-column layout in some sections

# =============================================================================
# FIELD COORDINATE MAPPINGS
# =============================================================================
# These coordinates place text in the blank cells AFTER each label.
# Format: {"field_name": {"x": X_POSITION, "y": Y_POSITION}}
# X = horizontal position (where value text starts)
# Y = vertical position (baseline of text)

# The PDF has a specific layout - we need to match it exactly.
# Based on actual template analysis:

FIELD_POSITIONS = {
    # =========================================================================
    # IMPORTANT DATES SECTION (Y=69 header)
    # Labels end at X~146, values start at X~150
    # Right column: DATE at X~389-410, ORDER ID at X~501-540
    # =========================================================================
    "sales_person": {"x": 150, "y": 92},  # Y=88, after "SALES PERSON" (ends X=146)
    "vendor": {"x": 150, "y": 110},  # Y=106, after "VENDOR" (ends X=146)
    "delivery_type": {"x": 150, "y": 129},  # Y=125, after "DELIVERY TYPE" (ends X=146)
    "date": {"x": 685, "y": 128},  # Y=124, DATE field (in right box)
    "order_id": {"x": 890, "y": 128},  # Y=124, ORDER ID field (far right box)
    "transfer_dept": {"x": 150, "y": 147},  # Y=143, after "TRANSFER DEPARTMENT" (ends X=146)
    # =========================================================================
    # CLIENT DETAILS SECTION (Y=161 header)
    # Left column: MAIN ACCOUNT, PHONE NUMBER, EMAIL, CITY
    # Right column (RETAIL): SUB AC, PAN/GSTIN/AADHAR, EMAIL ID, DELIVERY TYPE
    # =========================================================================
    "main_account": {"x": 150, "y": 184},  # Y=180, after "MAIN ACCOUNT" (ends X=146)
    "sub_account": {"x": 740, "y": 184},  # Y=180, SUB AC in RETAIL column
    "phone_number": {"x": 150, "y": 203},  # Y=199, after "PHONE NUMBER" (ends X=146)
    "pan_gstin": {"x": 740, "y": 203},  # Y=199, PAN/GSTIN/AADHAR in RETAIL column
    "email": {"x": 150, "y": 221},  # Y=217, after "EMAIL" (ends X=146)
    "email_id": {"x": 740, "y": 221},  # Y=217, EMAIL ID in RETAIL column
    "city": {"x": 150, "y": 239},  # Y=235, after "CITY" (ends X=146)
    "delivery_type_retail": {"x": 740, "y": 239},  # Y=235, DELIVERY TYPE in RETAIL column
    # Reference source checkboxes - we'll draw tick marks in the boxes
    # Checkbox positions (X is left edge of checkbox, before the label text)
    # =========================================================================
    # OCCASION & INTENT SECTION (Y=272 header)
    # =========================================================================
    "occasion": {"x": 385, "y": 295},  # Y=291, after checkbox options
    "required_delivery": {"x": 150, "y": 313},  # Y=309, after "REQUIRED DELIVERY DATE" (ends X=146)
    "stock_in_deadline": {"x": 435, "y": 313},  # Y=309, after "STOCK IN DEADLINE" (ends X=430)
    "purpose": {"x": 280, "y": 332},  # Y=328, after checkbox options
    # =========================================================================
    # JEWELLERY DETAILS SECTION (Y=345 header)
    # =========================================================================
    "jewellery_type": {"x": 150, "y": 368},  # Y=364, after "JEWELLERY TYPE" (ends X=146)
    "size_details": {"x": 150, "y": 387},  # Y=383, after "SIZE DETAILS" (ends X=146)
    "fit_details": {"x": 340, "y": 387},  # Y=383, after "FIT DETAILS" (ends X=335)
    "follow_up_log": {"x": 150, "y": 405},  # Y=401, after "FOLLOW-UP LOG" (ends X=146)
    "style_pref": {"x": 375, "y": 424},  # Y=420, after checkbox options
    "metal_pref": {"x": 300, "y": 442},  # Y=438, after checkbox options
    # =========================================================================
    # DIAMOND/GEMSTONE SECTION (Y=456 header)
    # =========================================================================
    "diamond_shape": {"x": 150, "y": 479},  # Y=475, after "DIAMOND SHAPE PREFERENCE" (ends X=146)
    "color_clarity": {"x": 340, "y": 479},  # Y=475, after "COL/CLA." (ends X=335)
    "origin": {"x": 505, "y": 479},  # Y=475, after "ORIGIN" (ends X=501)
    "diamond_budget": {"x": 150, "y": 497},  # Y=493, after "BUDGET FOR DIA." (ends X=146)
    "diamond_priority": {"x": 260, "y": 516},  # Y=512, after checkbox options
    "gemstone_pref": {"x": 150, "y": 534},  # Y=530, after "GEMSTONE PREFERENCE" (ends X=146)
    "gem_color_clarity": {"x": 340, "y": 534},  # Y=530, after "COL/CLA." (ends X=335)
    "gem_origin": {"x": 505, "y": 534},  # Y=530, after "ORIGIN" (ends X=501)
    "other_details": {"x": 150, "y": 553},  # Y=549, after "OTHER DETAILS" (ends X=146)
    "sample": {"x": 150, "y": 571},  # Y=567, after "SAMPLE" (ends X=146)
    # =========================================================================
    # BUDGET & TIMELINE SECTION (Y=585 header)
    # =========================================================================
    "budget_range": {"x": 150, "y": 608},  # Y=604, after "BUDGET RANGE" (ends X=146)
    "urgency_level": {"x": 280, "y": 626},  # Y=622, after checkbox options
    # =========================================================================
    # SALES PERSON NOTES SECTION (Y=640 header)
    # =========================================================================
    "must_have": {"x": 150, "y": 663},  # Y=659, after "MUST-HAVE ELEMENTS" (ends X=146)
    "must_avoid": {"x": 150, "y": 682},  # Y=678, after "MUST-AVOID ELEMENTS" (ends X=146)
    "special_instructions": {
        "x": 150,
        "y": 700,
    },  # Y=696, after "SPECIAL INSTRUCTIONS" (ends X=146)
}

# =============================================================================
# CHECKBOX COORDINATE MAPPINGS
# =============================================================================
# Checkboxes appear BEFORE the label text. We draw tick marks inside the box.
# Format: {"option_name": {"x": CHECKBOX_LEFT_X, "y": CHECKBOX_TOP_Y}}
# Checkbox size is typically 10x10 points

CHECKBOX_POSITIONS = {
    # Reference Source checkboxes (Y=254)
    "ref_instagram": {"x": 153, "y": 250},  # Before "INSTAGRAM" (X=163)
    "ref_referral": {"x": 201, "y": 250},  # Before "REFERRAL" (X=211)
    "ref_walk_in": {"x": 244, "y": 250},  # Before "WALK-IN" (X=254)
    "ref_other": {"x": 283, "y": 250},  # Before "OTHER" (X=293)
    # Occasion checkboxes (Y=291)
    "occ_wedding": {"x": 153, "y": 287},  # Before "WEDDING" (X=163)
    "occ_engagement": {"x": 195, "y": 287},  # Before "ENGAGEMENT" (X=205)
    "occ_birthday": {"x": 250, "y": 287},  # Before "BIRTHDAY" (X=260)
    "occ_anniversary": {"x": 293, "y": 287},  # Before "ANNIVERSARY" (X=303)
    "occ_other": {"x": 349, "y": 287},  # Before "OTHER" (X=359)
    # Purpose checkboxes (Y=328)
    "pur_self": {"x": 153, "y": 324},  # Before "SELF" (X=163)
    "pur_gift": {"x": 180, "y": 324},  # Before "GIFT" (X=190)
    "pur_bridal": {"x": 207, "y": 324},  # Before "BRIDAL" (X=217)
    "pur_other": {"x": 241, "y": 324},  # Before "OTHER" (X=251)
    # Style Preference checkboxes (Y=420)
    "style_minimal": {"x": 153, "y": 416},  # Before "MINIMAL" (X=163)
    "style_statement": {"x": 192, "y": 416},  # Before "STATEMENT" (X=202)
    "style_traditional": {"x": 240, "y": 416},  # Before "TRADITIONAL" (X=250)
    "style_modern": {"x": 293, "y": 416},  # Before "MODERN" (X=303)
    "style_unsure": {"x": 333, "y": 416},  # Before "UNSURE" (X=343)
    # Metal Preference checkboxes (Y=438)
    "metal_yellow": {"x": 153, "y": 434},  # Before "YELLOW" (X=163)
    "metal_white": {"x": 191, "y": 434},  # Before "WHITE" (X=201)
    "metal_rose": {"x": 223, "y": 434},  # Before "ROSE" (X=233)
    "metal_two_tone": {"x": 253, "y": 434},  # Before "TWO-TONE" (X=263)
    # Diamond Priority checkboxes (Y=512)
    "dia_size": {"x": 153, "y": 508},  # Before "SIZE" (X=163)
    "dia_quality": {"x": 179, "y": 508},  # Before "QUALITY" (X=189)
    "dia_balance": {"x": 218, "y": 508},  # Before "BALANCE" (X=228)
    # Urgency Level checkboxes (Y=622)
    "urg_standard": {"x": 153, "y": 618},  # Before "STANDARD" (X=163)
    "urg_priority": {"x": 198, "y": 618},  # Before "PRIORITY" (X=208)
    "urg_urgent": {"x": 239, "y": 618},  # Before "URGENT" (X=249)
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def truncate_text(text: str, max_chars: int = 40) -> str:
    """Truncate text to fit in cell, adding ellipsis if needed."""
    if not text:
        return ""
    text = str(text).strip()
    if len(text) > max_chars:
        return text[: max_chars - 3] + "..."
    return text


def format_list(items: Any) -> str:
    """Format a list or string for display."""
    if not items:
        return ""
    if isinstance(items, list):
        return ", ".join(str(i) for i in items if i)
    return str(items)


def format_date(date_str: str) -> str:
    """Format date string for display."""
    if not date_str:
        return ""
    # If already in readable format, return as-is
    if "/" in str(date_str) or "-" in str(date_str):
        return str(date_str)
    return str(date_str)


def draw_text(
    page: fitz.Page,
    x: float,
    y: float,
    text: str,
    fontsize: float = FONT_SIZE,
    fontname: str = FONT_NAME,
    color: tuple = COLOR_BLACK,
    max_width: float = 150,
    bold: bool = False,
) -> None:
    """Draw text on a PDF page at specified coordinates using Century Gothic font."""
    if not text:
        return

    text = str(text).strip()
    if not text:
        return

    # Truncate if too long
    text = truncate_text(text, int(max_width / (fontsize * 0.5)))

    # Use Century Gothic font (matching estimate PDF)
    font_path = FONT_BOLD_PATH if bold else FONT_REGULAR_PATH

    try:
        if font_path:
            # Use Century Gothic
            page.insert_text(
                point=(x, y),
                text=text,
                fontsize=fontsize,
                fontname="gothic",
                fontfile=font_path,
                color=color,
            )
        elif ARIAL_FONT_PATH:
            # Fallback to Arial if Century Gothic not available
            page.insert_text(
                point=(x, y),
                text=text,
                fontsize=fontsize,
                fontname="arial",
                fontfile=ARIAL_FONT_PATH,
                color=color,
            )
        else:
            # Final fallback to built-in font
            page.insert_text(
                point=(x, y),
                text=text,
                fontsize=fontsize,
                fontname=fontname,
                color=color,
            )
    except Exception:
        # Fallback to basic font
        try:
            page.insert_text(
                point=(x, y),
                text=text,
                fontsize=fontsize,
                fontname="helv",
                color=color,
            )
        except Exception:
            # Silently ignore text insertion errors
            pass


def draw_checkbox_tick(
    page: fitz.Page,
    x: float,
    y: float,
    size: float = 10,
) -> None:
    """
    Draw a tick mark (✓) inside a checkbox.

    Args:
        page: PDF page object
        x: Left edge of checkbox
        y: Top edge of checkbox
        size: Size of checkbox (default 10 points)
    """
    # Draw a checkmark using lines
    # Checkmark is drawn as two lines forming a ✓ shape

    # Calculate checkmark points (inside the checkbox)
    padding = size * 0.2

    # First line: bottom-left to middle
    x1 = x + padding
    y1 = y + size / 2
    x2 = x + size * 0.4
    y2 = y + size - padding

    # Second line: middle to top-right
    x3 = x2
    y3 = y2
    x4 = x + size - padding
    y4 = y + padding

    # Draw the checkmark lines
    page.draw_line((x1, y1), (x2, y2), color=(0, 0, 0), width=1.5)
    page.draw_line((x3, y3), (x4, y4), color=(0, 0, 0), width=1.5)


def draw_checkboxes(
    page: fitz.Page, checkbox_mapping: Dict[str, List[str]], selected_values: List[str]
) -> None:
    """
    Draw tick marks in checkboxes based on selected values.

    Args:
        page: PDF page object
        checkbox_mapping: Dict mapping option values to checkbox position keys
        selected_values: List of selected option values
    """
    if not selected_values:
        return

    for value in selected_values:
        # Normalize value for comparison
        value_normalized = str(value).strip().upper()

        # Find matching checkbox position
        for option_value, checkbox_key in checkbox_mapping.items():
            if option_value.upper() == value_normalized:
                if checkbox_key in CHECKBOX_POSITIONS:
                    pos = CHECKBOX_POSITIONS[checkbox_key]
                    draw_checkbox_tick(page, pos["x"], pos["y"])
                break


# =============================================================================
# MAIN PDF GENERATION FUNCTION
# =============================================================================


def generate_sales_pdf(data: Dict[str, Any]) -> bytes:
    """
    Generate a sales query PDF by overlaying form data on the template.

    Args:
        data: Dictionary containing all form fields from the frontend

    Returns:
        PDF file as bytes
    """
    template_path = os.path.join(os.path.dirname(__file__), "templates", "Sales Queries.pdf")

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    # Open template
    doc = fitz.open(template_path)
    page = doc[0]

    # Get actual page dimensions for reference (available if needed)
    # rect = page.rect  # Available if needed for calculations
    # actual_width = rect.width  # Available if needed for calculations
    # actual_height = rect.height  # Available if needed for calculations

    # Helper to draw field value
    def draw_field(field_name: str, value: str, max_width: float = 150):
        if field_name in FIELD_POSITIONS and value:
            pos = FIELD_POSITIONS[field_name]
            draw_text(page, pos["x"], pos["y"], value, max_width=max_width)

    # ==========================================================================
    # SECTION 1: IMPORTANT DATES
    # ==========================================================================
    draw_field("sales_person", data.get("sales_person", ""))
    draw_field("vendor", data.get("vendor", ""))
    draw_field("delivery_type", data.get("client_delivery_type", ""))
    draw_field("date", format_date(data.get("order_date", data.get("date", ""))))

    # Order ID / Bill No / Job No
    order_id = data.get("bill_no", data.get("order_no", data.get("job_no", "")))
    draw_field("order_id", order_id)
    draw_field("transfer_dept", data.get("transfer_department", ""))

    # ==========================================================================
    # SECTION 2: CLIENT DETAILS (including RETAIL section on right)
    # ==========================================================================
    # Main Account - could be object or string
    account = data.get("account", {})
    if isinstance(account, dict):
        account_name = account.get("name", account.get("account_name", ""))
    else:
        account_name = data.get("client_name", str(account) if account else "")
    draw_field("main_account", account_name)

    # RETAIL section - right column
    draw_field("sub_account", data.get("sub_account", ""))
    draw_field("phone_number", data.get("phone_number", ""))
    draw_field("pan_gstin", data.get("pan_gstin", ""))
    draw_field("email", data.get("email", ""), max_width=180)
    # EMAIL ID in RETAIL section (can be same as email or different)
    draw_field("email_id", data.get("email_id", data.get("email", "")), max_width=180)
    draw_field("city", data.get("city", ""))
    # DELIVERY TYPE in RETAIL section
    draw_field(
        "delivery_type_retail", data.get("client_delivery_type", data.get("delivery_type", ""))
    )

    # Reference source - draw tick marks in checkboxes
    ref_source = data.get("reference_source", [])
    if ref_source:
        ref_mapping = {
            "Instagram": "ref_instagram",
            "Referral": "ref_referral",
            "Walk-in": "ref_walk_in",
            "Other": "ref_other",
        }
        draw_checkboxes(page, ref_mapping, ref_source)

    # ==========================================================================
    # SECTION 3: OCCASION & INTENT
    # ==========================================================================
    # Occasion - draw tick marks in checkboxes
    occasion = data.get("occasion", [])
    if occasion:
        occ_mapping = {
            "Wedding": "occ_wedding",
            "Engagement": "occ_engagement",
            "Birthday": "occ_birthday",
            "Anniversary": "occ_anniversary",
            "Other": "occ_other",
        }
        draw_checkboxes(page, occ_mapping, occasion)

    draw_field("required_delivery", format_date(data.get("required_delivery_date", "")))
    draw_field("stock_in_deadline", format_date(data.get("stock_in_deadline", "")))

    # Purpose - draw tick marks in checkboxes
    purpose = data.get("purpose", [])
    if purpose:
        pur_mapping = {
            "Self": "pur_self",
            "Gift": "pur_gift",
            "Bridal": "pur_bridal",
            "Other": "pur_other",
        }
        draw_checkboxes(page, pur_mapping, purpose)

    # ==========================================================================
    # SECTION 4: JEWELLERY DETAILS
    # ==========================================================================
    draw_field("jewellery_type", data.get("jewellery_type", data.get("item_name", "")))
    draw_field("size_details", data.get("size_details", ""))
    draw_field("fit_details", data.get("fit_details", ""))

    # Style preference - draw tick marks in checkboxes
    style_pref = data.get("style_preference", [])
    if style_pref:
        style_mapping = {
            "Minimal": "style_minimal",
            "Statement": "style_statement",
            "Traditional": "style_traditional",
            "Modern": "style_modern",
            "Unsure": "style_unsure",
        }
        draw_checkboxes(page, style_mapping, style_pref)

    # Metal preference - draw tick marks in checkboxes
    metal_pref = data.get("metal_preference", [])
    if metal_pref:
        metal_mapping = {
            "Yellow": "metal_yellow",
            "White": "metal_white",
            "Rose": "metal_rose",
            "Two-Tone": "metal_two_tone",
        }
        draw_checkboxes(page, metal_mapping, metal_pref)

    # ==========================================================================
    # SECTION 5: DIAMOND/GEMSTONE
    # ==========================================================================
    draw_field("diamond_shape", data.get("diamond_shape", ""))
    draw_field("color_clarity", data.get("color_clarity", ""))
    draw_field("origin", data.get("origin", ""))
    draw_field("diamond_budget", data.get("diamond_budget", ""))

    # Diamond priority - draw tick marks in checkboxes
    diamond_priority = data.get("diamond_priority", [])
    if diamond_priority:
        dia_mapping = {
            "Size": "dia_size",
            "Quality": "dia_quality",
            "Balance": "dia_balance",
        }
        draw_checkboxes(page, dia_mapping, diamond_priority)

    draw_field("gemstone_pref", data.get("gemstone_preference", ""))
    draw_field("gem_color_clarity", data.get("gemstone_color_clarity", ""))
    draw_field("gem_origin", data.get("gemstone_origin", ""))
    draw_field("other_details", truncate_text(data.get("other_details", ""), 40))
    draw_field("sample", data.get("sample_details", ""))

    # ==========================================================================
    # SECTION 6: BUDGET & TIMELINE
    # ==========================================================================
    draw_field("budget_range", data.get("budget_range", ""))

    # Urgency level - draw tick marks in checkboxes
    urgency = data.get("urgency_level", [])
    if urgency:
        urg_mapping = {
            "Standard": "urg_standard",
            "Priority": "urg_priority",
            "Urgent": "urg_urgent",
        }
        draw_checkboxes(page, urg_mapping, urgency)

    # ==========================================================================
    # SECTION 7: SALES PERSON NOTES
    # ==========================================================================
    draw_field("must_have", truncate_text(data.get("must_have", ""), 60), max_width=400)
    draw_field("must_avoid", truncate_text(data.get("must_avoid", ""), 60), max_width=400)
    draw_field(
        "special_instructions",
        truncate_text(data.get("special_instructions", data.get("remarks", "")), 60),
        max_width=400,
    )

    # ==========================================================================
    # USE PAGE 2 OF TEMPLATE FOR ADDITIONAL SECTIONS
    # ==========================================================================
    # Check if template has a second page
    if len(doc) >= 2:
        # Use existing Page 2 from template
        page2 = doc[1]
    else:
        # If template doesn't have Page 2, create a blank one
        page2 = doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)

    # ==========================================================================
    # PAGE 2 FIELD POSITIONS (Based on detailed template analysis)
    # ==========================================================================
    # These coordinates match the actual Sales Queries.pdf Page 2 layout
    # Labels end at X~155, values start after that
    # For fields on the same row as labels, values go in the blank space after label

    PAGE2_FIELD_POSITIONS = {
        # ADVANCE HANDLING section
        # Text fields - values go after the label (label ends at X~155)
        "advance_type": {"x": 160, "y": 47},  # After "ADVANCE TYPE" (Y=38.7, baseline ~47)
        "amount_weight": {"x": 160, "y": 66},  # After "AMOUNT / WEIGHT" (Y=57.2, baseline ~66)
        "date_received": {"x": 160, "y": 84},  # After "DATE RECEIVED" (Y=75.6, baseline ~84)
        # Gold Rate row - has multiple fields on same line
        # GOLD RATE FIXED label is at X=281-345, value cell starts after
        # The cell appears to be from X~350 to X~430 (before DATE label)
        "gold_rate_fixed": {"x": 360, "y": 139},  # After "GOLD RATE FIXED" (Y=130.9, baseline ~139)
        # DATE label is at X=437-456, value goes after
        "gold_rate_date": {"x": 470, "y": 139},  # After "DATE" (Y=130.9, baseline ~139)
        "verified_by": {"x": 160, "y": 195},  # After "VERIFIED BY" (Y=186.2, baseline ~195)
        "colour_stone_demand": {
            "x": 160,
            "y": 213,
        },  # After "COLOUR STONE DEMAND" (Y=204.6, baseline ~213)
        "raw_material_instructions": {
            "x": 160,
            "y": 232,
        },  # After "RAW MATERIAL DEPT. INSTRUCTIONS" (Y=223.0, baseline ~232)
        # DEPARTMENT INSTRUCTIONS section (Y=385-495)
        "design_instructions": {"x": 195, "y": 394},  # After "DESIGN DEPT. INSTRUCTIONS"
        "production_instructions": {"x": 195, "y": 430},  # After "PRODUCTION DEPT. INSTRUCTIONS"
        "accounts_instructions": {"x": 195, "y": 467},  # After "ACCOUNTS DEPT. INSTRUCTIONS"
        "reminders": {"x": 195, "y": 504},  # After "REMINDERS"
        # DESIGN & DELIVERY section (Y=527-656)
        "rough_work": {"x": 50, "y": 550},  # Below "ROUGH WORK" header (multiline area)
        "final_design": {"x": 330, "y": 550},  # Below "FINAL DESIGN" header (multiline area)
        "delivery_notes": {"x": 50, "y": 680},  # Below "DELIVERY NOTES" header (multiline area)
    }

    # PAGE 2 CHECKBOX POSITIONS
    # Checkboxes are empty squares before YES/NO text
    # YES text starts at X=172, NO text starts at X=196.6
    # Checkbox squares are approximately 10 points wide, positioned before the text
    PAGE2_CHECKBOX_POSITIONS = {
        # Receipt Generated (Y=94.1)
        # YES is at X=172-183, checkbox before it
        "receipt_yes": {"x": 160, "y": 90},
        # NO is at X=196.6-206, checkbox before it
        "receipt_no": {"x": 185, "y": 90},
        # Accounts Notified (Y=112.5)
        "accounts_yes": {"x": 160, "y": 108},
        "accounts_no": {"x": 185, "y": 108},
        # Gold Rate Locked (Y=130.9)
        "gold_rate_yes": {"x": 160, "y": 127},
        "gold_rate_no": {"x": 185, "y": 127},
        # ERP Entry Done (Y=149.4)
        "erp_yes": {"x": 160, "y": 145},
        "erp_no": {"x": 185, "y": 145},
        # Next Dept Triggered (Y=167.8) - multiple checkboxes
        # DESIGN text at X=172-194
        "next_dept_design": {"x": 160, "y": 164},
        # DIAMOND text at X=207.9-236.5
        "next_dept_diamond": {"x": 196, "y": 164},
        # PRODUCTION text at X=250.2-289.5
        "next_dept_production": {"x": 238, "y": 164},
    }

    # Helper function to draw on page 2
    def draw_field_p2(field_name: str, value: str, max_width: float = 150):
        if field_name in PAGE2_FIELD_POSITIONS and value:
            pos = PAGE2_FIELD_POSITIONS[field_name]
            draw_text(page2, pos["x"], pos["y"], value, max_width=max_width)

    # Helper function to draw checkboxes on page 2
    def draw_checkbox_p2(checkbox_name: str):
        if checkbox_name in PAGE2_CHECKBOX_POSITIONS:
            pos = PAGE2_CHECKBOX_POSITIONS[checkbox_name]
            draw_checkbox_tick(page2, pos["x"], pos["y"])

    # ==========================================================================
    # SECTION 8: ADVANCE HANDLING (Page 2)
    # ==========================================================================
    advance_handling = data.get("advance_handling", {})
    if isinstance(advance_handling, dict):
        # Text fields
        draw_field_p2("advance_type", str(advance_handling.get("advance_type", "")))
        draw_field_p2("amount_weight", str(advance_handling.get("amount_weight", "")))
        draw_field_p2("date_received", format_date(advance_handling.get("date_received", "")))
        draw_field_p2("gold_rate_fixed", str(advance_handling.get("gold_rate_fixed", "")))
        draw_field_p2("gold_rate_date", format_date(advance_handling.get("gold_rate_date", "")))
        draw_field_p2("verified_by", str(advance_handling.get("verified_by", "")))

        # YES/NO Checkboxes
        # Receipt Generated
        if advance_handling.get("receipt_generated"):
            draw_checkbox_p2("receipt_yes")
        else:
            draw_checkbox_p2("receipt_no")

        # Accounts Notified
        if advance_handling.get("accounts_notified"):
            draw_checkbox_p2("accounts_yes")
        else:
            draw_checkbox_p2("accounts_no")

        # Gold Rate Locked
        if advance_handling.get("gold_rate_locked"):
            draw_checkbox_p2("gold_rate_yes")
        else:
            draw_checkbox_p2("gold_rate_no")

        # ERP Entry Done
        if advance_handling.get("erp_entry_done"):
            draw_checkbox_p2("erp_yes")
        else:
            draw_checkbox_p2("erp_no")

        # Next Dept Triggered (multiple checkboxes)
        next_dept = advance_handling.get("next_dept_triggered", [])
        if isinstance(next_dept, list):
            for dept in next_dept:
                dept_lower = str(dept).lower()
                if "design" in dept_lower:
                    draw_checkbox_p2("next_dept_design")
                elif "diamond" in dept_lower:
                    draw_checkbox_p2("next_dept_diamond")
                elif "production" in dept_lower:
                    draw_checkbox_p2("next_dept_production")

    # ==========================================================================
    # SECTION 9: DEPARTMENT INSTRUCTIONS (Page 2)
    # ==========================================================================
    dept_instructions = data.get("department_instructions", {})
    if isinstance(dept_instructions, dict):
        # These are multiline text areas, so we'll use larger max_width
        draw_field_p2(
            "design_instructions",
            truncate_text(dept_instructions.get("design", ""), 100),
            max_width=380,
        )
        draw_field_p2(
            "production_instructions",
            truncate_text(dept_instructions.get("production", ""), 100),
            max_width=380,
        )
        draw_field_p2(
            "accounts_instructions",
            truncate_text(dept_instructions.get("accounts", ""), 100),
            max_width=380,
        )
        draw_field_p2(
            "reminders", truncate_text(dept_instructions.get("reminders", ""), 100), max_width=380
        )

    # ==========================================================================
    # SECTION 10: DESIGN & DELIVERY (Page 2)
    # ==========================================================================
    design_delivery = data.get("design_delivery", {})
    if isinstance(design_delivery, dict):
        # These are large multiline areas
        # Rough Work - left column
        rough_work = design_delivery.get("rough_work_notes", "")
        if rough_work:
            # Split into multiple lines if needed
            rough_lines = truncate_text(rough_work, 60).split("\n")
            y_offset = 0
            for line in rough_lines[:5]:  # Max 5 lines
                draw_text(page2, 50, 550 + y_offset, line, fontsize=7, max_width=250)
                y_offset += 12

        # Final Design - right column
        final_design = design_delivery.get("final_design_url", "")
        if final_design:
            final_lines = truncate_text(final_design, 60).split("\n")
            y_offset = 0
            for line in final_lines[:5]:  # Max 5 lines
                draw_text(page2, 330, 550 + y_offset, line, fontsize=7, max_width=250)
                y_offset += 12

        # Delivery Notes - full width at bottom
        delivery_notes = design_delivery.get("delivery_notes", "")
        if delivery_notes:
            delivery_lines = truncate_text(delivery_notes, 120).split("\n")
            y_offset = 0
            for line in delivery_lines[:3]:  # Max 3 lines
                draw_text(page2, 50, 680 + y_offset, line, fontsize=7, max_width=500)
                y_offset += 12

    # ==========================================================================
    # SECTION 11: WORKFLOW NOTES (Page 2)
    # ==========================================================================
    # Note: These don't appear to have dedicated fields on Page 2 template
    # If you want to add them, you'll need to find space or add them to rough work area
    # selection_notes = data.get("selection_notes", "")  # Available if needed
    # sale_notes = data.get("sale_notes", "")  # Available if needed

    # You can add these to the rough work area or delivery notes if needed
    # For now, we'll skip them since they're not in the template

    # ==========================================================================
    # Save and return PDF bytes
    # ==========================================================================
    output = io.BytesIO()
    doc.save(output)
    doc.close()

    return output.getvalue()


# =============================================================================
# CALIBRATION PDF GENERATOR
# =============================================================================


def generate_calibration_pdf() -> bytes:
    """
    Generate a calibration PDF with grid overlay for coordinate tuning.

    This helps visualize where text will be placed and adjust coordinates.
    """
    template_path = os.path.join(os.path.dirname(__file__), "templates", "Sales Queries.pdf")

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    doc = fitz.open(template_path)
    page = doc[0]

    rect = page.rect
    actual_width = rect.width
    actual_height = rect.height

    # Add page info
    page.insert_text(
        (10, 15),
        f"Page: {actual_width:.0f} x {actual_height:.0f} pts | Calibration Grid",
        fontsize=8,
        color=(0, 0, 0),
    )

    # Draw vertical grid lines every 50 points
    for x in range(0, int(actual_width), 50):
        page.draw_line((x, 0), (x, actual_height), color=(0.85, 0.85, 0.85), width=0.3)
        page.insert_text((x + 2, 25), str(x), fontsize=5, color=(0.5, 0.5, 0.5))

    # Draw horizontal grid lines every 50 points
    for y in range(0, int(actual_height), 50):
        page.draw_line((0, y), (actual_width, y), color=(0.85, 0.85, 0.85), width=0.3)
        page.insert_text((5, y + 8), str(y), fontsize=5, color=(0.5, 0.5, 0.5))

    # Mark key X positions (value columns)
    key_x_positions = [150, 340, 375, 420, 505]
    for x in key_x_positions:
        page.draw_line((x, 0), (x, actual_height), color=(1, 0, 0), width=0.5)
        page.insert_text((x + 2, 35), f"X={x}", fontsize=5, color=(1, 0, 0))

    # Mark all field positions with dots and labels
    for field_name, coords in FIELD_POSITIONS.items():
        x, y = coords["x"], coords["y"]
        # Draw a small circle at each position
        page.draw_circle((x, y), 2, color=(0, 0.7, 0), fill=(0, 0.7, 0))
        # Add field name label (shortened)
        short_name = field_name[:10] if len(field_name) > 10 else field_name
        page.insert_text((x + 4, y + 2), short_name, fontsize=4, color=(0, 0.5, 0))

    # Mark checkbox positions with red squares
    for checkbox_name, coords in CHECKBOX_POSITIONS.items():
        x, y = coords["x"], coords["y"]
        # Draw a red square to show checkbox location
        page.draw_rect(fitz.Rect(x, y, x + 10, y + 10), color=(1, 0, 0), width=0.5)
        # Add checkbox name label
        short_name = checkbox_name[:8]
        page.insert_text((x, y - 2), short_name, fontsize=3, color=(1, 0, 0))

    # Add sample text at key positions to verify alignment
    sample_fields = [
        ("sales_person", "John Smith"),
        ("date", "2026-01-15"),
        ("order_id", "ORD-001"),
        ("main_account", "ABC Jewellers"),
        ("phone_number", "+91 98765 43210"),
        ("email", "test@example.com"),
        ("city", "Mumbai"),
        ("jewellery_type", "Ring"),
        ("diamond_shape", "Round"),
        ("color_clarity", "D/VVS1"),
        ("budget_range", "50,000 - 1,00,000"),
        ("must_have", "Solitaire setting"),
    ]

    for field_name, sample_text in sample_fields:
        if field_name in FIELD_POSITIONS:
            pos = FIELD_POSITIONS[field_name]
            page.insert_text(
                (pos["x"], pos["y"]),
                sample_text,
                fontsize=7,
                color=(0, 0, 1),
            )

    # Add sample checkmarks to show how they look
    sample_checkboxes = [
        "ref_instagram",
        "occ_wedding",
        "pur_gift",
        "style_modern",
        "metal_yellow",
        "dia_quality",
        "urg_priority",
    ]

    for checkbox_name in sample_checkboxes:
        if checkbox_name in CHECKBOX_POSITIONS:
            pos = CHECKBOX_POSITIONS[checkbox_name]
            draw_checkbox_tick(page, pos["x"], pos["y"])

    output = io.BytesIO()
    doc.save(output)
    doc.close()

    return output.getvalue()


# =============================================================================
# TEMPLATE ANALYSIS HELPER
# =============================================================================


def analyze_template() -> Dict[str, Any]:
    """
    Analyze the PDF template to extract text positions.

    This helps identify where labels are located so we can position
    values in the correct cells.

    Returns:
        Dictionary with template analysis results
    """
    template_path = os.path.join(os.path.dirname(__file__), "templates", "Sales Queries.pdf")

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template PDF not found at: {template_path}")

    doc = fitz.open(template_path)
    page = doc[0]

    # Get page dimensions
    rect = page.rect

    # Extract all text with positions
    text_dict = page.get_text("dict")

    # Collect text blocks with positions
    text_items = []
    for block in text_dict.get("blocks", []):
        if block.get("type") == 0:  # Text block
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text:
                        bbox = span.get("bbox", [0, 0, 0, 0])
                        text_items.append(
                            {
                                "text": text,
                                "x": bbox[0],
                                "y": bbox[1],
                                "x2": bbox[2],
                                "y2": bbox[3],
                                "font_size": span.get("size", 0),
                            }
                        )

    # Sort by Y position (top to bottom)
    text_items.sort(key=lambda x: (x["y"], x["x"]))

    doc.close()

    return {
        "page_width": rect.width,
        "page_height": rect.height,
        "text_items": text_items,
    }


def print_template_analysis():
    """Print template analysis for debugging."""
    try:
        analysis = analyze_template()
        print(f"Page dimensions: {analysis['page_width']:.1f} x {analysis['page_height']:.1f}")
        print("\nText items found:")
        for item in analysis["text_items"]:
            print(f"  Y={item['y']:.0f} X={item['x']:.0f}-{item['x2']:.0f}: '{item['text']}'")
    except Exception as e:
        print(f"Error analyzing template: {e}")
