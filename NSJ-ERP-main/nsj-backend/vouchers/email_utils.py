"""
Email utilities for sending formatted daily reports with CTA links.
"""

import re
import os
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from datetime import datetime


def extract_task_references(text):
    """
    Extract task/order references from text.
    Looks for patterns like: NSJ-0102, NSJ-XXXX, Order NSJ-0102, etc.

    Args:
        text: Text to search for task references

    Returns:
        list: List of unique task references found
    """
    if not text:
        return []

    # Pattern to match NSJ-XXXX or similar order/task IDs
    patterns = [
        r"NSJ-\d+",  # NSJ-0102
        r"JOB-[A-Z0-9]+",  # JOB-ABC123
        r"TASK-\d+",  # TASK-001
        r"ORDER-\d+",  # ORDER-001
    ]

    found_refs = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_refs.extend(matches)

    # Remove duplicates while preserving order
    unique_refs = []
    seen = set()
    for ref in found_refs:
        ref_upper = ref.upper()
        if ref_upper not in seen:
            seen.add(ref_upper)
            unique_refs.append(ref_upper)

    return unique_refs


def get_frontend_url():
    """
    Get the frontend URL from environment or use default.

    Returns:
        str: Frontend base URL
    """
    frontend_url = os.getenv("FRONTEND_URL", "https://nsj-frontend-production.up.railway.app")
    # Remove trailing slash if present
    return frontend_url.rstrip("/")


def generate_task_links(task_refs, user):
    """
    Generate HTML for task CTA links.

    Args:
        task_refs: List of task reference strings
        user: User instance

    Returns:
        str: HTML string with CTA buttons
    """
    if not task_refs:
        return ""

    frontend_url = get_frontend_url()

    html = """
    <div class="section">
        <h2>🔗 Quick Links to Tasks</h2>
        <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
            Click below to view task details in the system:
        </p>
        <div class="cta-buttons">
    """

    for ref in task_refs:
        # Determine the link based on reference type
        if ref.startswith("NSJ-") or ref.startswith("ORDER-"):
            # Link to vouchers list page (orders)
            link_url = f"{frontend_url}/vouchers/list"
            button_text = f"View Order {ref}"
            icon = "📋"
        elif ref.startswith("TASK-"):
            # Link to tasks dashboard
            link_url = f"{frontend_url}/tasks/dashboard"
            button_text = f"View Task {ref}"
            icon = "✅"
        elif ref.startswith("JOB-"):
            # Link to vouchers list page (jobs)
            link_url = f"{frontend_url}/vouchers/list"
            button_text = f"View Job {ref}"
            icon = "🔧"
        else:
            # Generic link to vouchers
            link_url = f"{frontend_url}/vouchers/list"
            button_text = f"View {ref}"
            icon = "🔍"

        html += f"""
            <a href="{link_url}" class="cta-button">
                <span class="cta-icon">{icon}</span>
                <span class="cta-text">{button_text}</span>
                <span class="cta-arrow">→</span>
            </a>
        """

    html += """
        </div>
    </div>
    """

    return html


