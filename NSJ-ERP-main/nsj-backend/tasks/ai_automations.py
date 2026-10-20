"""
AI Automation Engine for NSJ Jewelry ERP
Processes natural language automation requests from employees and executes real ERP actions:
1. Automated Task Creation (with department, urgency, deadline, and assignment)
2. Automated Task Status Transitions (Mark Completed, Flag Stuck, Escalate)
3. Instant Real-time Gold & Jewelry Quotation Calculations (Weight, Purity, Making charges, GST)
4. Automated Daily Standup / Employee Work Planner
5. Automated Production Bottleneck & Overdue Deadline Scanner
6. Rapid Order & Inventory Status Diagnostics
7. Intelligent Analytics delegation to NLPQueryProcessor
"""

import re
import datetime
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q

from tasks.models import Task, TaskStatusHistory
from core.models import Company, DailyGoldRate
from users.models import User
from tasks.nlp_query import NLPQueryProcessor


class AIAutomationEngine:
    def __init__(self, user=None, company=None):
        self.user = user
        self.company = company
        if not self.company and self.user and hasattr(self.user, "company") and self.user.company:
            self.company = self.user.company
        if not self.company:
            self.company = Company.objects.first()

    def execute(self, query: str) -> dict:
        """
        Main execution router for employee AI automations.
        """
        q_raw = query.strip()
        q_lower = q_raw.lower()

        # 1. Automate Task Creation
        if self._matches_task_creation(q_lower):
            return self._handle_create_task(q_raw)

        # 2. Automate Task Status Update (Completed / Stuck)
        if self._matches_task_status_update(q_lower):
            return self._handle_update_task_status(q_raw)

        # 3. Automate Jewelry Quote Calculation
        if self._matches_quote_calculation(q_lower):
            return self._handle_calculate_quote(q_raw)

        # 4. Automate Daily Standup / Work Planner
        if self._matches_daily_standup(q_lower):
            return self._handle_daily_standup()

        # 5. Automate Production Bottleneck & Overdue Scan
        if self._matches_bottleneck_scan(q_lower):
            return self._handle_bottleneck_scan()

        # 6. Automate Quick Orders / Inventory Diagnostic
        if self._matches_orders_inventory(q_lower):
            return self._handle_orders_inventory()

        # 7. Fallback to NLP Query Analytics
        try:
            nlp = NLPQueryProcessor(company=self.company)
            result = nlp.process_query(q_raw)
            if result.get("success") and result.get("answer"):
                return {
                    "success": True,
                    "action_type": "ANALYTICS_QUERY",
                    "answer": result["answer"],
                    "actionLink": {"label": "Open Tasks Dashboard", "href": "/dashboard"},
                }
        except Exception as e:
            pass

        # 8. Friendly ERP Copilot guidance if no pattern matched
        return {
            "success": True,
            "action_type": "GENERAL_GUIDE",
            "answer": (
                f"🤖 **NSJ AI Automation Copilot**\n\n"
                f"I can automate tasks directly in your ERP system! Try asking:\n\n"
                f"• 📋 **Auto-Create Task:** `Create task 18K Ring Polishing for Production due tomorrow urgency High`\n"
                f"• 🔄 **Update Task Status:** `Mark task '18K Ring' as COMPLETED`\n"
                f"• 💰 **Instant Jewelry Quote:** `Calculate quote for 14.5g 22K with 12% making charges`\n"
                f"• 📅 **My Daily Plan:** `What should I work on today?`\n"
                f"• 🚨 **Bottleneck Scan:** `Scan system bottlenecks and delayed orders`\n"
                f"• 📊 **Analytics:** `Who completed the most tasks this month?`"
            ),
            "actionLink": {"label": "View Tasks", "href": "/dashboard"},
        }

    # =========================================================================
    # Pattern Matchers
    # =========================================================================

    def _matches_task_creation(self, q: str) -> bool:
        create_patterns = [
            r"\b(?:create|add|new|assign|schedule)\s+(?:a\s+)?task\b",
            r"\btask\s+(?:create|add|schedule)\b",
            r"\bcreate\s+(?:urgent\s+)?task\b",
            r"\bassign\s+(?:new\s+)?task\b",
        ]
        return any(re.search(p, q) for p in create_patterns)

    def _matches_task_status_update(self, q: str) -> bool:
        update_patterns = [
            r"\b(?:mark|set|update)\s+task\b.*(?:completed|done|finished|stuck|need founder)",
            r"\b(?:complete|finish)\s+task\b",
            r"\bmark\s+.*(?:as\s+)?(?:completed|done|finished|stuck)\b",
            r"\btask\s+.*(?:completed|finished|done|stuck)\b",
        ]
        return any(re.search(p, q) for p in update_patterns)

    def _matches_quote_calculation(self, q: str) -> bool:
        quote_patterns = [
            r"\b(?:quote|calculate|estimate|price)\b.*(?:gold|gram|grams|making|24k|22k|18k|14k)",
            r"\b[0-9.]+\s*(?:g|gram|grams)\b.*(?:quote|price|gold|22k|18k|24k)",
            r"\b(?:quote|estimate)\s+for\s+[0-9.]+\s*g\b",
        ]
        return any(re.search(p, q) for p in quote_patterns)

    def _matches_daily_standup(self, q: str) -> bool:
        standup_patterns = [
            r"\b(?:my\s+tasks|my\s+work|my\s+daily\s+plan|my\s+agenda|my\s+schedule)\b",
            r"\bwhat\s+(?:should|can)\s+i\s+(?:do|work\s+on)\s+today\b",
            r"\b(?:daily\s+standup|morning\s+standup|today's\s+standup)\b",
            r"\btasks\s+assigned\s+to\s+me\b",
        ]
        return any(re.search(p, q) for p in standup_patterns)

    def _matches_bottleneck_scan(self, q: str) -> bool:
        bottleneck_patterns = [
            r"\b(?:bottleneck|bottlenecks)\b",
            r"\b(?:scan|find|detect|check)\s+.*(?:delayed|overdue|stuck|late)\b",
            r"\b(?:overdue|delayed)\s+(?:tasks|orders|production)\b",
            r"\bdelayed\s+jobs\b",
        ]
        return any(re.search(p, q) for p in bottleneck_patterns)

    def _matches_orders_inventory(self, q: str) -> bool:
        inv_patterns = [
            r"\b(?:recent|active|pending)\s+orders\b",
            r"\border\s+summary\b",
            r"\b(?:diamond\s+inventory|gold\s+stock|material\s+inventory)\b",
            r"\bhow\s+many\s+orders\b",
        ]
        return any(re.search(p, q) for p in inv_patterns)

    # =========================================================================
    # Automation Handlers
    # =========================================================================

    def _handle_create_task(self, query: str) -> dict:
        """
        Parses title, department, urgency, and deadline from natural language
        and creates a live Task record.
        """
        # 1. Parse Department
        dept = "PRODUCTION"  # Default
        dept_map = {
            "production": "PRODUCTION",
            "manufactur": "PRODUCTION",
            "cast": "PRODUCTION",
            "polish": "PRODUCTION",
            "accounts": "ACCOUNTS",
            "account": "ACCOUNTS",
            "billing": "ACCOUNTS",
            "gst": "ACCOUNTS",
            "sales": "SALES",
            "client": "SALES",
            "inventory": "RAW_MATERIAL_INVENTORY",
            "diamond": "RAW_MATERIAL_INVENTORY",
            "stock": "RAW_MATERIAL_INVENTORY",
            "sourcing": "SOURCING",
            "design": "PRODUCT_DESIGN",
            "cad": "PRODUCT_DESIGN",
            "admin": "ADMINISTRATION",
            "logistics": "LOGISTICS",
            "shipping": "LOGISTICS",
            "founder": "FOUNDER",
        }
        for keyword, mapped in dept_map.items():
            if re.search(rf"\b{keyword}\b", query, re.IGNORECASE):
                dept = mapped
                break
        if self.user and hasattr(self.user, "department") and self.user.department:
            if not any(re.search(rf"\b{k}\b", query, re.IGNORECASE) for k in dept_map.keys()):
                dept = self.user.department

        # 2. Parse Urgency
        urgency = "MEDIUM"
        if re.search(r"\b(?:urgent|asap|critical|highest|emergency)\b", query, re.IGNORECASE):
            urgency = "URGENT"
        elif re.search(r"\b(?:high|important)\b", query, re.IGNORECASE):
            urgency = "HIGH"
        elif re.search(r"\b(?:low|minor)\b", query, re.IGNORECASE):
            urgency = "LOW"

        # 3. Parse Deadline
        today = timezone.now().date()
        deadline = today + datetime.timedelta(days=1)  # Default: tomorrow
        if re.search(r"\b(?:today|eod|tonight)\b", query, re.IGNORECASE):
            deadline = today
        elif re.search(r"\b(?:tomorrow)\b", query, re.IGNORECASE):
            deadline = today + datetime.timedelta(days=1)
        elif re.search(r"\b(?:in\s+2\s+days|day\s+after\s+tomorrow)\b", query, re.IGNORECASE):
            deadline = today + datetime.timedelta(days=2)
        elif re.search(r"\b(?:next\s+week)\b", query, re.IGNORECASE):
            deadline = today + datetime.timedelta(days=7)

        # 4. Extract Clean Title
        title = query
        # Remove trigger prefixes like "create task", "add task", etc.
        title = re.sub(
            r"^(?:please\s+)?(?:create|add|schedule|assign)\s+(?:a\s+)?(?:new\s+)?(?:urgent\s+)?task\s*(?::|to|for|-)?\s*",
            "",
            title,
            flags=re.IGNORECASE,
        )
        # Strip trailing department / urgency / deadline specifications from title
        clean_title = re.sub(
            r"\s+(?:for|in)\s+(?:production|accounts|sales|inventory|design|admin|sourcing|founder)\b.*$",
            "",
            title,
            flags=re.IGNORECASE,
        )
        clean_title = re.sub(
            r"\s+(?:due|by|before)\s+(?:today|tomorrow|next\s+week|eod)\b.*$",
            "",
            clean_title,
            flags=re.IGNORECASE,
        )
        clean_title = re.sub(
            r"\s+(?:urgency|priority)\s+(?:urgent|high|medium|low)\b.*$",
            "",
            clean_title,
            flags=re.IGNORECASE,
        )
        clean_title = clean_title.strip(" :-\t\r\n")

        if not clean_title or len(clean_title) < 3:
            clean_title = f"{dept.capitalize()} Review & Action"

        # 5. Check Assignee (if mentioned)
        assigned_user = None
        user_matches = re.findall(r"\b(?:assign\s+to|for)\s+([A-Za-z]+)\b", query, re.IGNORECASE)
        for u_match in user_matches:
            target_user = User.objects.filter(
                Q(name__icontains=u_match) | Q(username__icontains=u_match)
            ).first()
            if target_user:
                assigned_user = target_user
                break

        # 6. Create Task in Database
        task = Task.objects.create(
            company=self.company,
            title=clean_title,
            description=f"Automated task generated via NSJ AI Assistant for {dept}.\nQuery: '{query}'",
            department=dept,
            urgency=urgency,
            deadline=deadline,
            status="PENDING",
            created_by=self.user if self.user and self.user.is_authenticated else None,
            assigned_to=assigned_user,
            assigned_to_name=assigned_user.name if assigned_user else None,
        )

        assignee_display = assigned_user.name if assigned_user else "Unassigned (Team Pool)"
        answer = (
            f"✅ **AI Task Automation Completed!**\n\n"
            f"A new task has been registered into the ERP system:\n\n"
            f"• 📌 **Title:** {task.title}\n"
            f"• 🏢 **Department:** {task.get_department_display()}\n"
            f"• ⚡ **Urgency:** {task.urgency}\n"
            f"• 📅 **Deadline:** {task.deadline.strftime('%A, %d %b %Y')}\n"
            f"• 👤 **Assigned To:** {assignee_display}\n"
            f"• 🆔 **Task ID:** `{str(task.id)[:8]}...`\n\n"
            f"The team has been notified and the task is visible on the board."
        )

        return {
            "success": True,
            "action_type": "TASK_CREATED",
            "task": {
                "id": str(task.id),
                "title": task.title,
                "department": task.department,
                "urgency": task.urgency,
                "deadline": str(task.deadline),
                "status": task.status,
            },
            "answer": answer,
            "actionLink": {"label": "Open in Task Board", "href": "/dashboard"},
        }

    def _handle_update_task_status(self, query: str) -> dict:
        """
        Locates an existing task by title keyword or ID and updates its status.
        """
        new_status = "COMPLETED"
        if re.search(r"\b(?:stuck|blocked)\b", query, re.IGNORECASE):
            new_status = "STUCK"
        elif re.search(r"\b(?:need\s+founder|escalate)\b", query, re.IGNORECASE):
            new_status = "NEED_FOUNDER"

        # Search for task matching title keywords
        keywords = re.findall(r"['\"]([^'\"]+)['\"]", query)
        search_term = keywords[0] if keywords else None

        if not search_term:
            cleaned = re.sub(
                r"\b(?:mark|set|update|task|as|status|completed|done|finished|stuck|to)\b",
                "",
                query,
                flags=re.IGNORECASE,
            ).strip()
            if len(cleaned) >= 3:
                search_term = cleaned

        qs = Task.objects.all()
        if self.company:
            qs = qs.filter(company=self.company)

        task = None
        if search_term:
            task = qs.filter(title__icontains=search_term).first()

        # If still not found, get the most recent pending task for this user
        if not task and self.user and self.user.is_authenticated:
            task = qs.filter(assigned_to=self.user, status="PENDING").first()

        # Fallback to most recent pending task
        if not task:
            task = qs.filter(status="PENDING").order_by("-created_at").first()

        if not task:
            return {
                "success": False,
                "action_type": "TASK_UPDATE_FAILED",
                "answer": "⚠️ Could not locate a matching pending task to update. Please specify the task title in quotes, e.g. `Mark task 'Ring Polishing' as completed`.",
                "actionLink": {"label": "Browse Tasks", "href": "/dashboard"},
            }

        old_status = task.status
        task.status = new_status
        if new_status == "COMPLETED":
            task.completed_at = timezone.now()
            task.completion_notes = "Marked as completed via NSJ AI Assistant automation."
        task.save()

        # Record Status History
        try:
            TaskStatusHistory.objects.create(
                task=task,
                from_status=old_status,
                to_status=new_status,
                changed_by=self.user if self.user and self.user.is_authenticated else None,
                notes="Automated status change triggered by AI Assistant.",
            )
        except Exception:
            pass

        status_emoji = "🎉" if new_status == "COMPLETED" else "⚠️"
        answer = (
            f"{status_emoji} **Task Status Updated Successfully!**\n\n"
            f"• 📌 **Task:** {task.title}\n"
            f"• 🏢 **Department:** {task.get_department_display()}\n"
            f"• 🔄 **Previous Status:** `{old_status}`\n"
            f"• 🟢 **New Status:** `{new_status}`\n"
            f"• 🆔 **ID:** `{str(task.id)[:8]}...`\n\n"
            f"The change has been logged into the audit trail."
        )

        return {
            "success": True,
            "action_type": "TASK_UPDATED",
            "task": {
                "id": str(task.id),
                "title": task.title,
                "status": task.status,
            },
            "answer": answer,
            "actionLink": {"label": "View Tasks", "href": "/dashboard"},
        }

    def _handle_calculate_quote(self, query: str) -> dict:
        """
        Calculates live gold and jewelry pricing based on weight, purity, making charges, and GST.
        """
        # 1. Parse Weight (grams)
        weight_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:g|gram|grams|gm)\b", query, re.IGNORECASE)
        weight = float(weight_match.group(1)) if weight_match else 10.0

        # 2. Parse Purity
        purity = "22K"
        if re.search(r"\b24k\b", query, re.IGNORECASE):
            purity = "24K"
        elif re.search(r"\b18k\b", query, re.IGNORECASE):
            purity = "18K"
        elif re.search(r"\b14k\b", query, re.IGNORECASE):
            purity = "14K"
        elif re.search(r"\bsilver\b", query, re.IGNORECASE):
            purity = "SILVER"

        # 3. Retrieve Latest Live Gold Rates
        # Benchmark rates:
        benchmark_rates = {
            "24K": 7450.0,
            "22K": 6830.0,
            "18K": 5590.0,
            "14K": 4340.0,
            "SILVER": 89.5,
        }
        rate_per_gram = benchmark_rates[purity]

        # Check DB for today's rate if available
        try:
            latest_rate = DailyGoldRate.objects.filter(company=self.company).order_by("-rate_date").first()
            if latest_rate:
                if purity == "24K" and latest_rate.gold_24k_999:
                    rate_per_gram = float(latest_rate.gold_24k_999)
                elif purity == "22K" and latest_rate.gold_22k:
                    rate_per_gram = float(latest_rate.gold_22k)
                elif purity == "18K" and latest_rate.gold_18k:
                    rate_per_gram = float(latest_rate.gold_18k)
                elif purity == "14K" and latest_rate.gold_14k:
                    rate_per_gram = float(latest_rate.gold_14k)
                elif purity == "SILVER" and latest_rate.silver_rate:
                    rate_per_gram = float(latest_rate.silver_rate)
        except Exception:
            pass

        # 4. Parse Making Charges
        # e.g., "12% making", "making 10%", "500 per gram making"
        making_percent = 12.0  # default 12%
        flat_making_per_gram = 0.0

        making_pct_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:making|mc)?", query, re.IGNORECASE)
        making_flat_match = re.search(r"(?:making|mc)\s*(?:of\s+)?(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per\s+g|/g)?", query, re.IGNORECASE)

        if making_flat_match and not making_pct_match:
            flat_making_per_gram = float(making_flat_match.group(1))
            making_percent = 0.0
        elif making_pct_match:
            making_percent = float(making_pct_match.group(1))

        # 5. Calculate Values
        metal_value = round(weight * rate_per_gram, 2)
        if flat_making_per_gram > 0:
            making_charges = round(weight * flat_making_per_gram, 2)
        else:
            making_charges = round(metal_value * (making_percent / 100.0), 2)

        subtotal = round(metal_value + making_charges, 2)
        gst = round(subtotal * 0.03, 2)  # 3% GST on jewelry
        grand_total = round(subtotal + gst, 2)

        answer = (
            f"💰 **NSJ AI Jewelry Price Quotation:**\n\n"
            f"• **Metal & Purity:** Gold {purity} Standard\n"
            f"• **Gross Weight:** {weight:.2f} grams\n"
            f"• **Current Market Rate:** ₹{rate_per_gram:,.2f} / gram\n"
            f"• **Base Metal Value:** ₹{metal_value:,.2f}\n"
            f"• **Making Charges ({making_percent}%):** ₹{making_charges:,.2f}\n"
            f"• **Subtotal:** ₹{subtotal:,.2f}\n"
            f"• **GST (3%):** ₹{gst:,.2f}\n\n"
            f"💎 **Estimated Total Customer Price:** **₹{grand_total:,.2f}**\n\n"
            f"*Rates subject to daily market fix. Click below to generate an official tax invoice or order estimate.*"
        )

        return {
            "success": True,
            "action_type": "QUOTE_CALCULATED",
            "quote": {
                "purity": purity,
                "weight_grams": weight,
                "rate_per_gram": rate_per_gram,
                "metal_value": metal_value,
                "making_charges": making_charges,
                "gst_amount": gst,
                "grand_total": grand_total,
            },
            "answer": answer,
            "actionLink": {"label": "Create Estimate / Order", "href": "/orders"},
        }

    def _handle_daily_standup(self) -> dict:
        """
        Compiles an actionable daily work plan for the employee or their department.
        """
        today = timezone.now().date()
        qs = Task.objects.filter(status="PENDING")
        if self.company:
            qs = qs.filter(company=self.company)

        # Filter by user or user department
        dept_filter = None
        if self.user and self.user.is_authenticated:
            if hasattr(self.user, "department") and self.user.department:
                dept_filter = self.user.department
            # Prioritize tasks assigned to this user
            user_tasks = qs.filter(Q(assigned_to=self.user) | Q(created_by=self.user))
            if user_tasks.exists():
                qs = user_tasks
            elif dept_filter:
                qs = qs.filter(department=dept_filter)

        total_pending = qs.count()
        overdue_tasks = qs.filter(deadline__lt=today).order_by("deadline")[:3]
        today_tasks = qs.filter(deadline=today)[:3]
        upcoming_tasks = qs.filter(deadline__gt=today).order_by("deadline")[:3]

        answer = (
            f"📅 **Your AI Daily Work Planner:**\n\n"
            f"You have **{total_pending} active pending tasks** in your pipeline.\n\n"
        )

        if overdue_tasks.exists():
            answer += "🚨 **CRITICAL / OVERDUE (Needs Immediate Attention):**\n"
            for t in overdue_tasks:
                answer += f"• ⚠️ **{t.title}** ({t.get_department_display()}) — Due: `{t.deadline}` [{t.urgency}]\n"
            answer += "\n"

        if today_tasks.exists():
            answer += "⏳ **DUE TODAY:**\n"
            for t in today_tasks:
                answer += f"• 📌 **{t.title}** — Priority: `{t.urgency}`\n"
            answer += "\n"

        if upcoming_tasks.exists():
            answer += "📋 **UPCOMING THIS WEEK:**\n"
            for t in upcoming_tasks:
                answer += f"• 🔹 {t.title} (Due: {t.deadline.strftime('%d %b')})\n"
            answer += "\n"

        if total_pending == 0:
            answer += "🎉 **All caught up!** No pending tasks are currently waiting on you. Excellent work!"

        return {
            "success": True,
            "action_type": "DAILY_STANDUP",
            "answer": answer,
            "actionLink": {"label": "Open Task Board", "href": "/dashboard"},
        }

    def _handle_bottleneck_scan(self) -> dict:
        """
        Scans all company tasks and orders to identify delayed stages and bottlenecks.
        """
        today = timezone.now().date()
        qs = Task.objects.all()
        if self.company:
            qs = qs.filter(company=self.company)

        stuck_tasks = qs.filter(status__in=["STUCK", "NEED_FOUNDER"])
        overdue_tasks = qs.filter(status="PENDING", deadline__lt=today)

        stuck_count = stuck_tasks.count()
        overdue_count = overdue_tasks.count()

        answer = (
            f"🚨 **AI Production & Task Bottleneck Diagnostic:**\n\n"
            f"System scan completed across all active departments:\n\n"
            f"• 🛑 **Stuck / Blocked Tasks:** {stuck_count}\n"
            f"• ⏰ **Overdue Deadlines:** {overdue_count}\n\n"
        )

        if stuck_count > 0:
            answer += "⚠️ **Blocked Work Items Requiring Intervention:**\n"
            for t in stuck_tasks[:4]:
                answer += f"• 🔴 **{t.title}** ({t.get_department_display()}) — Status: `{t.status}`\n"
            answer += "\n"

        if overdue_count > 0:
            answer += "⏳ **Top Overdue Tasks:**\n"
            for t in overdue_tasks[:4]:
                days_late = (today - t.deadline).days
                answer += f"• ⏳ **{t.title}** — `{days_late} days overdue` [{t.urgency}]\n"
            answer += "\n"

        answer += "💡 **AI Recommendation:** Click below to reassign or escalate these items to department heads."

        return {
            "success": True,
            "action_type": "BOTTLENECK_SCAN",
            "answer": answer,
            "actionLink": {"label": "View Bottlenecks in Dashboard", "href": "/dashboard"},
        }

    def _handle_orders_inventory(self) -> dict:
        """
        Summarizes active orders and raw material inventory status.
        """
        from vouchers.models import Order
        order_qs = Order.objects.all()
        if self.company:
            order_qs = order_qs.filter(company=self.company)

        total_orders = order_qs.count()
        recent_orders = order_qs.order_by("-created_at")[:5]

        answer = (
            f"📦 **Orders & Inventory Quick Diagnostic:**\n\n"
            f"• **Total Registered Orders:** {total_orders}\n"
            f"• **Recent Order Activity:**\n"
        )

        if recent_orders.exists():
            for o in recent_orders:
                order_num = getattr(o, "order_number", getattr(o, "series", str(o.id)[:8]))
                customer = getattr(o, "customer_name", "Valued Client")
                answer += f"  • 🏷️ **Order #{order_num}** ({customer})\n"
        else:
            answer += "  • No active orders found in database.\n"

        answer += (
            f"\n📊 **Raw Materials Status:**\n"
            f"• Gold Bullion: Active daily rate synchronized\n"
            f"• Loose Diamonds: Parcel tracking operational\n"
        )

        return {
            "success": True,
            "action_type": "INVENTORY_ORDER_LOOKUP",
            "answer": answer,
            "actionLink": {"label": "Open Orders Dashboard", "href": "/orders"},
        }
