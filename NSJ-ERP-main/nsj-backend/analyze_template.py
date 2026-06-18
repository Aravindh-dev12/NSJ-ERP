import fitz
import os

doc = fitz.open("Satyam Jewellery-Invoice-2026.pdf")
page = doc[0]
drawings = page.get_drawings()
vlines, hlines = [], []

for shape in drawings:
    for item in shape["items"]:
        if item[0] == "l":
            p1, p2 = item[1], item[2]
            if abs(p1.x - p2.x) < 2 and abs(p1.y - p2.y) > 10:
                vlines.append(
                    (round(p1.x, 2), round(min(p1.y, p2.y), 1), round(max(p1.y, p2.y), 1))
                )
            if abs(p1.y - p2.y) < 2 and abs(p1.x - p2.x) > 10:
                hlines.append(
                    (round(p1.y, 2), round(min(p1.x, p2.x), 1), round(max(p1.x, p2.x), 1))
                )

vlines = sorted(set(vlines))
hlines = sorted(set(hlines))

out = []
out.append("=== VERTICAL LINES (table area) ===")
for x, y1, y2 in vlines:
    if y1 < 600 and y2 > 250:
        out.append(f"  X={x:>8.2f}  Y: {y1:.1f} -> {y2:.1f}")

out.append("")
out.append("=== HORIZONTAL LINES (table area y=230-580) ===")
for y, x1, x2 in hlines:
    if 230 < y < 580:
        out.append(f"  Y={y:>8.2f}  X: {x1:.1f} -> {x2:.1f}")

out.append("")
out.append("=== ALL TEXT on page 1 (table area y=245-580) ===")
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for line in b["lines"]:
            for span in line["spans"]:
                sy = span["origin"][1]
                sx = span["origin"][0]
                if 245 < sy < 580:
                    out.append(f'  ({sx:.1f}, {sy:.1f}) size={span["size"]:.1f} "{span["text"]}"')

out.append("")
out.append("=== DRAWING COLORS for grid lines ===")
for shape in drawings:
    for item in shape["items"]:
        if item[0] == "l":
            p1, p2 = item[1], item[2]
            if abs(p1.x - p2.x) < 2 and abs(p1.y - p2.y) > 10:
                if 250 < min(p1.y, p2.y) < 260:
                    out.append(
                        f"  Vertical line at X={p1.x:.2f}: color={shape.get('color')}, width={shape.get('width')}"
                    )
                    break

with open("template_analysis.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("Done. Wrote template_analysis.txt")
doc.close()
