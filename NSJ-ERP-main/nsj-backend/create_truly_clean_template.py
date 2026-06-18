"""
Create a TRULY clean template by removing ONLY sample data values,
keeping all labels and structure intact.
"""

import fitz

# Open original template
doc = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
page = doc[0]

print("Creating truly clean template...")
print("=" * 80)

# Sample DATA to remove (not labels!)
# These are the actual values that should be replaced with dynamic data
sample_data_to_remove = [
    # Buyer section sample data
    "SATYAM JEWELLERS",
    "624, BANK ROAD, MUKSTAR, PUNJAB, Ph: 9814198040",
    "03AEFPG4541P1ZH",
    "AEFPG4541P",
    "Panjab",
    "03",  # State code value (but keep "Code:" label)
    # Invoice section sample data
    "03/01/2026",
    "28",  # Invoice number
    "03 (Punjab)",
    # Table sample data
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
    "1,081,127.00",
    "15,977.00",
    # Tax values (keep labels!)
    "3.0",
    "1.5",
    "0.15",
    # Amount in words
    "INR TEN LAKH EIGHTY ONE THOUSAND ONE HUNDRED AND TWENTY SEVEN ONLY",
    "INR FIFTEEN THOUSAND NINE HUNDRED AND SEVENTY SEVEN ONLY",
]

# Get all text with positions
text_dict = page.get_text("dict")

redactions = []
removed_count = 0

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")

                # Check if this text should be removed
                for sample in sample_data_to_remove:
                    if text == sample or (sample in text and len(text) < len(sample) + 10):
                        # Add to redaction list
                        rect = fitz.Rect(bbox)
                        redactions.append(rect)
                        removed_count += 1
                        print(f"Removing: '{text}' at {bbox}")
                        break

# Apply redactions
print(f"\nApplying {removed_count} redactions...")
for rect in redactions:
    # Redact with white color to match background
    page.add_redact_annot(rect, fill=(1, 1, 1))

page.apply_redactions()

# Save clean template
output_path = "Satyam Jewellery-Invoice-2026-CLEAN.pdf"
doc.save(output_path)
doc.close()

print(f"\n✅ Clean template saved: {output_path}")
print(f"✅ Removed {removed_count} instances of sample data")
print("✅ All labels and structure preserved")
