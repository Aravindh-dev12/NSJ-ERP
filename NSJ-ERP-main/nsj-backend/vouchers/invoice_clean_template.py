"""
Clean Invoice PDF Generator - No Sample Data
Generates invoice PDF from scratch with template structure but no pre-filled data
"""

import io
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


def number_to_words_indian(number):
    """Convert number to Indian currency words"""
    try:
        number = int(float(number))
    except (ValueError, TypeError):
        return "ZERO ONLY"

    if number == 0:
        return "ZERO ONLY"

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
    elif number < 100000:
        thousands = number // 1000
        remainder = number % 1000
        result = convert_below_thousand(thousands) + " THOUSAND"
        if remainder:
            result += " " + convert_below_thousand(remainder)
    elif number < 10000000:
        lakhs = number // 100000
        remainder = number % 100000
        result = convert_below_thousand(lakhs) + " LAKH"
        if remainder >= 1000:
            result += " " + convert_below_thousand(remainder // 1000) + " THOUSAND"
            if remainder % 1000:
                result += " " + convert_below_thousand(remainder % 1000)
        elif remainder:
            result += " " + convert_below_thousand(remainder)
    else:
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


def generate_clean_invoice_pdf(
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
    company_name: str = "Niti Shah Jewels",
    company_address: str = "2/63 JVPD, NS Road No. 1, Vile Parle West, Mumbai",
    company_phone: str = "+919987520906",
    company_gstin: str = "27FSFPS4058J1Z5",
    company_state: str = "Maharashtra",
    company_state_code: str = "27",
    company_email: str = "hello@nitishahjewels.com",
    product_image_path: str = None,
) -> bytes:
    """
    Generate clean invoice PDF from scratch - no sample data, only actual data
    """

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Define colors
    maroon = colors.Color(0.4, 0.1, 0.1)  # Dark maroon for headers
    light_bg = colors.Color(0.96, 0.94, 0.90)  # Light beige background

    # Header Section
    c.setFillColor(maroon)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(width - 40, height - 40, "TAX INVOICE")

    # Company Info (Right side)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 40, height - 65, company_name)
    c.setFont("Helvetica", 8)
    c.drawRightString(width - 40, height - 78, company_address)
    c.drawRightString(width - 40, height - 90, f"☎ {company_phone}")
    c.drawRightString(width - 40, height - 102, f"✉ {company_email}")

    c.setFont("Helvetica-Bold", 8)
    c.drawRightString(width - 40, height - 120, f"GSTIN/UIN: {company_gstin}")
    c.drawRightString(width - 40, height - 132, f"State Name: {company_state}")
    c.drawRightString(width - 40, height - 144, f"Code: {company_state_code}")

    # Buyer Section
    y_pos = height - 180
    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, y_pos, "BUYER (BILL TO):")

    c.setFont("Helvetica", 9)
    y_pos -= 15
    c.drawString(40, y_pos, customer_name)

    if customer_address:
        y_pos -= 12
        c.drawString(40, y_pos, customer_address)

    if customer_gstin:
        y_pos -= 15
        c.setFont("Helvetica-Bold", 8)
        c.drawString(40, y_pos, f"GSTIN/UIN: ")
        c.setFont("Helvetica", 8)
        c.drawString(100, y_pos, customer_gstin)

    if customer_state:
        y_pos -= 12
        c.setFont("Helvetica-Bold", 8)
        c.drawString(40, y_pos, f"State Name: ")
        c.setFont("Helvetica", 8)
        c.drawString(100, y_pos, f"{customer_state}, Code: {customer_state_code}")

    # Invoice Details (Right side)
    y_pos = height - 180
    c.setFont("Helvetica-Bold", 9)
    c.drawString(width - 250, y_pos, "DATED")
    c.drawString(width - 150, y_pos, "INVOICE NO.")

    c.setFont("Helvetica", 9)
    y_pos -= 15
    c.drawString(width - 250, y_pos, invoice_date)
    c.drawString(width - 150, y_pos, invoice_number)

    y_pos -= 20
    c.setFont("Helvetica-Bold", 9)
    c.drawString(width - 250, y_pos, "MODE/TERMS OF PAYMENT")
    c.drawString(width - 150, y_pos, "Place of Supply")

    c.setFont("Helvetica", 9)
    y_pos -= 15
    c.drawString(width - 250, y_pos, payment_terms or "Net 30 Days")
    c.drawString(width - 150, y_pos, f"{customer_state_code}")

    # Line Items Table
    y_pos -= 40
    table_data = []

    # Table headers
    headers = [
        "S.N.",
        "DESCRIPTION OF GOODS",
        "HSN CODE",
        "QUANTITY",
        "RATE",
        "UNIT\n(PER)",
        "AMOUNT",
    ]
    table_data.append(headers)

    # Add line items
    if line_items:
        for idx, item in enumerate(line_items, 1):
            row = [
                str(idx),
                item.get("particulars", ""),
                item.get("hsn_code", ""),
                f"{item.get('weight', 0):.3f} GMS",
                f"₹{item.get('rate', 0):,.2f}",
                item.get("unit", "GMS"),
                f"₹{item.get('amount', 0):,.2f}",
            ]
            table_data.append(row)

    # Add tax rows
    table_data.append(["", "IGST - Output", "", f"{gst_rate}%", "", "", f"₹{gst_amount:,.2f}"])
    table_data.append(["", "Round off", "", "1.5", "", "", "₹0.15"])

    # Total row
    total_weight = sum(item.get("weight", 0) for item in (line_items or []))
    table_data.append(
        ["", "TOTAL", "", f"{total_weight:.3f} GMS", "", "CT", f"₹{total_amount:,.2f}"]
    )

    # Create table
    col_widths = [30, 150, 60, 80, 80, 50, 80]
    table = Table(table_data, colWidths=col_widths)

    table.setStyle(
        TableStyle(
            [
                # Header row styling
                ("BACKGROUND", (0, 0), (-1, 0), maroon),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
                # Data rows styling
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),  # S.N. center
                ("ALIGN", (3, 1), (-1, -1), "RIGHT"),  # Numbers right-aligned
                # Grid
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BOX", (0, 0), (-1, -1), 1, colors.black),
                # Total row bold
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), light_bg),
            ]
        )
    )

    # Draw table
    table.wrapOn(c, width, height)
    table_height = table._height
    table.drawOn(c, 40, y_pos - table_height)

    # Amount in words
    y_pos = y_pos - table_height - 30
    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, y_pos, "AMOUNT CHARGEABLE IN WORDS")
    c.setFont("Helvetica", 9)
    y_pos -= 15
    amount_words = number_to_words_indian(total_amount)
    c.drawString(40, y_pos, amount_words)

    # Footer - Bank Details
    y_pos -= 40
    c.setFillColor(maroon)
    c.rect(40, y_pos - 60, width - 80, 60, fill=False, stroke=True)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y_pos - 15, "COMPANY'S BANK DETAILS")
    c.setFont("Helvetica", 8)
    c.drawString(50, y_pos - 30, "A/C HOLDER NAME: NITI NILESH SHAH")
    c.drawString(50, y_pos - 42, "BANK NAME: HDFC BANK")
    c.drawString(50, y_pos - 54, "A/C NO.: 50200111236249")

    c.drawString(width - 250, y_pos - 30, "BRANCH & IFSC CODE:")
    c.drawString(width - 250, y_pos - 42, "VILE PARLE EAST")
    c.drawString(width - 250, y_pos - 54, "HDFC0000227")

    # Signature section
    y_pos -= 80
    c.setFont("Helvetica", 8)
    c.drawString(50, y_pos, "CUSTOMER SIGNATURE & STAMP")
    c.drawRightString(width - 50, y_pos, f"FOR {company_name.upper()}")

    # Product image if provided
    if product_image_path:
        try:
            c.drawImage(
                product_image_path,
                40,
                height - 400,
                width=120,
                height=180,
                preserveAspectRatio=True,
            )
        except:
            pass

    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
