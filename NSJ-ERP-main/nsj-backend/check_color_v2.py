import fitz
import os

pdf_path = (
    r"c:/Users/Aryan/OneDrive/Desktop/nsj/nsj-backend/nsj-backend/Satyam Jewellery-Invoice-2026.pdf"
)

if not os.path.exists(pdf_path):
    print(f"Error: {pdf_path} does not exist")
    exit(1)

try:
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap()

    with open("results.txt", "w", encoding="utf-8") as f:

        def check_region(x_start, y_start, width, height, label):
            f.write(f"\n--- Checking {label} ---\\n")
            colors = {}
            for y in range(
                int(y_start), int(y_start + height), 3
            ):  # Check every 3rd pixel for speed
                for x in range(int(x_start), int(x_start + width), 3):
                    try:
                        r, g, b = pix.pixel(x, y)
                        color = (r, g, b)
                        colors[color] = colors.get(color, 0) + 1
                    except:
                        pass

            # Most common color
            if colors:
                most_common = max(colors, key=colors.get)
                r, g, b = most_common
                norm = (r / 255.0, g / 255.0, b / 255.0)
                f.write(
                    f"Most common color in {label}: RGB=({r}, {g}, {b}) -> Normalized=({norm[0]:.3f}, {norm[1]:.3f}, {norm[2]:.3f})\\n"
                )
                f.write(f"Count: {colors[most_common]}\\n")
                # Print other colors if significant
                sorted_colors = sorted(colors.items(), key=lambda kv: kv[1], reverse=True)
                for col, count in sorted_colors[:5]:
                    if col != most_common:
                        nr, ng, nb = col
                        f.write(f"Alternative: ({nr}, {ng}, {nb}) -> count {count}\\n")
            else:
                f.write(f"No valid pixels found in {label}\\n")

        # Check Customer Area (Beige)
        # X: 115-400 (approx), Y: 180-240
        check_region(120, 190, 200, 40, "Customer Section")

        # Check Invoice Details Area (Beige)
        # X: 480-550 (approx), Y: 180-240
        check_region(490, 190, 60, 40, "Invoice Details Section")

        # Check Total Row Area (Beige)
        # X: 120-400, Y: 545-555
        check_region(120, 545, 200, 10, "Total Row Section")

        f.write("Done.\\n")

except Exception as e:
    print(f"Error analyzing PDF: {e}")
