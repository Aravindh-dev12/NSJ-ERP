"""
Extract ALL coordinates from original template to map exact positions
"""

import fitz

template_path = "Satyam Jewellery-Invoice-2026.pdf"
doc = fitz.open(template_path)
page = doc[0]

print(f"Page size: {page.rect.width} x {page.rect.height}\n")
print("=" * 80)
print("COMPLETE COORDINATE MAPPING")
print("=" * 80)

# Get all text with positions
text_dict = page.get_text("dict")

# Organize by sections
buyer_section = []
invoice_section = []
table_data = []
tax_section = []
amount_words = []

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                x, y = bbox[0], bbox[1]
                size = span.get("size", 0)

                if not text:
                    continue

                # Categorize
                if "SATYAM JEWELLERS" in text or "624, BANK ROAD" in text:
                    buyer_section.append((text, x, y, size))
                elif "03/01/2026" in text or text == "28":
                    invoice_section.append((text, x, y, size))
                elif "18K GOLD" in text or "GMS" in text or "11,135" in text or "20,157" in text:
                    table_data.append((text, x, y, size))
                elif "IGST" in text or "Round off" in text or text == "TOTAL":
                    tax_section.append((text, x, y, size))
                elif "INR" in text and "ONLY" in text:
                    amount_words.append((text, x, y, size))

print("\n### BUYER SECTION (Customer Details) ###")
for text, x, y, size in buyer_section:
    print(f"'{text}'")
    print(f"  x={x:.1f}, y={y:.1f}, size={size:.1f}pt\n")

print("\n### INVOICE SECTION (Date, Number) ###")
for text, x, y, size in invoice_section:
    print(f"'{text}'")
    print(f"  x={x:.1f}, y={y:.1f}, size={size:.1f}pt\n")

print("\n### TABLE DATA (Line Items) ###")
for text, x, y, size in table_data[:10]:  # First 10
    print(f"'{text}'")
    print(f"  x={x:.1f}, y={y:.1f}, size={size:.1f}pt\n")

print("\n### TAX SECTION ###")
for text, x, y, size in tax_section:
    print(f"'{text}'")
    print(f"  x={x:.1f}, y={y:.1f}, size={size:.1f}pt\n")

print("\n### AMOUNT IN WORDS ###")
for text, x, y, size in amount_words:
    print(f"'{text[:50]}...'")
    print(f"  x={x:.1f}, y={y:.1f}, size={size:.1f}pt\n")

# Now extract specific fields we need
print("\n" + "=" * 80)
print("FIELD-BY-FIELD COORDINATE MAP")
print("=" * 80)

all_spans = []
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                if text:
                    all_spans.append(
                        {
                            "text": text,
                            "x": bbox[0],
                            "y": bbox[1],
                            "x2": bbox[2],
                            "y2": bbox[3],
                            "size": span.get("size", 0),
                        }
                    )

# Sort by Y position
all_spans.sort(key=lambda s: (s["y"], s["x"]))

# Find specific fields
fields_to_find = {
    "Customer Name": "SATYAM JEWELLERS",
    "Customer Address": "624, BANK ROAD",
    "Customer GSTIN": "03AEFPG4541P1ZH",
    "Customer State": "Panjab",
    "Invoice Date": "03/01/2026",
    "Invoice Number": "28",
    "Place of Supply": "03 (Punjab)",
    "Item 1 Desc": "18K GOLD JEWELLERY",
    "Item 1 Qty": "4.910 GMS",
    "Item 1 Rate": "11,135.00",
    "Item 1 Amount": "54,672.85",
    "Item 2 Qty": "1.650 GMS",
    "Item 2 Rate": "20,157.58",
    "Item 2 Amount": "3,260.01",
    "IGST Label": "IGST - Output",
    "IGST Rate": "3",
    "IGST Amount": "2,637.99",
    "Round off": "Round off",
    "Total Label": "TOTAL",
    "Amount Words 1": "INR TEN LAKH",
}

print("\n### EXACT COORDINATES FOR EACH FIELD ###\n")
for field_name, search_text in fields_to_find.items():
    for span in all_spans:
        if search_text in span["text"]:
            print(f"{field_name}:")
            print(f"  Text: '{span['text']}'")
            print(f"  Position: x={span['x']:.1f}, y={span['y']:.1f}")
            print(f"  Font size: {span['size']:.1f}pt")
            print()
            break

doc.close()
