"""Extract text colors from the template to match formatting"""

import fitz

doc = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
page = doc[0]
text_dict = page.get_text("dict")

print("TEXT COLORS IN TEMPLATE\n")
print("=" * 80)

# Collect unique colors with examples
colors_found = {}

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                color = span.get("color", 0)

                if text and len(text) > 2:
                    if color not in colors_found:
                        colors_found[color] = []
                    if len(colors_found[color]) < 3:  # Keep 3 examples per color
                        colors_found[color].append(text)

# Convert color integer to RGB
for color_int, examples in sorted(colors_found.items()):
    # Extract RGB from integer
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF

    # Normalize to 0-1 range
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0

    print(f"\nColor: RGB({r}, {g}, {b}) = ({r_norm:.3f}, {g_norm:.3f}, {b_norm:.3f})")
    print(f"Examples: {examples[:3]}")

# Check specific fields
print("\n" + "=" * 80)
print("SPECIFIC FIELD COLORS")
print("=" * 80)

fields_to_check = [
    "BUYER (BILL TO):",
    "SATYAM JEWELLERS",
    "DATED",
    "03/01/2026",
    "INVOICE NO.",
    "28",
    "DESCRIPTION OF GOODS",
    "18K GOLD JEWELLERY",
    "IGST - Output",
]

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if any(field in text for field in fields_to_check):
                    color = span.get("color", 0)
                    r = (color >> 16) & 0xFF
                    g = (color >> 8) & 0xFF
                    b = color & 0xFF
                    print(f"\n'{text}'")
                    print(f"  RGB: ({r}, {g}, {b}) = ({r / 255:.3f}, {g / 255:.3f}, {b / 255:.3f})")

doc.close()
