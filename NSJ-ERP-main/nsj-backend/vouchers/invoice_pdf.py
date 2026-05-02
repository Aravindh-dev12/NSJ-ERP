"""
Invoice PDF Generator using ReportLab

This module generates professional invoice PDFs with a clean, business-appropriate format.
"""

import io
from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas


def format_currency_inr(amount):
    """Format amount as Indian Rupees"""
    if amount is None:
        return "₹0.00"
    try:
        amount = float(amount)
        return f"₹{amount:,.2f}"
    except (ValueError, TypeError):
        return "₹0.00"


def generate_invoice_pdf(
    invoice_number: str,
    invoice_date: str,
    due_date: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str,
    customer_address: str,
    customer_gstin: str,
    item_name: str,
    line_items: List[Dict[str, Any]],
    subtotal: float,
    gst_rate: float,
    gst_amount: float,
    total_amount: float,
    amount_paid: float,
    balance_due: float,
    notes: str = "",
    terms_and_conditions: str = "",
    company_name: str = "Satyam Jewellery",
    company_address: str = "",
    company_phone: str = "",
    company_email: str = "",
    company_gstin: str = "",
    image_data: Optional[bytes] = None,
) -> bytes:
    """
    Generate a professional invoice PDF.

    Args:
        invoice_number: Invoice number (e.g., "INV000001")
        invoice_date: Invoice date string
        due_date: Payment due date
        customer_name: Customer name
        customer_phone: Customer phone
        customer_email: Customer email
        customer_address: Customer address
        customer_gstin: Customer GSTIN
        item_name: Item name
        line_items: List of line item dictionaries
        subtotal: Subtotal amount
        gst_rate: GST rate percentage
        gst_amount: GST amount
        total_amount: Total amount
        amount_paid: Amount already paid
        balance_due: Balance due
        notes: Internal notes
        terms_and_conditions: Terms and conditions
        company_name: Company name
        company_address: Company address
        company_phone: Company phone
        company_email: Company email
        company_gstin: Company GSTIN
        image_data: Optional product image bytes

    Returns:
        PDF bytes
    """
    buffer = io.BytesIO()

    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    # Container for PDF elements
    elements = []

    # Styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1a1a1a"),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )

    company_style = ParagraphStyle(
        "CompanyName",
        parent=styles["Normal"],
        fontSize=16,
        textColor=colors.HexColor("#2c3e50"),
        spaceAfter=3,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=11,
        textColor=colors.HexColor("#2c3e50"),
        spaceAfter=6,
        fontName="Helvetica-Bold",
    )

    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#333333"),
        spaceAfter=3,
    )

    small_style = ParagraphStyle(
        "SmallText",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#666666"),
        spaceAfter=2,
    )

    # ==========================================================================
    # HEADER: Company Name
    # ==========================================================================
    elements.append(Paragraph(company_name, company_style))
    if company_address:
        elements.append(Paragraph(company_address, small_style))
    if company_phone:
        elements.append(Paragraph(f"Phone: {company_phone}", small_style))
    if company_email:
        elements.append(Paragraph(f"Email: {company_email}", small_style))
    if company_gstin:
        elements.append(Paragraph(f"GSTIN: {company_gstin}", small_style))

    elements.append(Spacer(1, 10 * mm))

    # ==========================================================================
    # INVOICE TITLE
    # ==========================================================================
    elements.append(Paragraph("TAX INVOICE", title_style))
    elements.append(Spacer(1, 5 * mm))

    # ==========================================================================
    # INVOICE INFO AND CUSTOMER INFO (Side by side)
    # ==========================================================================
    invoice_customer_data = [
        [
            Paragraph(f"<b>Invoice No:</b> {invoice_number}", normal_style),
            Paragraph(f"<b>Bill To:</b>", heading_style),
        ],
        [
            Paragraph(f"<b>Invoice Date:</b> {invoice_date}", normal_style),
            Paragraph(customer_name, normal_style),
        ],
        [
            Paragraph(f"<b>Due Date:</b> {due_date}", normal_style),
            Paragraph(customer_address if customer_address else "", small_style),
        ],
        [
            "",
            Paragraph(f"Phone: {customer_phone}" if customer_phone else "", small_style),
        ],
        [
            "",
            Paragraph(f"Email: {customer_email}" if customer_email else "", small_style),
        ],
        [
            "",
            Paragraph(f"GSTIN: {customer_gstin}" if customer_gstin else "", small_style),
        ],
    ]

    invoice_customer_table = Table(invoice_customer_data, colWidths=[85 * mm, 85 * mm])
    invoice_customer_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    elements.append(invoice_customer_table)
    elements.append(Spacer(1, 8 * mm))

    # ==========================================================================
    # LINE ITEMS TABLE
    # ==========================================================================
    # Table header
    table_data = [
        [
            Paragraph("<b>S.No</b>", normal_style),
            Paragraph("<b>Description</b>", normal_style),
            Paragraph("<b>Shape</b>", normal_style),
            Paragraph("<b>Colour</b>", normal_style),
            Paragraph("<b>Clarity</b>", normal_style),
            Paragraph("<b>Qty</b>", normal_style),
            Paragraph("<b>Weight</b>", normal_style),
            Paragraph("<b>Unit</b>", normal_style),
            Paragraph("<b>Rate</b>", normal_style),
            Paragraph("<b>Amount</b>", normal_style),
        ]
    ]

    # Add line items
    for idx, item in enumerate(line_items, 1):
        particulars = str(item.get("particulars", "")).strip()
        shape = str(item.get("shape", "")).strip()
        colour = str(item.get("colour", "")).strip()
        clarity = str(item.get("clarity", "")).strip()
        quantity = item.get("quantity", 1)
        weight = item.get("weight", 0)
        unit = str(item.get("unit", "")).strip()
        rate = item.get("rate", 0)
        amount = item.get("amount", 0)

        table_data.append(
            [
                Paragraph(str(idx), normal_style),
                Paragraph(particulars, normal_style),
                Paragraph(shape, small_style),
                Paragraph(colour, small_style),
                Paragraph(clarity, small_style),
                Paragraph(str(quantity), normal_style),
                Paragraph(f"{weight:.3f}" if weight else "", normal_style),
                Paragraph(unit, small_style),
                Paragraph(format_currency_inr(rate), normal_style),
                Paragraph(format_currency_inr(amount), normal_style),
            ]
        )

    # Create table
    line_items_table = Table(
        table_data,
        colWidths=[
            10 * mm,
            35 * mm,
            15 * mm,
            15 * mm,
            15 * mm,
            12 * mm,
            15 * mm,
            12 * mm,
            20 * mm,
            25 * mm,
        ],
    )

    line_items_table.setStyle(
        TableStyle(
            [
                # Header row
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#34495e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                # Data rows
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),  # S.No center
                ("ALIGN", (5, 1), (5, -1), "CENTER"),  # Qty center
                ("ALIGN", (6, 1), (6, -1), "RIGHT"),  # Weight right
                ("ALIGN", (7, 1), (7, -1), "CENTER"),  # Unit center
                ("ALIGN", (8, 1), (8, -1), "RIGHT"),  # Rate right
                ("ALIGN", (9, 1), (9, -1), "RIGHT"),  # Amount right
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                # Grid
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BOX", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    elements.append(line_items_table)
    elements.append(Spacer(1, 5 * mm))

    # ==========================================================================
    # TOTALS SECTION
    # ==========================================================================
    totals_data = [
        ["", "", "Subtotal:", format_currency_inr(subtotal)],
        ["", "", f"GST ({gst_rate}%):", format_currency_inr(gst_amount)],
        ["", "", "<b>Total Amount:</b>", f"<b>{format_currency_inr(total_amount)}</b>"],
    ]

    if amount_paid > 0:
        totals_data.append(["", "", "Amount Paid:", format_currency_inr(amount_paid)])
        totals_data.append(
            ["", "", "<b>Balance Due:</b>", f"<b>{format_currency_inr(balance_due)}</b>"]
        )

    totals_table = Table(totals_data, colWidths=[60 * mm, 50 * mm, 35 * mm, 30 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("ALIGN", (3, 0), (3, -1), "RIGHT"),
                ("FONTNAME", (2, 0), (3, -1), "Helvetica"),
                ("FONTSIZE", (2, 0), (3, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEABOVE", (2, 0), (3, 0), 0.5, colors.grey),
                ("LINEABOVE", (2, 2), (3, 2), 1, colors.black),
                ("LINEABOVE", (2, -1), (3, -1), 1, colors.black)
                if amount_paid > 0
                else ("LINEABOVE", (2, 2), (3, 2), 1, colors.black),
            ]
        )
    )

    elements.append(totals_table)
    elements.append(Spacer(1, 8 * mm))

    # ==========================================================================
    # TERMS AND CONDITIONS
    # ==========================================================================
    if terms_and_conditions:
        elements.append(Paragraph("<b>Terms & Conditions:</b>", heading_style))
        elements.append(Paragraph(terms_and_conditions, small_style))
        elements.append(Spacer(1, 5 * mm))

    # ==========================================================================
    # NOTES
    # ==========================================================================
    if notes:
        elements.append(Paragraph("<b>Notes:</b>", heading_style))
        elements.append(Paragraph(notes, small_style))
        elements.append(Spacer(1, 5 * mm))

    # ==========================================================================
    # FOOTER
    # ==========================================================================
    elements.append(Spacer(1, 10 * mm))
    footer_text = f"<i>Thank you for your business!</i><br/><br/>For {company_name}<br/><br/><br/>Authorized Signatory"
    elements.append(Paragraph(footer_text, small_style))

    # Build PDF
    doc.build(elements)

    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
