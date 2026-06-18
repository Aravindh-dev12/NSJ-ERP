#!/usr/bin/env python
"""
Comprehensive diagnostic script for NSJ issues:
1. Task notification creation
2. Account data visibility
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from tasks.models import Task, TaskNotification
from accounts.models import Account
from users.models import User
from core.models import Company
from datetime import date, timedelta

def diagnose_notifications():
    print("\n" + "=" * 60)
    print("1. NOTIFICATION SYSTEM DIAGNOSIS")
    print("=" * 60)
    
    # Check if signals are registered
    from django.db.models.signals import post_save, m2m_changed
    from tasks.signals import notify_task_assignment, notify_multiple_assignees
    
    print("\n📡 Signal Registration:")
    post_save_receivers = post_save._live_receivers(Task)
    m2m_receivers = m2m_changed._live_receivers(Task.assignees.through)
    
    print(f"  - post_save receivers for Task: {len(post_save_receivers)}")
    print(f"  - m2m_changed receivers for Task.assignees: {len(m2m_receivers)}")
    
    # Check existing notifications
    total_notifications = TaskNotification.objects.count()
    unread_notifications = TaskNotification.objects.filter(is_read=False).count()
    
    print(f"\n📊 Current Notification Stats:")
    print(f"  - Total notifications: {total_notifications}")
    print(f"  - Unread notifications: {unread_notifications}")
    
    # Check recent tasks
    recent_tasks = Task.objects.order_by('-created_at')[:5]
    print(f"\n📋 Recent Tasks (last 5):")
    for task in recent_tasks:
        notif_count = TaskNotification.objects.filter(task=task).count()
        print(f"  - {task.title[:50]}")
        print(f"    Created: {task.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"    Assigned to: {task.assigned_to.name if task.assigned_to else 'None'}")
        print(f"    Notifications: {notif_count}")
    
    # Test notification creation
    print(f"\n🧪 Testing Notification Creation:")
    company = Company.objects.first()
    niti = User.objects.filter(username="niti").first()
    sanjana = User.objects.filter(username="sanjana").first()
    
    if not all([company, niti, sanjana]):
        print("  ❌ Missing test data (company, niti, or sanjana)")
        return
    
    before_count = TaskNotification.objects.count()
    
    # Create test task
    test_task = Task.objects.create(
        company=company,
        title="DIAGNOSTIC TEST: Notification Check",
        description="Automated test to verify notification creation",
        deadline=date.today() + timedelta(days=1),
        urgency="HIGH",
        department="PRODUCTION",
        assigned_to=sanjana,
        created_by=niti,
        status="PENDING",
    )
    
    after_count = TaskNotification.objects.count()
    new_notifs = after_count - before_count
    
    print(f"  - Notifications before: {before_count}")
    print(f"  - Notifications after: {after_count}")
    print(f"  - New notifications: {new_notifs}")
    
    task_notifs = TaskNotification.objects.filter(task=test_task)
    print(f"  - Notifications for test task: {task_notifs.count()}")
    for notif in task_notifs:
        print(f"    → {notif.user.name}: {notif.message}")
    
    # Cleanup
    test_task.delete()
    
    if new_notifs >= 2:
        print("\n  ✅ Notifications working correctly!")
    else:
        print("\n  ❌ Notifications NOT working - check signals!")

def diagnose_accounts():
    print("\n" + "=" * 60)
    print("2. ACCOUNT DATA DIAGNOSIS")
    print("=" * 60)
    
    # Check company
    companies = Company.objects.all()
    print(f"\n🏢 Companies in database: {companies.count()}")
    for company in companies:
        print(f"  - {company.name} (ID: {company.id})")
    
    # Check accounts
    total_accounts = Account.objects.count()
    print(f"\n📇 Total Accounts: {total_accounts}")
    
    # Check accounts by company
    for company in companies:
        company_accounts = Account.objects.filter(company=company)
        print(f"\n  Company: {company.name}")
        print(f"  Accounts: {company_accounts.count()}")
        
        # Show first 5 accounts
        for account in company_accounts[:5]:
            print(f"    - {account.account_no}: {account.account_name} ({account.group_code})")
    
    # Check user company associations
    print(f"\n👥 User Company Associations:")
    users = User.objects.all()[:10]
    for user in users:
        print(f"  - {user.name} ({user.username})")
        print(f"    Company: {user.company.name if user.company else 'None'}")
        print(f"    Company ID: {user.company_id if user.company_id else 'None'}")
    
    # Test account query as a user would
    print(f"\n🔍 Testing Account Query (as Niti):")
    niti = User.objects.filter(username="niti").first()
    if niti:
        user_accounts = Account.objects.filter(company_id=niti.company_id)
        print(f"  - Niti's company: {niti.company.name if niti.company else 'None'}")
        print(f"  - Niti's company_id: {niti.company_id}")
        print(f"  - Accounts visible to Niti: {user_accounts.count()}")
        
        for account in user_accounts[:5]:
            print(f"    → {account.account_no}: {account.account_name}")
    
    if total_accounts > 0:
        print("\n  ✅ Account data exists in database")
    else:
        print("\n  ❌ No account data found!")

def main():
    print("\n" + "=" * 60)
    print("NSJ SYSTEM DIAGNOSTICS")
    print("=" * 60)
    
    try:
        diagnose_notifications()
    except Exception as e:
        print(f"\n❌ Error in notification diagnosis: {e}")
        import traceback
        traceback.print_exc()
    
    try:
        diagnose_accounts()
    except Exception as e:
        print(f"\n❌ Error in account diagnosis: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("DIAGNOSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
