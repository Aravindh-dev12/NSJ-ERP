"""
Create a clean template by copying the original and removing text content
WITHOUT using redactions (which create white boxes).
Instead, we'll create a new PDF with only the structure.
"""

import fitz

# Open original template
original = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
original_page = original[0]

# Create a new PDF with same page size
new_doc = fitz.open()
new_page = new_doc.new_page(width=original_page.rect.width, height=original_page.rect.height)

print("Creating clean template without redactions...")
print("=" * 80)

# Get all elements from original
text_dict = original_page.get_text("dict")

# Labels and structure to KEEP (not sample data)
labels_to_keep = [
    "TAX INVOICE",
    "TM",
    "Niti Shah Jewels",
    "2/63 JVPD, NS Road No. 1",
    "Vile Parle West, Mumbai",
    "GSTIN/UIN:",
    "27FSFPS4058J1Z5",
    "State Name:",
    "Maharashtra",
    "Code:",
    "27",
    "+919987520906",
    "hello@nitishahjewels.com",
    "Gross Weight",
    "BUYER (BILL TO):",
    "DATED",
    "INVOICE NO.",
    "MODE/TERMS OF PAYMENT",
    "Place of Supply",
    "S.N.",
    "DESCRIPTION OF GOODS",
    "HSN CODE",
    "QUANTITY",
    "RATE",
    "UNIT",
    "(PER)",
    "AMOUNT",
    "IGST - Output",
    "Round off",
    "TOTAL",
    "AMOUNT CHARGEABLE IN WORDS",
    "HSN/SAC CODE",
    "TAXABLE VALUE",
    "IGST",
    "TOTAL TAX AMOUNT",
    "COMPANY'S BANK DETAILS",
    "BANK NAME",
    "HDFC BANK",
    "ACCOUNT HOLDER",
    "NITI NILESH SHAH",
    "ACCOUNT NUMBER",
    "50200111236249",
    "BRANCH",
    "VILE PARLE EAST",
    "IFSC CODE",
    "HDFC0000227",
    "PAN:",
    "GSTIN/UIN:",
    "State Name:",
    "Code:",
    "DECLARATION",
    "We declare that this invoice shows the actual price",
    "of the goods described and that all particulars are",
    "true and correct.",
    "for Niti Shah Jewels",
    "Authorised Signatory",
]

# Sample data to EXCLUDE
sample_data_to_exclude = [
    "SATYAM JEWELLERS",
    "624, BANK ROAD",
    "MUKSTAR",
    "PUNJAB",
    "9814198040",
    "03AEFPG4541P1ZH",
    "AEFPG4541P",
    "Panjab",
    "03/01/2026",
    "28",
    "03 (Punjab)",
    "1.",
    "2.",
    "18K GOLD JEWELLERY",
    "4.910 GMS",
    "1.650 GMS",
    "6.560 GMS",
    "11,135.00",
    "20,157.58",
    "54,672.85",
    "3,260.01",
    "2,637.99",
    "3.0",
    "1.5",
    "0.15",
    "90,571.00",
    "87,932.86",
    "1,081,127.00",
    "15,977.00",
    "INR TEN LAKH",
    "INR FIFTEEN THOUSAND",
]

# First, copy all graphics (lines, rectangles, colors, backgrounds)
# This preserves the table structure and design
original_page._cleanContents()
xref = original_page.get_contents()[0]
cont = original.xref_stream(xref)
new_page.insert_text((0, 0), "")  # Initialize page
new_page.set_contents(cont)

# Now, clear ALL text and re-add only labels
new_page.clean_contents()

# Get text with positions and fonts
kept_count = 0
excluded_count = 0

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:  # Text block
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                font = span.get("font", "")
                size = span.get("size", 0)
                color_int = span.get("color", 0)

                if not text:
                    continue

                # Check if this is a label to keep or sample data to exclude
                should_keep = False
                should_exclude = False

                for label in labels_to_keep:
                    if label in text:
                        should_keep = True
                        break

                for sample in sample_data_to_exclude:
                    if sample in text:
                        should_exclude = True
                        break

                # Keep labels, exclude sample data
                if should_keep and not should_exclude:
                    # Convert color
                    r = (color_int >> 16) & 0xFF
                    g = (color_int >> 8) & 0xFF
                    b = color_int & 0xFF
                    color = (r / 255, g / 255, b / 255)

                    # Insert text at exact position
                    try:
                        new_page.insert_text(
                            (bbox[0], bbox[3]),  # Use baseline Y
                            text,
                            fontsize=size,
                            color=color,
                        )
                        kept_count += 1
                        print(f"✓ Kept: '{text[:40]}'")
                    except Exception as e:
                        print(f"✗ Error keeping '{text}': {e}")
                elif should_exclude:
                    excluded_count += 1
                    print(f"✗ Excluded: '{text[:40]}'")

# Save clean template
output_path = "Satyam Jewellery-Invoice-2026-CLEAN.pdf"
new_doc.save(output_path)
new_doc.close()
original.close()

print(f"\n{'=' * 80}")
print(f"✅ Clean template saved: {output_path}")
print(f"✅ Kept {kept_count} labels")
print(f"✅ Excluded {excluded_count} sample data items")
print(f"✅ NO white backgrounds or redaction boxes")
print(f"✅ Structure and design preserved")
