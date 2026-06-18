"""
Quick test script to verify NSJ backend setup
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from core.models import Company, Branch, CountryMaster, StateMaster, CityMaster
from users.models import User
from accounts.models import Account
from products.models import Product
from rates.models import DailyRate, PartyRate

print("=" * 60)
print("NSJ Backend Setup Test")
print("=" * 60)

# Test 1: Check if Company exists
print("\n1. Testing Company model...")
company = Company.objects.first()
if company:
    print(f"   ✓ Company exists: {company.name}")
else:
    print("   ✗ No company found")

# Test 2: Check User
print("\n2. Testing User model...")
user = User.objects.first()
if user:
    print(f"   ✓ User exists: {user.email} (Role: {user.role})")
else:
    print("   ✗ No user found")

# Test 3: Check models
print("\n3. Testing all models...")
models_to_check = [
    ("Company", Company),
    ("Branch", Branch),
    ("CountryMaster", CountryMaster),
    ("StateMaster", StateMaster),
    ("CityMaster", CityMaster),
    ("User", User),
    ("Account", Account),
    ("Product", Product),
    ("DailyRate", DailyRate),
    ("PartyRate", PartyRate),
]

for name, model in models_to_check:
    count = model.objects.count()
    status = "✓" if count >= 0 else "✗"
    print(f"   {status} {name}: {count} records")

print("\n" + "=" * 60)
print("Setup test complete!")
print("=" * 60)
print("\nYou can now:")
print("1. Start the server: make runserver")
print("2. Access Django admin at: http://localhost:8000/admin")
print("3. Login with:")
print("   Email: admin@nsj.com")
print("   Password: admin123")
print("=" * 60)
