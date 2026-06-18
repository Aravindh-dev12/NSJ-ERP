import fitz


def get_pixel_color(pdf_path, x, y):
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        pix = page.get_pixmap()
        # Ensure we are within bounds
        if x < 0 or x >= pix.width or y < 0 or y >= pix.height:
            print(f"Error: Coordinates ({x}, {y}) out of bounds")
            return None

        # Get pixel RGB
        r, g, b = pix.pixel(int(x), int(y))
        print(
            f"Pixel at ({x}, {y}): RGB=({r}, {g}, {b}) -> Normalized=({r / 255.0:.3f}, {g / 255.0:.3f}, {b / 255.0:.3f})"
        )
        return (r, g, b)
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    pdf_path = "vouchers/Satyam Jewellery-Invoice-2026.pdf"
    # Customer name area (Top-Left quadrant of the beige block)
    # Approx coords based on previous analysis: X=113.5+, Y=190+
    # Let's check a safe spot inside the customer box
    get_pixel_color(pdf_path, 130, 210)

    # Invoice Date area (Top-Right quadrant)
    # Approx coords: X=480+, Y=190+
    get_pixel_color(pdf_path, 500, 210)
