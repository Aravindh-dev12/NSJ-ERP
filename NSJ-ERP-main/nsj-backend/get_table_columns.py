"""Get exact table column positions"""

import fitz

doc = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
page = doc[0]
text_dict = page.get_text("dict")

print("TABLE COLUMN POSITIONS\n")
print("=" * 80)

# Look for row 1 data (y around 263-265)
row1_y = 263.8
row2_y = 279.5

print(f"\nROW 1 (y={row1_y}):")
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                y = span.get("bbox")[1]
                if abs(y - row1_y) < 2:
                    text = span.get("text", "").strip()
                    x = span.get("bbox")[0]
                    if text:
                        print(f"  '{text}' at x={x:.1f}")

print(f"\nROW 2 (y={row2_y}):")
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                y = span.get("bbox")[1]
                if abs(y - row2_y) < 2:
                    text = span.get("text", "").strip()
                    x = span.get("bbox")[0]
                    if text:
                        print(f"  '{text}' at x={x:.1f}")

# Get column headers
print(f"\nCOLUMN HEADERS (y around 246):")
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                y = span.get("bbox")[1]
                if abs(y - 246.5) < 2:
                    text = span.get("text", "").strip()
                    x = span.get("bbox")[0]
                    if text and text not in ["(PER)"]:
                        print(f"  '{text}' at x={x:.1f}")

doc.close()
