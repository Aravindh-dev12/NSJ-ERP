import fitz
import os

template_path = "Satyam Jewellery-Invoice-2026.pdf"

if not os.path.exists(template_path):
    print("Template not found!")
    exit(1)

doc = fitz.open(template_path)
page = doc[0]

# Find vertical lines
drawings = page.get_drawings()
vertical_lines = []

for shape in drawings:
    for item in shape["items"]:
        if item[0] == "l":  # Line
            p1 = item[1]
            p2 = item[2]
            # Check if vertical (x coordinates match or very close)
            if abs(p1.x - p2.x) < 2 and abs(p1.y - p2.y) > 10:
                # Store x coordinate and range of y
                vertical_lines.append({"x": p1.x, "y_range": (min(p1.y, p2.y), max(p1.y, p2.y))})

# Filter lines relevant to the table area (approx y=260-700)
table_lines = [l for l in vertical_lines if l["y_range"][0] < 300 and l["y_range"][1] > 300]
# Sort by X
table_lines.sort(key=lambda l: l["x"])

print("Vertical Table Lines found at X coordinates:")
for line in table_lines:
    print(f"X={line['x']:.2f} (Y Range: {line['y_range'][0]:.1f}-{line['y_range'][1]:.1f})")
