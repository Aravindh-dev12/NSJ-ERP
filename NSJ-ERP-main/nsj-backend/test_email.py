#!/usr/bin/env python
"""
Quick email test script
Run this to test if email configuration is working
"""

import os
import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=" * 60)
print("EMAIL CONFIGURATION TEST")
print("=" * 60)

print("\n1. Checking email settings...")
print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(
    f"   EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}"
)
print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

print("\n2. Checking recipient configuration...")
recipient = os.getenv("DAILY_REPORT_RECIPIENTS", "")
print(f"   DAILY_REPORT_RECIPIENTS: {recipient}")

if not recipient:
    print("\n❌ ERROR: DAILY_REPORT_RECIPIENTS not set in .env file!")
    print("   Please add: DAILY_REPORT_RECIPIENTS=your-email@example.com")
    exit(1)

if not settings.EMAIL_HOST_USER:
    print("\n❌ ERROR: EMAIL_HOST_USER not set in .env file!")
    print("   Please add: EMAIL_HOST_USER=your-email@gmail.com")
    exit(1)

if not settings.EMAIL_HOST_PASSWORD:
    print("\n❌ ERROR: EMAIL_HOST_PASSWORD not set in .env file!")
    print("   Please add: EMAIL_HOST_PASSWORD=your-app-password")
    exit(1)

print("\n3. Attempting to send test email...")
print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
print(f"   To: {recipient}")

try:
    result = send_mail(
        subject="Test Email from NSJ ERP",
        message="This is a test email to verify your email configuration is working correctly.\n\nIf you receive this, your email setup is successful!",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )

    print("\n✅ SUCCESS! Test email sent successfully!")
    print(f"   Result: {result} email(s) sent")
    print(f"\n📧 Check your inbox at: {recipient}")
    print("   (Also check spam/junk folder)")

except Exception as e:
    print("\n❌ ERROR: Failed to send test email")
    print(f"   Error: {e}")
    print("\n   Common issues:")
    print("   - Wrong email or password")
    print("   - Need to use App Password (not regular password)")
    print("   - 2-Step Verification not enabled on Gmail")
    print("   - Firewall blocking port 587")

    import traceback

    print("\n   Full error:")
    traceback.print_exc()

print("\n" + "=" * 60)
