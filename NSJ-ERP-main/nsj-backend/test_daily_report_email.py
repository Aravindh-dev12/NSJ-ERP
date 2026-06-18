#!/usr/bin/env python
"""
Test daily report email functionality
Run this to test if daily report emails work correctly
"""

import os
import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from vouchers.email_utils import (
    send_daily_report_email,
    format_daily_report_html,
    format_daily_report_text,
)
from vouchers.models import DailyReport
from users.models import User
from core.models import Company
from django.utils import timezone

print("=" * 60)
print("DAILY REPORT EMAIL TEST")
print("=" * 60)

# Get or create test data
print("\n1. Setting up test data...")

try:
    # Get first company
    company = Company.objects.first()
    if not company:
        print("   ❌ No company found in database")
        exit(1)
    print(f"   ✓ Company: {company.name}")

    # Get first user
    user = User.objects.filter(company=company).first()
    if not user:
        print("   ❌ No user found in database")
        exit(1)
    print(f"   ✓ User: {user.name} ({user.email})")

    # Create or get test report
    report, created = DailyReport.objects.get_or_create(
        company=company,
        user=user,
        date=timezone.now().date(),
        defaults={
            "tasks_completed": 5,
            "tasks_pending": 3,
            "orders_processed": 12,
            "materials_issued": 8,
            "summary": "Completed all priority tasks for the day. Processed customer orders efficiently.",
            "challenges": "Minor delay in material delivery from supplier.",
            "next_day_plan": "Focus on pending orders and follow up with supplier.",
            "is_submitted": True,
            "submitted_at": timezone.now(),
        },
    )

    if created:
        print("   ✓ Created test report")
    else:
        print("   ✓ Using existing report")

    print("\n2. Report Details:")
    print(f"   Date: {report.date}")
    print(f"   Tasks Completed: {report.tasks_completed}")
    print(f"   Tasks Pending: {report.tasks_pending}")
    print(f"   Orders Processed: {report.orders_processed}")
    print(f"   Materials Issued: {report.materials_issued}")

    # Get recipient
    recipient = os.getenv("DAILY_REPORT_RECIPIENTS", "").split(",")[0].strip()
    if not recipient:
        print("\n   ❌ ERROR: DAILY_REPORT_RECIPIENTS not set")
        exit(1)
    print(f"\n3. Recipient: {recipient}")

    # Test HTML formatting
    print("\n4. Testing HTML formatting...")
    try:
        html = format_daily_report_html(report, user)
        print(f"   ✓ HTML generated ({len(html)} chars)")
    except Exception as e:
        print(f"   ❌ HTML generation failed: {e}")
        import traceback

        traceback.print_exc()
        exit(1)

    # Test text formatting
    print("\n5. Testing text formatting...")
    try:
        text = format_daily_report_text(report, user)
        print(f"   ✓ Text generated ({len(text)} chars)")
    except Exception as e:
        print(f"   ❌ Text generation failed: {e}")
        import traceback

        traceback.print_exc()
        exit(1)

    # Send email
    print("\n6. Sending daily report email...")
    try:
        result = send_daily_report_email(report, user, [recipient])
        if result:
            print("   ✅ SUCCESS! Daily report email sent!")
            print(f"\n📧 Check your inbox at: {recipient}")
            print(f"   Subject: Daily Report - {user.name} - {report.date.strftime('%B %d, %Y')}")
        else:
            print("   ❌ Email sending returned False")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
        exit(1)

except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    import traceback

    traceback.print_exc()
    exit(1)

print("\n" + "=" * 60)