def format_daily_report_html(report, user):
    """
    Format a daily report as HTML for email with enhanced styling and CTA links.

    Args:
        report: DailyReport instance
        user: User instance

    Returns:
        str: HTML formatted report
    """

    # Get user name safely
    user_name = getattr(user, "name", None) or getattr(user, "username", "Unknown User")
    if user_name and not user_name.strip():
        user_name = getattr(user, "username", "Unknown User")

    # Get user department if available
    user_dept = getattr(user, "department", None)
    dept_display = user_dept.replace("_", " ").title() if user_dept else "N/A"

    # Handle date formatting - report.date might be string or date object
    try:
        if isinstance(report.date, str):
            report_date = datetime.strptime(report.date, "%Y-%m-%d").date()
        else:
            report_date = report.date
        date_display = report_date.strftime("%B %d, %Y")
    except Exception:
        date_display = str(report.date)

    # Handle submitted_at formatting
    try:
        if report.submitted_at:
            if isinstance(report.submitted_at, str):
                submitted_dt = datetime.fromisoformat(report.submitted_at.replace("Z", "+00:00"))
            else:
                submitted_dt = report.submitted_at
            time_display = submitted_dt.strftime("%I:%M %p")
        else:
            time_display = "N/A"
    except Exception:
        time_display = "N/A"

    # Extract task references from summary
    task_refs = extract_task_references(report.summary)
    task_links_html = generate_task_links(task_refs, user)

    # Get frontend URL for footer link
    frontend_url = get_frontend_url()

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .email-container {{
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #6B1C1C 0%, #8B2C2C 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                letter-spacing: -0.5px;
            }}
            .header .subtitle {{
                margin: 10px 0 0 0;
                opacity: 0.95;
                font-size: 16px;
            }}
            .header .meta {{
                margin: 15px 0 0 0;
                padding: 10px;
                background-color: rgba(255,255,255,0.1);
                border-radius: 4px;
                font-size: 14px;
            }}
            .content {{
                padding: 30px 20px;
            }}
            .section {{
                background-color: #fafafa;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                border-left: 4px solid #6B1C1C;
            }}
            .section h2 {{
                margin-top: 0;
                margin-bottom: 12px;
                color: #6B1C1C;
                font-size: 18px;
                font-weight: 600;
            }}
            .metrics {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            }}
            .metric {{
                background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                text-align: center;
            }}
            .metric-label {{
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                margin-bottom: 8px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }}
            .metric-value {{
                font-size: 32px;
                font-weight: bold;
                color: #6B1C1C;
                line-height: 1;
            }}
            .text-content {{
                background-color: white;
                padding: 15px;
                border-radius: 6px;
                margin-top: 10px;
                white-space: pre-wrap;
                border: 1px solid #e0e0e0;
                line-height: 1.8;
            }}
            .cta-buttons {{
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 15px;
            }}
            .cta-button {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                background: linear-gradient(135deg, #6B1C1C 0%, #8B2C2C 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                box-shadow: 0 2px 4px rgba(107, 28, 28, 0.2);
            }}
            .cta-icon {{
                font-size: 20px;
                margin-right: 12px;
            }}
            .cta-text {{
                flex: 1;
                text-align: left;
            }}
            .cta-arrow {{
                font-size: 18px;
                font-weight: bold;
            }}
            .footer {{
                background-color: #f0f0f0;
                padding: 20px;
                text-align: center;
                font-size: 13px;
                color: #666;
                border-top: 1px solid #ddd;
            }}
            .badge {{
                display: inline-block;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin: 10px 0;
            }}
            .badge-success {{
                background-color: #d4edda;
                color: #155724;
            }}
            .footer-link {{
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background-color: #6B1C1C;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>📊 DAILY WORK REPORT</h1>
                <div class="subtitle">{date_display} • {time_display}</div>
                <div class="meta">
                    <strong>Submitted by:</strong> {user_name}<br>
                    <strong>Department:</strong> {dept_display}
                </div>
            </div>
            
            <div class="content">
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">✅ Tasks Completed</div>
                        <div class="metric-value">{report.tasks_completed}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">⏳ Tasks Pending</div>
                        <div class="metric-value">{report.tasks_pending}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">📋 Orders Processed</div>
                        <div class="metric-value">{report.orders_processed}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">📦 Materials Issued</div>
                        <div class="metric-value">{report.materials_issued}</div>
                    </div>
                </div>
                
                {
        f'''
                <div class="section">
                    <h2>📝 Summary of Work Completed</h2>
                    <div class="text-content">{report.summary}</div>
                </div>
                '''
        if report.summary
        else ""
    }
                
                {task_links_html}
                
                {
        f'''
                <div class="section">
                    <h2>⚠️ Challenges Faced</h2>
                    <div class="text-content">{report.challenges}</div>
                </div>
                '''
        if report.challenges
        else ""
    }
                
                {
        f'''
                <div class="section">
                    <h2>🎯 Plan for Tomorrow</h2>
                    <div class="text-content">{report.next_day_plan}</div>
                </div>
                '''
        if report.next_day_plan
        else ""
    }
            </div>
            
            <div class="footer">
                <div>
                    <span class="badge badge-success">✓ SUBMITTED</span>
                </div>
                <p style="margin: 15px 0;">
                    This is an automated email from NSJ ERP System.<br>
                    Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
                </p>
                <a href="{frontend_url}/daily-reports" class="footer-link">
                    View All Daily Reports →
                </a>
            </div>
        </div>
    </body>
    </html>
    """
    return html


def format_daily_report_text(report, user):
    """
    Format a daily report as plain text for email with task links.

    Args:
        report: DailyReport instance
        user: User instance

    Returns:
        str: Plain text formatted report
    """

    # Get user name safely
    user_name = getattr(user, "name", None) or getattr(user, "username", "Unknown User")
    if user_name and not user_name.strip():
        user_name = getattr(user, "username", "Unknown User")

    # Get user department if available
    user_dept = getattr(user, "department", None)
    dept_display = user_dept.replace("_", " ").title() if user_dept else "N/A"

    # Handle date formatting
    try:
        if isinstance(report.date, str):
            report_date = datetime.strptime(report.date, "%Y-%m-%d").date()
        else:
            report_date = report.date
        date_display = report_date.strftime("%B %d, %Y")
    except Exception:
        date_display = str(report.date)

    # Handle submitted_at formatting
    try:
        if report.submitted_at:
            if isinstance(report.submitted_at, str):
                submitted_dt = datetime.fromisoformat(report.submitted_at.replace("Z", "+00:00"))
            else:
                submitted_dt = report.submitted_at
            time_display = submitted_dt.strftime("%I:%M %p")
        else:
            time_display = "N/A"
    except Exception:
        time_display = "N/A"

    # Extract task references
    task_refs = extract_task_references(report.summary)
    frontend_url = get_frontend_url()

    text = f"""
╔════════════════════════════════════════╗
║         DAILY WORK REPORT              ║
╚════════════════════════════════════════╝

Date: {date_display}
Time: {time_display}
Submitted by: {user_name}
Department: {dept_display}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METRICS
-------
✅ Tasks Completed: {report.tasks_completed}
⏳ Tasks Pending: {report.tasks_pending}
📋 Orders Processed: {report.orders_processed}
📦 Materials Issued: {report.materials_issued}

"""

    if report.summary:
        text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SUMMARY OF WORK COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{report.summary}

"""

    if task_refs:
        text += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 QUICK LINKS TO TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
        for ref in task_refs:
            if ref.startswith("NSJ-") or ref.startswith("ORDER-"):
                link_url = f"{frontend_url}/vouchers/list"
                text += f"📋 View Order {ref}\n   {link_url}\n\n"
            elif ref.startswith("TASK-"):
                link_url = f"{frontend_url}/tasks/dashboard"
                text += f"✅ View Task {ref}\n   {link_url}\n\n"
            elif ref.startswith("JOB-"):
                link_url = f"{frontend_url}/vouchers/list"
                text += f"🔧 View Job {ref}\n   {link_url}\n\n"

    if report.challenges:
        text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CHALLENGES FACED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{report.challenges}

"""

    if report.next_day_plan:
        text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PLAN FOR TOMORROW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{report.next_day_plan}

"""

    text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more details, log in to the system:
{frontend_url}/daily-reports

---
This is an automated email from NSJ ERP System.
Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
"""

    return text


def send_daily_report_email(report, user, recipient_emails):
    """
    Send a daily report via email with CTA links.

    Args:
        report: DailyReport instance
        user: User instance
        recipient_emails: List of email addresses to send to

    Returns:
        bool: True if email sent successfully, False otherwise
    """

    print("[EMAIL UTIL] send_daily_report_email called")
    print(f"[EMAIL UTIL] Report ID: {report.id}")

    # Get user name safely
    user_name = getattr(user, "name", None) or getattr(user, "username", "Unknown User")
    if user_name and not user_name.strip():
        user_name = getattr(user, "username", "Unknown User")

    print(f"[EMAIL UTIL] User: {user_name}")
    print(f"[EMAIL UTIL] Recipients: {recipient_emails}")

    if not recipient_emails:
        print("[EMAIL UTIL] No recipient emails provided")
        return False

    # Filter out empty emails
    recipient_emails = [email for email in recipient_emails if email and email.strip()]
    if not recipient_emails:
        print("[EMAIL UTIL] No valid recipient emails after filtering")
        return False

    print(f"[EMAIL UTIL] Valid recipients: {recipient_emails}")

    # Handle date formatting - report.date might be string or date object
    try:
        if isinstance(report.date, str):
            report_date = datetime.strptime(report.date, "%Y-%m-%d").date()
        else:
            report_date = report.date
        date_str = report_date.strftime("%B %d, %Y")
    except Exception as e:
        print(f"[EMAIL UTIL] Date formatting error: {e}")
        date_str = str(report.date)

    subject = f"Daily Report - {user_name} - {date_str}"
    print(f"[EMAIL UTIL] Subject: {subject}")

    # Generate HTML and text versions
    print("[EMAIL UTIL] Generating HTML content...")
    try:
        html_content = format_daily_report_html(report, user)
        print(f"[EMAIL UTIL] HTML content generated ({len(html_content)} chars)")
    except Exception as e:
        print(f"[EMAIL UTIL ERROR] Failed to generate HTML content: {e}")
        import traceback

        traceback.print_exc()
        return False

    print("[EMAIL UTIL] Generating text content...")
    try:
        text_content = format_daily_report_text(report, user)
        print(f"[EMAIL UTIL] Text content generated ({len(text_content)} chars)")
    except Exception as e:
        print(f"[EMAIL UTIL ERROR] Failed to generate text content: {e}")
        import traceback

        traceback.print_exc()
        return False

    # Create email
    print("[EMAIL UTIL] Creating email message...")
    print(f"[EMAIL UTIL] From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"[EMAIL UTIL] To: {recipient_emails}")

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipient_emails,
        )

        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        print("[EMAIL UTIL] Email message created, attempting to send...")

        result = email.send(fail_silently=False)
        print(f"[EMAIL UTIL] Email send result: {result}")
        print("[EMAIL UTIL SUCCESS] Email sent successfully!")
        return True
    except Exception as e:
        print(f"[EMAIL UTIL ERROR] Failed to send daily report email: {e}")
        import traceback

        traceback.print_exc()
        return False
