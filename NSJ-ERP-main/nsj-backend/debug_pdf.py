import fitz
import os

pdf_path = "Satyam Jewellery-Invoice-2026.pdf"
font_path = "arial_local.ttf"

print(f"Checking {pdf_path}...")
if os.path.exists(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        print(f"Page count: {len(doc)}")
        doc.close()
    except Exception as e:
        print(f"Error opening PDF: {e}")
else:
    print("PDF not found!")

print(f"\nChecking {font_path}...")
if os.path.exists(font_path):
    print("Font file exists.")
else:
    print("Font file MISSING!")
