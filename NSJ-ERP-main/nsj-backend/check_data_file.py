#!/usr/bin/env python
"""
Quick script to check if db_backup.json exists and show its contents summary.
"""
import os
import json
import sys

def check_data_file():
    file_path = "db_backup.json"
    
    print("=" * 60)
    print("DB_BACKUP.JSON FILE CHECK")
    print("=" * 60)
    
    # Check if file exists
    if os.path.exists(file_path):
        print(f"✓ File exists: {file_path}")
        
        # Get file size
        size = os.path.getsize(file_path)
        print(f"✓ File size: {size:,} bytes ({size/1024:.2f} KB)")
        
        # Try to load and parse
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            print(f"✓ File is valid JSON")
            print(f"✓ Total records: {len(data)}")
            
            # Count by model
            models = {}
            for item in data:
                model = item.get('model', 'unknown')
                models[model] = models.get(model, 0) + 1
            
            print("\nRecords by model:")
            for model, count in sorted(models.items()):
                print(f"  - {model}: {count}")
            
            # Check for accounts
            account_records = [item for item in data if 'account' in item.get('model', '').lower()]
            if account_records:
                print(f"\n✓ Found {len(account_records)} account-related records")
            else:
                print("\n⚠ WARNING: No account records found!")
            
            return True
            
        except json.JSONDecodeError as e:
            print(f"✗ ERROR: File is not valid JSON: {e}")
            return False
        except Exception as e:
            print(f"✗ ERROR: Failed to read file: {e}")
            return False
    else:
        print(f"✗ ERROR: File not found: {file_path}")
        print(f"  Current directory: {os.getcwd()}")
        print(f"  Files in current directory:")
        for f in os.listdir('.'):
            if f.endswith('.json'):
                print(f"    - {f}")
        return False

if __name__ == "__main__":
    success = check_data_file()
    sys.exit(0 if success else 1)
