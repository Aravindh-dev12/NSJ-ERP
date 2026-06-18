"""
Script to create a clean invoice template with NO sample data
Preserves: Labels, headers, structure, bank details, borders
Removes: ALL sample customer data, invoice data, line item data
"""

import fitz  # PyMuPDF
import os

# Open the original template
template_path = "Satyam Jewellery-Invoice-2026.pdf"
output_path = "Satyam Jewellery-Invoice-2026-CLEAN.pdf"

print(f"Opening template: {template_path}")
doc = fitz.open(template_path)
page = doc[0]

print(f"Page size: {page.rect.width} x {page.rect.height}")

# Define ALL sample data to remove (comprehensive list)
sample_texts_to_remove = [
    # Buyer section - ALL sample values
    "SATYAM JEWELLERS",
    "624, BANK ROAD, MUKSTAR, PUNJAB",
    "624, BANK ROAD",
    "MUKSTAR",
    "PUNJAB",
    "Ph: 9814198040",
    "Ph. 9814198040",
    "9814198040",
    "03AEFPG4541P1ZH",
    "AEFPG4541P",
    "Code: 03",
    "Panjab",
    "Punjab",
    "aryan",
    "Mumbai",
    # Invoice section - ALL sample values
    "03/01/2026",
    "09/02/2026",
    "01/02/2026",
    "28",
    "INV000003",
    "Net 30 Days",
    "03 (Punjab)",
    "27 ( )",
    # Table line items - ALL sample descriptions
    "18K GOLD JEWELLERY",
    "abc",
    # Sample quantities
    "4.910 GMS",
    "1.650 GMS",
    "0.116 GMS",
    "6.560 GMS",
    # Sample rates
    "₹ 11,135.00",
    "₹ 20,157.58",
    "₹ 1,000,000.00",
    "1,000,000.00",
    # Sample amounts
    "₹ 54,672.85",
    "₹ 3,260.01",
    "₹ 2,637.99",
    "₹ 0.15",
    "₹ 90,571.00",
    "₹ 87,932.86",
    "54,672.85",
    "3,260.01",
    "2,637.99",
    "0.15",
    "90,571.00",
    "87,932.86",
    # Sample percentages
    "3.0%",
    "1.5",
    # Amount in words - ALL variations
    "INR ONE LAKH NINETEEN THOUSAND FOUR HUNDRED EIGHTY ONLY",
    "INR TEN LAKH EIGHTY ONE THOUSAND ONE HUNDRED AND TWENTY SEVEN ONLY",
    "INR FIFTEEN THOUSAND NINE HUNDRED AND SEVENTY SEVEN ONLY",
    "NINETEEN THOUSAND FOUR HUNDRED EIGHTY ONLY",
    "ONE LAKH NINETEEN THOUSAND",
    # HSN codes - sample values
    "71131910",
    "71131920",
]

print(f"\nRemoving {len(sample_texts_to_remove)} sample text patterns...")

# Remove each sample text
removed_count = 0
for sample_text in sample_texts_to_remove:
    instances = page.search_for(sample_text)
    if instances:
        print(f"  Found '{sample_text}' at {len(instances)} location(s)")
        for inst in instances:
            page.add_redact_annot(inst)
            removed_count += 1

print(f"\nTotal redactions: {removed_count}")

# Apply text redactions
print("Applying text redactions...")
page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

# Clean the page
print("Cleaning page content...")
page.clean_contents()

# Remove sample product images (but keep logo and design elements)
print("Removing sample product images...")
img_list = page.get_images()
print(f"Found {len(img_list)} images")

for img_index, img in enumerate(img_list):
    try:
        xref = img[0]
        img_rects = page.get_image_rects(xref)
        for img_rect in img_rects:
            # Remove images on left side (product images)
            # Keep images on top (logo) and right side (design elements)
            if img_rect.x0 < 130 and img_rect.y0 > 50 and img_rect.y0 < 200:
                print(f"  Removing image at x={img_rect.x0:.1f}, y={img_rect.y0:.1f}")
                page.add_redact_annot(img_rect)
    except Exception as e:
        print(f"  Error processing image {img_index}: {e}")

# Apply image redactions
print("Applying image redactions...")
page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE)

# Save the clean template
print(f"\nSaving clean template to: {output_path}")
doc.save(output_path, garbage=4, deflate=True, clean=True)
doc.close()

print("\n✅ Clean template created successfully!")
print(f"   Original: {template_path}")
print(f"   Clean: {output_path}")
print("\nWhat was preserved:")
print("  ✓ All labels (BUYER, DATED, INVOICE NO., etc.)")
print("  ✓ All table headers (S.N., DESCRIPTION OF GOODS, etc.)")
print("  ✓ All borders and structure")
print("  ✓ Bank details section")
print("  ✓ Company logo and branding")
print("  ✓ Background colors and design")
print("\nWhat was removed:")
print("  ✗ All sample customer data")
print("  ✗ All sample invoice data")
print("  ✗ All sample line items")
print("  ✗ All sample amounts")
print("  ✗ Sample product images")
print("\nNext step: Update invoice_template_pdf.py to use the clean template")
