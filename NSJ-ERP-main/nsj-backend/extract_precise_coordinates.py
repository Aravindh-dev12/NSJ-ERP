"""
Extract PRECISE coordinates by analyzing the original template in detail
Focus on getting exact baseline positions for text
"""

import fitz

doc = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
page = doc[0]

print(f"Page dimensions: {page.rect.width} x {page.rect.height}\n")
print("=" * 100)
print("PRECISE COORDINATE EXTRACTION - BASELINE POSITIONS")
print("=" * 100)

# Get all text with detailed positioning
text_dict = page.get_text("dict")

# Organize by Y position to understand layout
all_text_items = []

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:  # Text block
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                if text:
                    all_text_items.append(
                        {
                            "text": text,
                            "x": bbox[0],
                            "y": bbox[3],  # Use BOTTOM of bbox (baseline)
                            "y_top": bbox[1],  # Top of bbox
                            "x2": bbox[2],
                            "y2": bbox[3],
                            "size": span.get("size", 0),
                            "font": span.get("font", ""),
                        }
                    )

# Sort by Y position
all_text_items.sort(key=lambda x: (x["y"], x["x"]))

# Find specific fields with their BASELINE positions
print("\n### BUYER SECTION (using baseline Y) ###")
buyer_fields = ["SATYAM JEWELLERS", "624, BANK ROAD", "03AEFPG4541P1ZH", "Panjab", "Code:"]
for item in all_text_items:
    if any(field in item["text"] for field in buyer_fields):
        print(f"\n'{item['text']}'")
        print(f"  X: {item['x']:.2f}")
        print(f"  Y (baseline): {item['y']:.2f}")
        print(f"  Y (top): {item['y_top']:.2f}")
        print(f"  Font size: {item['size']:.2f}pt")
        print(f"  Font: {item['font']}")

print("\n### INVOICE SECTION (using baseline Y) ###")
invoice_fields = ["03/01/2026", "28", "03 (Punjab)"]
for item in all_text_items:
    if item["text"] in invoice_fields:
        print(f"\n'{item['text']}'")
        print(f"  X: {item['x']:.2f}")
        print(f"  Y (baseline): {item['y']:.2f}")
        print(f"  Y (top): {item['y_top']:.2f}")
        print(f"  Font size: {item['size']:.2f}pt")
        print(f"  Font: {item['font']}")

print("\n### TABLE DATA ROW 1 (using baseline Y) ###")
# Find all items in row 1 (y around 271)
row1_items = [item for item in all_text_items if 270 < item["y"] < 273]
for item in row1_items:
    print(f"\n'{item['text']}'")
    print(f"  X: {item['x']:.2f}")
    print(f"  Y (baseline): {item['y']:.2f}")
    print(f"  Font size: {item['size']:.2f}pt")

print("\n### TABLE DATA ROW 2 (using baseline Y) ###")
# Find all items in row 2 (y around 287)
row2_items = [item for item in all_text_items if 286 < item["y"] < 289]
for item in row2_items:
    print(f"\n'{item['text']}'")
    print(f"  X: {item['x']:.2f}")
    print(f"  Y (baseline): {item['y']:.2f}")
    print(f"  Font size: {item['size']:.2f}pt")

print("\n### TAX SECTION (using baseline Y) ###")
tax_fields = ["IGST - Output", "Round off", "TOTAL"]
for item in all_text_items:
    if any(field in item["text"] for field in tax_fields):
        print(f"\n'{item['text']}'")
        print(f"  X: {item['x']:.2f}")
        print(f"  Y (baseline): {item['y']:.2f}")
        print(f"  Y (top): {item['y_top']:.2f}")
        print(f"  Font size: {item['size']:.2f}pt")

print("\n### AMOUNT IN WORDS (using baseline Y) ###")
for item in all_text_items:
    if "INR" in item["text"] and "ONLY" in item["text"]:
        print(f"\n'{item['text'][:60]}...'")
        print(f"  X: {item['x']:.2f}")
        print(f"  Y (baseline): {item['y']:.2f}")
        print(f"  Y (top): {item['y_top']:.2f}")
        print(f"  Font size: {item['size']:.2f}pt")

# Calculate line heights
print("\n### LINE HEIGHT CALCULATION ###")
print(f"Row 1 baseline Y: ~271")
print(f"Row 2 baseline Y: ~287")
print(f"Line height: ~16 points")

doc.close()
