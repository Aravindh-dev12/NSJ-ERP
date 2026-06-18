"""
Test script for daily report email with CTA links.
Run this from nsj-backend/nsj-backend directory:
python test_daily_report_cta.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from vouchers.models import DailyReport
from vouchers.email_utils import (
    extract_task_references,
    generate_task_links,
    send_daily_report_email,
)
from users.models import User
from django.utils import timezone


def test_extract_task_references():
    """Test task reference extraction."""
    print("\n" + "=" * 60)
    print("TEST 1: Extract Task References")
    print("=" * 60)

    test_cases = [
        "Completed 3D design for NSJ-0102",
        "Processed diamond batch for order NSJ-0103 and NSJ-0104",
        "Finished metal issue for TASK-001 and JOB-ABC123",
        "Working on NSJ-0102, NSJ-0103, and ORDER-456",
        "No task references here",
    ]

    for text in test_cases:
        refs = extract_task_references(text)
        print(f"\nText: {text}")
        print(f"Found: {refs}")


def test_generate_task_links():
    """Test CTA link generation."""
    print("\n" + "=" * 60)
    print("TEST 2: Generate Task Links")
    print("=" * 60)

    task_refs = ["NSJ-0102", "TASK-001", "JOB-ABC123"]
    user = User.objects.first()

    if user:
        html = generate_task_links(task_refs, user)
        print(f"\nGenerated HTML ({len(html)} chars):")
        print(html[:500] + "..." if len(html) > 500 else html)
    else:
        print("\nNo user found - skipping")


def test_send_email_with_cta():
    """Test sending actual email with CTA links."""
    print("\n" + "=" * 60)
    print("TEST 3: Send Email with CTA Links")
    print("=" * 60)

    # Get first user
    user = User.objects.first()
    if not user:
        print("ERROR: No users found in database")
        return

    print(f"Using user: {user.username}")

    # Create a test report with task references in summary
    report = DailyReport(
        company=user.company,
        user=user,
        date=timezone.now().date(),
        tasks_completed=3,
        tasks_pending=2,
        orders_processed=5,
        materials_issued=10,
        summary="""Completed 3D design for order NSJ-0102
Processed diamond batch for NSJ-0103
Finished metal issue for NSJ-0104
Started work on TASK-001 and JOB-ABC123""",
        challenges="Delayed approval from QC, Supplier delivery issue",
        next_day_plan="Complete remaining tasks and start new orders",
        is_submitted=True,
        submitted_at=timezone.now(),
    )

    # Don't save to database - just use for email
    print("\nTest Report Summary:")
    print(report.summary)

    # Extract task references
    refs = extract_task_references(report.summary)
    print(f"\nExtracted Task References: {refs}")

    # Get recipient emails
    recipient_emails_str = os.getenv("DAILY_REPORT_RECIPIENTS", "")
    recipient_emails = [email.strip() for email in recipient_emails_str.split(",") if email.strip()]

    if not recipient_emails:
        print("\nERROR: No DAILY_REPORT_RECIPIENTS configured in .env")
        print("Please set DAILY_REPORT_RECIPIENTS in your .env file")
        return

    print(f"\nRecipient emails: {recipient_emails}")

    # Confirm before sending
    response = input("\nSend test email? (yes/no): ")
    if response.lower() != "yes":
        print("Email sending cancelled")
        return

    # Send email
    print("\nSending email...")
    success = send_daily_report_email(report, user, recipient_emails)

    if success:
        print("\n✓ SUCCESS: Email sent successfully!")
        print("\nCheck your inbox for:")
        print("- Professional email template with gradient header")
        print("- Metrics grid showing task counts")
        print("- CTA buttons linking to tasks (NSJ-0102, NSJ-0103, etc.)")
        print("- Each button should link to frontend with search parameter")
    else:
        print("\n✗ FAILED: Email sending failed")
        print("Check the error messages above")


def main():
    print("\n" + "=" * 60)
    print("DAILY REPORT EMAIL CTA TESTING")
    print("=" * 60)

    # Check environment
    frontend_url = os.getenv("FRONTEND_URL")
    print(f"\nFRONTEND_URL: {frontend_url or '(not set - will use default)'}")

    recipients = os.getenv("DAILY_REPORT_RECIPIENTS")
    print(f"DAILY_REPORT_RECIPIENTS: {recipients or '(not set)'}")

    # Run tests
    test_extract_task_references()
    test_generate_task_links()
    test_send_email_with_cta()

    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
