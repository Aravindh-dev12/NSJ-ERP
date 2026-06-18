#!/usr/bin/env python
"""
Test script to verify notification creation when tasks are created.
Run this to diagnose notification issues.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nsj_backend.settings")
django.setup()

from tasks.models import Task, TaskNotification
from users.models import User
from core.models import Company
from datetime import date, timedelta

def test_notification_creation():
    print("=" * 60)
    print("NOTIFICATION CREATION TEST")
    print("=" * 60)
    
    # Get test data
    company = Company.objects.first()
    if not company:
        print("❌ No company found!")
        return
    
    print(f"✓ Company: {company.name}")
    
    # Get users
    niti = User.objects.filter(username="niti").first()
    sanjana = User.objects.filter(username="sanjana").first()
    
    if not niti or not sanjana:
        print("❌ Test users not found!")
        return
    
    print(f"✓ Creator: {niti.name}")
    print(f"✓ Assignee: {sanjana.name}")
    
    # Count existing notifications
    before_count = TaskNotification.objects.count()
    print(f"\n📊 Notifications before: {before_count}")
    
    # Create a test task
    print("\n🔨 Creating test task...")
    task = Task.objects.create(
        company=company,
        title="TEST: Notification Creation Test",
        description="This is a test task to verify notifications are created automatically",
        deadline=date.today() + timedelta(days=7),
        urgency="HIGH",
        department="PRODUCTION",
        sub_department="CUSTOM_JEWELLERY",
        assigned_to=sanjana,
        assigned_to_name=sanjana.name,
        created_by=niti,
        output_medium="Test output",
        status="PENDING",
    )
    
    print(f"✓ Task created: {task.id}")
    print(f"  Title: {task.title}")
    print(f"  Assigned to: {task.assigned_to.name}")
    print(f"  Created by: {task.created_by.name}")
    
    # Count notifications after
    after_count = TaskNotification.objects.count()
    new_notifications = after_count - before_count
    
    print(f"\n📊 Notifications after: {after_count}")
    print(f"📊 New notifications: {new_notifications}")
    
    # Check notifications for this task
    task_notifications = TaskNotification.objects.filter(task=task)
    print(f"\n📬 Notifications for this task: {task_notifications.count()}")
    
    for notif in task_notifications:
        print(f"  - {notif.user.name}: {notif.message}")
    
    # Expected: 2 notifications (one for assignee, one for creator)
    if new_notifications >= 2:
        print("\n✅ SUCCESS: Notifications created correctly!")
    elif new_notifications == 1:
        print("\n⚠️  WARNING: Only 1 notification created (expected 2)")
    else:
        print("\n❌ FAILURE: No notifications created!")
        print("\n🔍 Debugging info:")
        print(f"  - Signal handlers registered: Check tasks/signals.py")
        print(f"  - Apps ready() called: Check tasks/apps.py")
        print(f"  - Task saved successfully: {Task.objects.filter(id=task.id).exists()}")
    
    # Cleanup
    print(f"\n🧹 Cleaning up test task...")
    task.delete()
    print("✓ Test task deleted")
    
    print("=" * 60)

if __name__ == "__main__":
    test_notification_creation()
