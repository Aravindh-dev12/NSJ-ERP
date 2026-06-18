"""
Script to extract exact coordinates from the invoice template PDF
This will help us map data correctly
"""

import fitz  # PyMuPDF

# Open the template
template_path = "Satyam Jewellery-Invoice-2026.pdf"
doc = fitz.open(template_path)
page = doc[0]

# Get all text with positions
text_dict = page.get_text("dict")

print("=== TEMPLATE TEXT ANALYSIS ===\n")
print(f"Page size: {page.rect.width} x {page.rect.height}\n")

# Extract all text blocks with coordinates
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:  # Text block
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                if text and bbox:
                    print(f"Text: '{text}'")
                    print(f"  Position: x={bbox[0]:.1f}, y={bbox[1]:.1f}")
                    print(f"  Size: {span.get('size', 0):.1f}pt")
                    print()

doc.close()
