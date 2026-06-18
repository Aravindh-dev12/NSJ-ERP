"""
Verify if the clean template actually has no sample data
"""

import fitz

doc = fitz.open("Satyam Jewellery-Invoice-2026-CLEAN.pdf")
page = doc[0]

# Get all text
text_dict = page.get_text("dict")

# Sample data that should NOT be in clean template
sample_data = [
    "aryan",
    "Mumbai",
    "Maharashtra",
    "SATYAM JEWELLERS",
    "624, BANK ROAD",
    "03AEFPG4541P1ZH",
    "Panjab",
    "03/01/2026",
    "28",
    "03 (Punjab)",
    "18K GOLD JEWELLERY",
    "4.910 GMS",
    "11,135.00",
    "54,672.85",
    "IGST - Output",
    "Round off",
    "INR TEN LAKH",
]

print("Checking clean template for sample data...\n")
print("=" * 80)

found_sample_data = []

for block in text_dict.get("blocks", []):
    if block.get("type") == 0:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                for sample in sample_data:
                    if sample.lower() in text.lower():
                        found_sample_data.append(text)
                        print(f"❌ FOUND SAMPLE DATA: '{text}'")

if not found_sample_data:
    print("✅ Clean template is truly clean - NO sample data found!")
else:
    print(f"\n❌ Found {len(found_sample_data)} instances of sample data")
    print("Clean template needs to be regenerated!")

doc.close()
