"""
Extract EXACT coordinates from the original template PDF
This will show us where each piece of sample data is located
"""

import fitz  # PyMuPDF

template_path = "Satyam Jewellery-Invoice-2026.pdf"
doc = fitz.open(template_path)
page = doc[0]

print(f"Page size: {page.rect.width} x {page.rect.height}\n")
print("=" * 80)
print("EXACT COORDINATES OF SAMPLE DATA")
print("=" * 80)

# Get all text with exact positions
text_dict = page.get_text("dict")

# Sample data we're looking for
sample_data_to_find = [
    "aryan",
    "Mumbai",
    "Maharashtra, Code: 27",
    "abc",
    "₹ 11,135.00",
    "₹ 20,157.58",
    "GMS",
    "0.116 GMS",
    "1,000,000.00",
    "IGST - Output",
    "Round off",
    "TOTAL",
    "3",
    "3.0%",
    "1.5",
    "INR ONE LAKH NINETEEN THOUSAND",
]

found_coords = {}

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:  # Text block
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                bbox = span.get("bbox")
                font_size = span.get("size", 0)

                # Check if this is sample data we care about
                for sample in sample_data_to_find:
                    if sample.lower() in text.lower():
                        if sample not in found_coords:
                            found_coords[sample] = []
                        found_coords[sample].append(
                            {
                                "text": text,
                                "x": bbox[0],
                                "y": bbox[1],
                                "x2": bbox[2],
                                "y2": bbox[3],
                                "font_size": font_size,
                            }
                        )

# Print organized results
print("\n### BUYER SECTION ###")
for key in ["aryan", "Mumbai"]:
    if key in found_coords:
        for coord in found_coords[key]:
            print(f"{key}:")
            print(f"  Position: x={coord['x']:.1f}, y={coord['y']:.1f}")
            print(f"  Font size: {coord['font_size']:.1f}pt")
            print()

print("\n### STATE SECTION ###")
for key in ["Maharashtra, Code: 27"]:
    if key in found_coords:
        for coord in found_coords[key]:
            print(f"{key}:")
            print(f"  Position: x={coord['x']:.1f}, y={coord['y']:.1f}")
            print(f"  Font size: {coord['font_size']:.1f}pt")
            print()

print("\n### TABLE DATA ###")
for key in ["abc", "₹ 11,135.00", "₹ 20,157.58", "GMS", "0.116 GMS"]:
    if key in found_coords:
        for coord in found_coords[key]:
            print(f"{key}:")
            print(f"  Position: x={coord['x']:.1f}, y={coord['y']:.1f}")
            print(f"  Font size: {coord['font_size']:.1f}pt")
            print()

print("\n### TAX SECTION ###")
for key in ["IGST - Output", "Round off", "TOTAL", "3", "3.0%", "1.5"]:
    if key in found_coords:
        for coord in found_coords[key]:
            print(f"'{key}':")
            print(f"  Position: x={coord['x']:.1f}, y={coord['y']:.1f}")
            print(f"  Font size: {coord['font_size']:.1f}pt")
            print()

print("\n### AMOUNT IN WORDS ###")
for key in ["INR ONE LAKH NINETEEN THOUSAND"]:
    if key in found_coords:
        for coord in found_coords[key]:
            print(f"{key}:")
            print(f"  Position: x={coord['x']:.1f}, y={coord['y']:.1f}")
            print(f"  Font size: {coord['font_size']:.1f}pt")
            print()

# Also extract ALL text to see structure
print("\n" + "=" * 80)
print("ALL TEXT IN ORDER (for reference)")
print("=" * 80)

all_text = []
for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            line_text = ""
            y_pos = None
            for span in line.get("spans", []):
                line_text += span.get("text", "")
                if y_pos is None:
                    y_pos = span.get("bbox")[1]
            if line_text.strip():
                all_text.append((y_pos, line_text.strip()))

# Sort by y position
all_text.sort(key=lambda x: x[0])

for y, text in all_text[:50]:  # First 50 lines
    print(f"y={y:.1f}: {text}")

doc.close()
