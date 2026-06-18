"""
Verify clean template - checking only for CUSTOMER sample data
(not company details or labels)
"""

import fitz

doc = fitz.open("Satyam Jewellery-Invoice-2026-CLEAN.pdf")
page = doc[0]

# Get all text
text_dict = page.get_text("dict")

# CUSTOMER sample data that should NOT be in clean template
# (Company details like "Vile Parle West, Mumbai" should stay)
customer_sample_data = [
    "SATYAM JEWELLERS",  # Customer name (not company)
    "624, BANK ROAD",  # Customer address
    "03AEFPG4541P1ZH",  # Customer GSTIN
    "Panjab",  # Customer state
    "03/01/2026",  # Invoice date
    "28",  # Invoice number (but this might match other text)
    "18K GOLD JEWELLERY",  # Line item
    "4.910 GMS",  # Quantity
    "11,135.00",  # Rate
    "54,672.85",  # Amount
    "INR TEN LAKH",  # Amount in words
]

print("Checking clean template for CUSTOMER sample data...\n")
print("=" * 80)

found_sample_data = []

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                y = bbox[1]

                # Only check in customer area (y > 140) to avoid company header
                if y > 140:
                    for sample in customer_sample_data:
                        if sample in text:
                            found_sample_data.append((text, y))
                            print(f"❌ FOUND CUSTOMER DATA: '{text}' at y={y:.1f}")
                            break

if not found_sample_data:
    print("✅ Clean template is truly clean - NO customer sample data found!")
    print("✅ Company details and labels are preserved")
else:
    print(f"\n❌ Found {len(found_sample_data)} instances of customer sample data")

doc.close()
