"""
Natural Language Query Processor for Task Management

This module processes natural language queries and converts them to database queries.
Uses intent detection with flexible pattern matching for comprehensive understanding.
"""

import re
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Task


class NLPQueryProcessor:
    """Process natural language queries about tasks, orders, and queries"""

    def __init__(self, company=None):
        self.company = company

    def _base_queryset(self):
        """Get base queryset with company filter"""
        qs = Task.objects.all()
        if self.company:
            qs = qs.filter(company=self.company)
        return qs

    def _order_queryset(self):
        """Get base queryset for orders"""
        from vouchers.models import Order

        qs = Order.objects.all()
        if self.company:
            qs = qs.filter(company=self.company)
        return qs

    def _query_queryset(self):
        """Get base queryset for queries (customer inquiries)"""
        from issues.models import Query

        return Query.objects.all()

    def _detect_intent(self, query: str) -> dict:
        """
        Detect the intent of the query using flexible pattern matching.
        Returns intent category and extracted entities.
        """
        query_lower = query.lower().strip()

        # Define intent patterns with synonyms and variations
        intents = {
            # Task completion/performance intents
            "top_performer": [
                r"who.*(completed?|finished?|done).*(most|maximum|highest|best)",
                r"(best|top|highest).*(performer|employee|person|worker)",
                r"(most|maximum|highest).*(completed?|finished?|done)",
                r"who.*(best|top).*(at|in).*(task|work)",
                r"(leader|leaderboard|ranking).*(task|completion)",
                r"who.*doing.*(best|well|great)",
                r"star.*(performer|employee)",
            ],
            # Task count intents
            "task_count": [
                r"(how many|total|count|number of).*(task)",
                r"task.*(count|total|number)",
                r"(all|every).*(task)",
            ],
            # Pending tasks
            "pending_tasks": [
                r"(pending|incomplete|unfinished|open|active|remaining).*(task)",
                r"task.*(pending|incomplete|unfinished|open|not done|remaining)",
                r"(what|which|show|list).*(task).*(pending|open|incomplete)",
                r"(task).*(not|haven\'t|hasn\'t).*(completed?|finished?|done)",
            ],
            # Completed tasks
            "completed_tasks": [
                r"(completed?|finished?|done|closed).*(task)",
                r"task.*(completed?|finished?|done|closed)",
                r"(how many|total).*(completed?|finished?|done)",
            ],
            # Stuck/blocked tasks
            "stuck_tasks": [
                r"(stuck|blocked|stalled|halted|stopped).*(task)",
                r"task.*(stuck|blocked|stalled|halted)",
                r"(what|which|show).*(stuck|blocked)",
            ],
            # Overdue tasks
            "overdue_tasks": [
                r"(overdue|late|delayed|past due|missed deadline|behind schedule).*(task)?",
                r"task.*(overdue|late|delayed|past due|missed)",
                r"(deadline).*(missed|passed|overdue)",
                r"(what|which|show).*(overdue|late)",
            ],
            # Department related
            "department_tasks": [
                r"(task|work).*(by|per|each|every).*(department|dept|team)",
                r"(department|dept|team).*(task|work|performance|breakdown)",
                r"(which|what).*(department|dept|team)",
                r"(department|dept).*(wise|breakdown|distribution)",
            ],
            # Department performance
            "department_performance": [
                r"(best|top|highest|worst|lowest).*(department|dept|team)",
                r"(department|dept|team).*(performance|ranking|comparison)",
                r"(which|what).*(department|dept).*(best|top|performing)",
                r"(compare|comparison).*(department|dept)",
            ],
            # Urgency related
            "urgent_tasks": [
                r"(urgent|high priority|critical|important|priority).*(task)?",
                r"task.*(urgent|high priority|critical)",
                r"(what|which|show).*(urgent|priority|critical)",
                r"priority.*(breakdown|distribution|count)",
            ],
            # Person with most pending
            "most_pending": [
                r"who.*(most|maximum|highest).*(pending|incomplete|open)",
                r"(most|maximum|highest).*(pending|workload|backlog)",
                r"who.*(overloaded|busy|backlog)",
                r"(heaviest|highest).*(workload|load)",
            ],
            # Completion time
            "completion_time": [
                r"(average|avg|mean).*(time|duration|days).*(complete|finish)",
                r"(how long|time).*(complete|finish|take)",
                r"(completion|finish).*(time|duration|speed)",
                r"(fast|slow|quick).*(complete|finish)",
            ],
            # Tasks created today/this week
            "tasks_today": [
                r"(task|work).*(today|created today|new today)",
                r"today.*(task|work|created)",
                r"(new|recent).*(task).*(today)",
            ],
            "tasks_this_week": [
                r"(task|work).*(this week|weekly|week)",
                r"(this week|weekly).*(task|work)",
                r"(new|recent).*(task).*(week)",
            ],
            # Who created most tasks
            "most_created": [
                r"who.*(created|assigned|made|given).*(most|maximum)",
                r"(most|maximum).*(task).*(created|assigned|given)",
                r"who.*(assign|give|create).*(most|maximum)",
            ],
            # Tasks for specific person
            "person_tasks": [
                r"(task|work).*(for|of|assigned to|belonging to)\s+(\w+)",
                r"(\w+).*(task|work|assignment)",
                r"(show|list|get).*(task).*(for|of)\s+(\w+)",
                r"what.*(task).*(\w+).*(have|has|doing)",
            ],
            # Completion rate
            "completion_rate": [
                r"(completion|success|efficiency).*(rate|percentage|ratio)",
                r"(how|what).*(efficient|productive|rate)",
                r"(percentage|percent|ratio).*(completed?|done|finished)",
            ],
            # Need founder intervention
            "need_founder": [
                r"(need|require|waiting).*(founder|intervention|escalat)",
                r"(founder|escalat).*(task|intervention|attention)",
                r"(escalated|flagged|critical).*(task)?",
            ],
            # =========== ORDER INTENTS ===========
            # Total orders
            "total_orders": [
                r"(how many|total|count|number of).*(order)",
                r"order.*(count|total|number)",
                r"(all|every).*(order)",
            ],
            # Orders today/week/month
            "orders_today": [
                r"order.*(today|created today)",
                r"today.*(order)",
                r"(new|recent).*(order).*(today)",
            ],
            "orders_this_week": [
                r"order.*(this week|weekly|week)",
                r"(this week|weekly).*(order)",
            ],
            "orders_this_month": [
                r"order.*(this month|monthly|month)",
                r"(this month|monthly).*(order)",
            ],
            # Orders by customer/account
            "orders_by_customer": [
                r"order.*(by|per|each).*(customer|account|client|party)",
                r"(customer|account|client|party).*(order)",
                r"(who|which).*(customer|client).*(most|order)",
            ],
            # Orders with/without advance
            "orders_with_advance": [
                r"order.*(with|having|received).*(advance|payment|paid)",
                r"(paid|advance).*(order)",
                r"(order).*(paid|confirmed)",
            ],
            "orders_without_advance": [
                r"order.*(without|no|pending).*(advance|payment)",
                r"(unpaid|pending payment).*(order)",
                r"(order).*(unpaid|not paid|pending)",
            ],
            # Recent orders
            "recent_orders": [
                r"(recent|latest|last|new).*(order)",
                r"order.*(recent|latest|last|new)",
                r"(show|list|get).*(order)",
            ],
            # Order value
            "order_value": [
                r"(order|total).*(value|amount|worth|price)",
                r"(value|amount|worth).*(order)",
                r"(gold rate|average).*(order)?",
                r"(how much|what).*(order).*(value|worth)",
            ],
            # =========== QUERY (CUSTOMER INQUIRY) INTENTS ===========
            # Total queries
            "total_queries": [
                r"(how many|total|count|number of).*(quer|inquir|enquir)",
                r"(quer|inquir|enquir).*(count|total|number)",
                r"(customer|client).*(quer|inquir)",
            ],
            # Pending queries
            "pending_queries": [
                r"(pending|open|active|waiting).*(quer|inquir)",
                r"(quer|inquir).*(pending|open|active|waiting)",
            ],
            # Converted queries
            "converted_queries": [
                r"(converted|successful|won).*(quer|inquir)",
                r"(quer|inquir).*(converted|successful|won|order)",
                r"(quer).*(became|turned into).*(order)",
            ],
            # Archived queries
            "archived_queries": [
                r"(archived|old|expired|closed).*(quer|inquir)",
                r"(quer|inquir).*(archived|old|expired|closed)",
            ],
            # Queries today/week
            "queries_today": [
                r"(quer|inquir).*(today)",
                r"today.*(quer|inquir)",
            ],
            "queries_this_week": [
                r"(quer|inquir).*(this week|weekly)",
                r"(this week|weekly).*(quer|inquir)",
            ],
            # Expiring queries
            "expiring_queries": [
                r"(expir|about to expire|deadline).*(quer|inquir)",
                r"(quer|inquir).*(expir|deadline|due soon)",
            ],
            # Query conversion rate
            "query_conversion_rate": [
                r"(quer|inquir).*(conversion|success).*(rate|percentage)",
                r"(conversion|success).*(rate|percentage).*(quer)?",
                r"(how many|what percentage).*(quer).*(convert)",
            ],
            # Queries by item
            "queries_by_item": [
                r"(quer|inquir).*(by|per|each).*(item|product)",
                r"(popular|trending|most).*(item|product).*(quer)?",
                r"(what|which).*(item).*(most).*(quer|asked|inquir)",
            ],
            # =========== GENERAL/SUMMARY INTENTS ===========
            "summary": [
                r"(summary|overview|dashboard|report|status)",
                r"(how|what).*(business|company|doing)",
                r"(give me|show me|tell me).*(summary|overview|status)",
            ],
            "help": [
                r"(help|what can you|how to|guide)",
                r"(what|which).*(question|ask)",
            ],
        }

        # Check each intent
        for intent, patterns in intents.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    # Extract any person name if present
                    person_match = re.search(
                        r"(?:for|of|assigned to|belonging to)\s+(\w+)", query_lower
                    )
                    person_name = person_match.group(1) if person_match else None

                    return {
                        "intent": intent,
                        "confidence": "high",
                        "person": person_name,
                        "original_query": query,
                    }

        # Try to detect entity-based intent (fallback)
        return self._fallback_intent_detection(query_lower)

    def _fallback_intent_detection(self, query: str) -> dict:
        """
        Fallback intent detection based on key entities in the query.
        """
        # Entity keywords
        task_words = ["task", "tasks", "work", "assignment", "assignments", "job", "jobs"]
        order_words = ["order", "orders", "bill", "bills", "voucher", "vouchers"]
        query_words = [
            "query",
            "queries",
            "inquiry",
            "inquiries",
            "enquiry",
            "enquiries",
            "customer inquiry",
        ]

        person_words = ["who", "person", "employee", "staff", "team member", "worker"]
        count_words = ["how many", "count", "total", "number", "amount"]
        performance_words = ["best", "top", "worst", "performance", "performer", "ranking", "rate"]

        has_task = any(w in query for w in task_words)
        has_order = any(w in query for w in order_words)
        has_query = any(w in query for w in query_words)
        has_person = any(w in query for w in person_words)
        has_count = any(w in query for w in count_words)
        has_performance = any(w in query for w in performance_words)

        # Determine intent based on entity combinations
        if has_task:
            if has_person and has_performance:
                return {
                    "intent": "top_performer",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if has_count or "how many" in query:
                return {
                    "intent": "task_count",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "pending" in query or "incomplete" in query:
                return {
                    "intent": "pending_tasks",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "completed" in query or "done" in query or "finished" in query:
                return {
                    "intent": "completed_tasks",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "stuck" in query or "blocked" in query:
                return {
                    "intent": "stuck_tasks",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "overdue" in query or "late" in query:
                return {
                    "intent": "overdue_tasks",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "department" in query or "dept" in query:
                return {
                    "intent": "department_tasks",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            # Default task intent
            return {
                "intent": "task_count",
                "confidence": "low",
                "person": None,
                "original_query": query,
            }

        if has_order:
            if has_count or "how many" in query:
                return {
                    "intent": "total_orders",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "today" in query:
                return {
                    "intent": "orders_today",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "week" in query:
                return {
                    "intent": "orders_this_week",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "month" in query:
                return {
                    "intent": "orders_this_month",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "recent" in query or "latest" in query or "new" in query:
                return {
                    "intent": "recent_orders",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "customer" in query or "account" in query or "client" in query:
                return {
                    "intent": "orders_by_customer",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "advance" in query or "paid" in query or "payment" in query:
                if "without" in query or "no" in query or "unpaid" in query:
                    return {
                        "intent": "orders_without_advance",
                        "confidence": "medium",
                        "person": None,
                        "original_query": query,
                    }
                return {
                    "intent": "orders_with_advance",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            # Default order intent
            return {
                "intent": "total_orders",
                "confidence": "low",
                "person": None,
                "original_query": query,
            }

        if has_query:
            if has_count or "how many" in query:
                return {
                    "intent": "total_queries",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "pending" in query or "open" in query or "active" in query:
                return {
                    "intent": "pending_queries",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "converted" in query or "successful" in query:
                return {
                    "intent": "converted_queries",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "archived" in query or "expired" in query or "old" in query:
                return {
                    "intent": "archived_queries",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "expir" in query:
                return {
                    "intent": "expiring_queries",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            if "conversion" in query or "rate" in query:
                return {
                    "intent": "query_conversion_rate",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            # Default query intent
            return {
                "intent": "total_queries",
                "confidence": "low",
                "person": None,
                "original_query": query,
            }

        # Check for performance-related queries without explicit entity
        if has_performance:
            if "department" in query or "dept" in query:
                return {
                    "intent": "department_performance",
                    "confidence": "medium",
                    "person": None,
                    "original_query": query,
                }
            return {
                "intent": "top_performer",
                "confidence": "low",
                "person": None,
                "original_query": query,
            }

        # Summary/overview
        if "summary" in query or "overview" in query or "dashboard" in query:
            return {
                "intent": "summary",
                "confidence": "medium",
                "person": None,
                "original_query": query,
            }

        # Unknown intent
        return {"intent": "unknown", "confidence": "none", "person": None, "original_query": query}

    def process_query(self, query: str) -> dict:
        """
        Process a natural language query and return results.
        """
        # Detect intent
        intent_result = self._detect_intent(query)
        intent = intent_result["intent"]

        # Map intents to handlers
        handlers = {
            "top_performer": self._who_completed_most,
            "task_count": self._total_tasks,
            "pending_tasks": self._pending_tasks,
            "completed_tasks": self._completed_tasks,
            "stuck_tasks": self._stuck_tasks,
            "overdue_tasks": self._overdue_tasks,
            "department_tasks": self._tasks_by_department,
            "department_performance": self._department_performance,
            "urgent_tasks": self._tasks_by_urgency,
            "most_pending": self._who_has_most_pending,
            "completion_time": self._average_completion_time,
            "tasks_today": self._tasks_created_today,
            "tasks_this_week": self._tasks_created_this_week,
            "most_created": self._who_created_most,
            "person_tasks": lambda q: self._tasks_for_person(q, intent_result.get("person")),
            "completion_rate": self._completion_rate,
            "need_founder": self._need_founder_tasks,
            # Order handlers
            "total_orders": self._total_orders,
            "orders_today": self._orders_today,
            "orders_this_week": self._orders_this_week,
            "orders_this_month": self._orders_this_month,
            "orders_by_customer": self._orders_by_account,
            "orders_with_advance": self._orders_with_advance,
            "orders_without_advance": self._orders_without_advance,
            "recent_orders": self._recent_orders,
            "order_value": self._order_value,
            # Query handlers
            "total_queries": self._total_queries,
            "pending_queries": self._pending_queries,
            "converted_queries": self._converted_queries,
            "archived_queries": self._archived_queries,
            "queries_today": self._queries_today,
            "queries_this_week": self._queries_this_week,
            "expiring_queries": self._expiring_queries,
            "query_conversion_rate": self._query_conversion_rate,
            "queries_by_item": self._queries_by_item,
            # General
            "summary": self._get_summary,
            "help": lambda q: {
                "success": True,
                "query_type": "help",
                "answer": self._get_help_message(),
                "data": None,
            },
        }

        handler = handlers.get(intent)

        if handler:
            try:
                return handler(query)
            except Exception as e:
                return {
                    "success": False,
                    "query_type": "error",
                    "answer": f"Sorry, I encountered an error: {str(e)}",
                    "error": str(e),
                }

        # Unknown intent - try to be helpful
        return {
            "success": True,
            "query_type": "unknown",
            "answer": self._get_smart_suggestion(query),
            "data": None,
        }

    def _get_smart_suggestion(self, query: str) -> str:
        """Generate smart suggestions based on the query"""
        query_lower = query.lower()

        suggestions = []

        if any(w in query_lower for w in ["who", "person", "employee", "staff"]):
            suggestions.append('• "Who completed the most tasks?"')
            suggestions.append('• "Who has the most pending work?"')

        if any(w in query_lower for w in ["how", "what", "show", "tell"]):
            suggestions.append('• "How many orders this month?"')
            suggestions.append('• "What\'s the query conversion rate?"')
            suggestions.append('• "Show me pending tasks"')

        if any(w in query_lower for w in ["best", "top", "performance"]):
            suggestions.append('• "Best performing department"')
            suggestions.append('• "Top performers this week"')

        if not suggestions:
            suggestions = [
                '• "Total tasks" or "Total orders"',
                '• "Who completed most tasks?"',
                '• "Pending queries"',
                '• "Orders this week"',
                '• "Query conversion rate"',
            ]

        return "I'm not sure I understood that. Here are some things you can ask:\n\n" + "\n".join(
            suggestions[:5]
        )

    def _get_help_message(self):
        return """I can help you with many questions! Here are some examples:

📊 **Tasks:**
• "Who completed the most tasks?"
• "How many tasks are pending?"
• "Show overdue tasks"
• "Tasks by department"
• "What's the completion rate?"

📦 **Orders:**
• "How many orders this month?"
• "Recent orders"
• "Orders with advance payment"
• "Orders by customer"

❓ **Customer Queries:**
• "Pending queries"
• "Query conversion rate"
• "Expiring queries"

💡 **Tips:**
• Ask naturally - I understand variations!
• Try "summary" for an overview
• Ask about specific people: "Tasks for Pradip" """

    def _get_summary(self, query: str) -> dict:
        """Get a comprehensive summary"""
        tasks = self._base_queryset()
        orders = self._order_queryset()
        queries = self._query_queryset()

        task_total = tasks.count()
        task_pending = tasks.filter(status="PENDING").count()
        task_completed = tasks.filter(status="COMPLETED").count()

        order_total = orders.count()
        order_today = orders.filter(created_at__date=timezone.now().date()).count()

        query_total = queries.count()
        query_pending = queries.filter(status="pending").count()
        query_converted = queries.filter(status="converted_to_order").count()

        conversion_rate = round((query_converted / query_total * 100), 1) if query_total > 0 else 0
        completion_rate = round((task_completed / task_total * 100), 1) if task_total > 0 else 0

        answer = f"""📊 **Business Summary**

**Tasks:**
• Total: {task_total} | Pending: {task_pending} | Completed: {task_completed}
• Completion Rate: {completion_rate}%

**Orders:**
• Total: {order_total} | Today: {order_today}

**Customer Queries:**
• Total: {query_total} | Pending: {query_pending}
• Conversion Rate: {conversion_rate}%"""

        return {
            "success": True,
            "query_type": "summary",
            "answer": answer,
            "data": {
                "tasks": {
                    "total": task_total,
                    "pending": task_pending,
                    "completed": task_completed,
                },
                "orders": {"total": order_total, "today": order_today},
                "queries": {
                    "total": query_total,
                    "pending": query_pending,
                    "converted": query_converted,
                },
            },
        }

    # =========================================================================
    # Task Handlers
    # =========================================================================

    def _who_completed_most(self, query: str) -> dict:
        """Find who completed the most tasks"""
        completed_by = {}

        for task in self._base_queryset().filter(status="COMPLETED"):
            name = task.assigned_to.name if task.assigned_to else task.assigned_to_name
            if name:
                completed_by[name] = completed_by.get(name, 0) + 1

        if not completed_by:
            return {
                "success": True,
                "query_type": "top_performer",
                "answer": "No completed tasks found yet.",
                "data": [],
            }

        sorted_performers = sorted(completed_by.items(), key=lambda x: x[1], reverse=True)
        top = sorted_performers[0]

        answer = f"🏆 **{top[0]}** leads with **{top[1]}** completed tasks!\n\n**Leaderboard:**\n"
        for i, (name, count) in enumerate(sorted_performers[:5], 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            answer += f"{medal} {name}: {count} tasks\n"

        return {
            "success": True,
            "query_type": "top_performer",
            "answer": answer,
            "data": [{"name": n, "completed": c} for n, c in sorted_performers[:5]],
        }

    def _total_tasks(self, query: str) -> dict:
        """Get total task count"""
        tasks = self._base_queryset()
        total = tasks.count()
        by_status = tasks.values("status").annotate(count=Count("id"))
        status_breakdown = {item["status"]: item["count"] for item in by_status}

        answer = f"📊 **Total Tasks: {total}**\n\n"
        emojis = {
            "PENDING": "⏳",
            "COMPLETED": "✅",
            "STUCK": "🚫",
            "NEED_FOUNDER": "⚠️",
            "TRANSFERRED": "↔️",
        }
        for status, count in status_breakdown.items():
            answer += f"{emojis.get(status, '•')} {status}: {count}\n"

        return {
            "success": True,
            "query_type": "task_count",
            "answer": answer,
            "data": {"total": total, "by_status": status_breakdown},
        }

    def _pending_tasks(self, query: str) -> dict:
        """Get pending tasks"""
        pending = self._base_queryset().filter(status="PENDING")
        count = pending.count()

        oldest = pending.order_by("created_at")[:5]
        oldest_list = [
            {
                "title": t.title,
                "assigned_to": t.assigned_to.name if t.assigned_to else t.assigned_to_name,
                "days": (timezone.now() - t.created_at).days,
            }
            for t in oldest
        ]

        answer = f"⏳ **{count} Pending Tasks**\n\n"
        if oldest_list:
            answer += "**Oldest:**\n"
            for t in oldest_list:
                answer += (
                    f"• {t['title']} ({t['assigned_to'] or 'Unassigned'}) - {t['days']} days\n"
                )

        return {
            "success": True,
            "query_type": "pending_tasks",
            "answer": answer,
            "data": {"count": count, "oldest": oldest_list},
        }

    def _completed_tasks(self, query: str) -> dict:
        """Get completed tasks count"""
        count = self._base_queryset().filter(status="COMPLETED").count()
        return {
            "success": True,
            "query_type": "completed_tasks",
            "answer": f"✅ **{count} Completed Tasks**",
            "data": {"count": count},
        }

    def _stuck_tasks(self, query: str) -> dict:
        """Get stuck tasks"""
        stuck = self._base_queryset().filter(status="STUCK")
        count = stuck.count()

        stuck_list = [
            {
                "title": t.title,
                "assigned_to": t.assigned_to.name if t.assigned_to else t.assigned_to_name,
                "department": t.department,
            }
            for t in stuck[:5]
        ]

        answer = f"🚫 **{count} Stuck Tasks**\n\n"
        if stuck_list:
            for t in stuck_list:
                answer += (
                    f"• {t['title']} ({t['assigned_to'] or 'Unassigned'}) - {t['department']}\n"
                )

        return {
            "success": True,
            "query_type": "stuck_tasks",
            "answer": answer,
            "data": {"count": count, "tasks": stuck_list},
        }

    def _overdue_tasks(self, query: str) -> dict:
        """Get overdue tasks"""
        today = timezone.now().date()
        overdue = self._base_queryset().filter(
            deadline__lt=today, status__in=["PENDING", "STUCK", "NEED_FOUNDER"]
        )
        count = overdue.count()

        overdue_list = [
            {
                "title": t.title,
                "assigned_to": t.assigned_to.name if t.assigned_to else t.assigned_to_name,
                "days_overdue": (today - t.deadline).days,
            }
            for t in overdue.order_by("deadline")[:5]
        ]

        answer = f"⚠️ **{count} Overdue Tasks**\n\n"
        if overdue_list:
            for t in overdue_list:
                answer += f"• {t['title']} ({t['assigned_to'] or 'Unassigned'}) - {t['days_overdue']} days overdue\n"

        return {
            "success": True,
            "query_type": "overdue_tasks",
            "answer": answer,
            "data": {"count": count, "tasks": overdue_list},
        }

    def _tasks_by_department(self, query: str) -> dict:
        """Get tasks by department"""
        by_dept = (
            self._base_queryset()
            .values("department")
            .annotate(
                total=Count("id"),
                completed=Count("id", filter=Q(status="COMPLETED")),
                pending=Count("id", filter=Q(status="PENDING")),
            )
            .order_by("-total")
        )

        answer = "📊 **Tasks by Department:**\n\n"
        for d in by_dept:
            rate = round((d["completed"] / d["total"] * 100) if d["total"] > 0 else 0)
            answer += (
                f"**{d['department']}**: {d['total']} total ({d['completed']} done) - {rate}%\n"
            )

        return {
            "success": True,
            "query_type": "department_tasks",
            "answer": answer,
            "data": list(by_dept),
        }

    def _department_performance(self, query: str) -> dict:
        """Get department performance ranking"""
        by_dept = (
            self._base_queryset()
            .values("department")
            .annotate(total=Count("id"), completed=Count("id", filter=Q(status="COMPLETED")))
        )

        dept_perf = []
        for d in by_dept:
            rate = round((d["completed"] / d["total"] * 100) if d["total"] > 0 else 0, 1)
            dept_perf.append(
                {
                    "department": d["department"],
                    "total": d["total"],
                    "completed": d["completed"],
                    "rate": rate,
                }
            )

        dept_perf.sort(key=lambda x: x["rate"], reverse=True)

        answer = "🏆 **Department Performance:**\n\n"
        for i, d in enumerate(dept_perf[:5], 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            answer += f"{medal} {d['department']}: {d['rate']}% ({d['completed']}/{d['total']})\n"

        return {
            "success": True,
            "query_type": "department_performance",
            "answer": answer,
            "data": dept_perf,
        }

    def _tasks_by_urgency(self, query: str) -> dict:
        """Get tasks by urgency"""
        by_urgency = (
            self._base_queryset()
            .filter(status__in=["PENDING", "STUCK", "NEED_FOUNDER"])
            .values("urgency")
            .annotate(count=Count("id"))
        )
        urgency_data = {item["urgency"]: item["count"] for item in by_urgency}

        answer = "🔥 **Active Tasks by Urgency:**\n\n"
        emojis = {"URGENT": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}
        for u in ["URGENT", "HIGH", "MEDIUM", "LOW"]:
            answer += f"{emojis.get(u, '•')} {u}: {urgency_data.get(u, 0)}\n"

        return {
            "success": True,
            "query_type": "urgent_tasks",
            "answer": answer,
            "data": urgency_data,
        }

    def _who_has_most_pending(self, query: str) -> dict:
        """Find who has most pending tasks"""
        pending_by = {}
        for task in self._base_queryset().filter(status="PENDING"):
            name = task.assigned_to.name if task.assigned_to else task.assigned_to_name
            if name:
                pending_by[name] = pending_by.get(name, 0) + 1

        if not pending_by:
            return {
                "success": True,
                "query_type": "most_pending",
                "answer": "No pending tasks found!",
                "data": [],
            }

        sorted_pending = sorted(pending_by.items(), key=lambda x: x[1], reverse=True)

        answer = "⏳ **Pending Tasks by Person:**\n\n"
        for name, count in sorted_pending[:5]:
            answer += f"• {name}: {count} pending\n"

        return {
            "success": True,
            "query_type": "most_pending",
            "answer": answer,
            "data": [{"name": n, "pending": c} for n, c in sorted_pending[:5]],
        }

    def _average_completion_time(self, query: str) -> dict:
        """Calculate average completion time"""
        completed = self._base_queryset().filter(status="COMPLETED", completed_at__isnull=False)

        if not completed.exists():
            return {
                "success": True,
                "query_type": "completion_time",
                "answer": "No completed tasks with timing data.",
                "data": None,
            }

        total_days = sum((t.completed_at.date() - t.created_at.date()).days for t in completed)
        avg_days = round(total_days / completed.count(), 1)

        return {
            "success": True,
            "query_type": "completion_time",
            "answer": f"⏱️ **Average Completion Time: {avg_days} days**\n\nBased on {completed.count()} completed tasks.",
            "data": {"avg_days": avg_days, "count": completed.count()},
        }

    def _tasks_created_today(self, query: str) -> dict:
        """Get tasks created today"""
        today = timezone.now().date()
        count = self._base_queryset().filter(created_at__date=today).count()
        return {
            "success": True,
            "query_type": "tasks_today",
            "answer": f"📅 **{count} tasks created today**",
            "data": {"count": count},
        }

    def _tasks_created_this_week(self, query: str) -> dict:
        """Get tasks created this week"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        count = self._base_queryset().filter(created_at__date__gte=week_start).count()
        return {
            "success": True,
            "query_type": "tasks_this_week",
            "answer": f"📅 **{count} tasks this week** (since {week_start.strftime('%b %d')})",
            "data": {"count": count},
        }

    def _who_created_most(self, query: str) -> dict:
        """Find who created most tasks"""
        created_by = {}
        for task in self._base_queryset():
            if task.created_by:
                name = task.created_by.name
                created_by[name] = created_by.get(name, 0) + 1

        if not created_by:
            return {
                "success": True,
                "query_type": "most_created",
                "answer": "No task creation data.",
                "data": [],
            }

        sorted_creators = sorted(created_by.items(), key=lambda x: x[1], reverse=True)

        answer = "📝 **Tasks Created by Person:**\n\n"
        for name, count in sorted_creators[:5]:
            answer += f"• {name}: {count} tasks\n"

        return {
            "success": True,
            "query_type": "most_created",
            "answer": answer,
            "data": [{"name": n, "created": c} for n, c in sorted_creators[:5]],
        }

    def _tasks_for_person(self, query: str, person_name: str = None) -> dict:
        """Get tasks for a specific person"""
        if not person_name:
            # Try to extract from query
            patterns = [r"(?:for|of|assigned to)\s+(\w+)", r"(\w+)'s\s+task"]
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    person_name = match.group(1)
                    break

        if not person_name:
            return {
                "success": True,
                "query_type": "person_tasks",
                "answer": "Please specify a person. Example: 'Tasks for Pradip'",
                "data": None,
            }

        tasks = self._base_queryset().filter(
            Q(assigned_to__name__icontains=person_name) | Q(assigned_to_name__icontains=person_name)
        )
        total = tasks.count()
        completed = tasks.filter(status="COMPLETED").count()
        pending = tasks.filter(status="PENDING").count()

        rate = round((completed / total * 100), 1) if total > 0 else 0

        answer = f"👤 **Tasks for {person_name.title()}:**\n\n• Total: {total}\n• ✅ Completed: {completed}\n• ⏳ Pending: {pending}\n\n📊 Completion Rate: {rate}%"

        return {
            "success": True,
            "query_type": "person_tasks",
            "answer": answer,
            "data": {
                "person": person_name,
                "total": total,
                "completed": completed,
                "pending": pending,
                "rate": rate,
            },
        }

    def _completion_rate(self, query: str) -> dict:
        """Get completion rate"""
        total = self._base_queryset().count()
        completed = self._base_queryset().filter(status="COMPLETED").count()
        rate = round((completed / total * 100), 1) if total > 0 else 0

        return {
            "success": True,
            "query_type": "completion_rate",
            "answer": f"📊 **Completion Rate: {rate}%**\n\n{completed} completed out of {total} total.",
            "data": {"rate": rate, "completed": completed, "total": total},
        }

    def _need_founder_tasks(self, query: str) -> dict:
        """Get tasks needing founder intervention"""
        need_founder = self._base_queryset().filter(status="NEED_FOUNDER")
        count = need_founder.count()

        task_list = [
            {
                "title": t.title,
                "assigned_to": t.assigned_to.name if t.assigned_to else t.assigned_to_name,
                "urgency": t.urgency,
            }
            for t in need_founder[:5]
        ]

        answer = f"⚠️ **{count} Tasks Need Founder Intervention**\n\n"
        for t in task_list:
            emoji = "🔴" if t["urgency"] == "URGENT" else "🟠" if t["urgency"] == "HIGH" else "🟡"
            answer += f"{emoji} {t['title']} ({t['assigned_to'] or 'Unassigned'})\n"

        return {
            "success": True,
            "query_type": "need_founder",
            "answer": answer,
            "data": {"count": count, "tasks": task_list},
        }

    # =========================================================================
    # Order Handlers
    # =========================================================================

    def _total_orders(self, query: str) -> dict:
        """Get total orders"""
        orders = self._order_queryset()
        total = orders.count()
        with_advance = orders.filter(advance_payment_received="YES").count()
        without_advance = orders.filter(advance_payment_received="NO").count()

        answer = f"📦 **Total Orders: {total}**\n\n• ✅ With Advance: {with_advance}\n• ⏳ Without Advance: {without_advance}"
        return {
            "success": True,
            "query_type": "total_orders",
            "answer": answer,
            "data": {
                "total": total,
                "with_advance": with_advance,
                "without_advance": without_advance,
            },
        }

    def _orders_today(self, query: str) -> dict:
        """Get orders today"""
        today = timezone.now().date()
        count = self._order_queryset().filter(created_at__date=today).count()
        return {
            "success": True,
            "query_type": "orders_today",
            "answer": f"📦 **{count} orders today**",
            "data": {"count": count},
        }

    def _orders_this_week(self, query: str) -> dict:
        """Get orders this week"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        count = self._order_queryset().filter(created_at__date__gte=week_start).count()
        return {
            "success": True,
            "query_type": "orders_this_week",
            "answer": f"📦 **{count} orders this week**",
            "data": {"count": count},
        }

    def _orders_this_month(self, query: str) -> dict:
        """Get orders this month"""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        count = self._order_queryset().filter(created_at__date__gte=month_start).count()
        return {
            "success": True,
            "query_type": "orders_this_month",
            "answer": f"📦 **{count} orders this month**",
            "data": {"count": count},
        }

    def _orders_by_account(self, query: str) -> dict:
        """Get orders by customer"""
        by_account = (
            self._order_queryset()
            .filter(account__isnull=False)
            .values("account__account_name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        answer = "📦 **Orders by Customer (Top 10):**\n\n"
        for item in by_account:
            answer += f"• {item['account__account_name']}: {item['count']} orders\n"

        if not by_account:
            answer = "📦 No orders with customer data found."

        return {
            "success": True,
            "query_type": "orders_by_customer",
            "answer": answer,
            "data": list(by_account),
        }

    def _orders_with_advance(self, query: str) -> dict:
        """Get orders with advance payment"""
        orders = self._order_queryset().filter(advance_payment_received="YES")
        count = orders.count()

        recent = [
            {
                "bill_no": o.bill_no,
                "item": o.item_name or "N/A",
                "date": o.created_at.strftime("%b %d"),
            }
            for o in orders.order_by("-created_at")[:5]
        ]

        answer = f"✅ **{count} Orders with Advance**\n\n"
        if recent:
            answer += "**Recent:**\n"
            for o in recent:
                answer += f"• {o['bill_no']} - {o['item']} ({o['date']})\n"

        return {
            "success": True,
            "query_type": "orders_with_advance",
            "answer": answer,
            "data": {"count": count, "recent": recent},
        }

    def _orders_without_advance(self, query: str) -> dict:
        """Get orders without advance"""
        count = self._order_queryset().filter(advance_payment_received="NO").count()
        return {
            "success": True,
            "query_type": "orders_without_advance",
            "answer": f"⏳ **{count} Orders without Advance**\n\nPending advance collection.",
            "data": {"count": count},
        }

    def _recent_orders(self, query: str) -> dict:
        """Get recent orders"""
        orders = self._order_queryset().order_by("-created_at")[:10]

        order_list = [
            {
                "bill_no": o.bill_no,
                "item": o.item_name or "N/A",
                "account": o.account.account_name if o.account else "N/A",
                "date": o.created_at.strftime("%b %d"),
                "advance": o.advance_payment_received,
            }
            for o in orders
        ]

        answer = "📦 **Recent Orders:**\n\n"
        for o in order_list:
            status = "✅" if o["advance"] == "YES" else "⏳"
            answer += f"{status} {o['bill_no']} - {o['item']} ({o['account']})\n"

        return {
            "success": True,
            "query_type": "recent_orders",
            "answer": answer,
            "data": order_list,
        }

    def _order_value(self, query: str) -> dict:
        """Get order value stats"""
        orders = self._order_queryset()
        total = orders.count()
        avg_gold_rate = orders.aggregate(avg=Avg("gold_rate"))["avg"] or 0

        answer = f"💰 **Order Statistics:**\n\n• Total Orders: {total}\n• Avg Gold Rate: ₹{avg_gold_rate:,.2f}/g"
        return {
            "success": True,
            "query_type": "order_value",
            "answer": answer,
            "data": {"total": total, "avg_gold_rate": float(avg_gold_rate)},
        }

    # =========================================================================
    # Query (Customer Inquiry) Handlers
    # =========================================================================

    def _total_queries(self, query: str) -> dict:
        """Get total customer queries"""
        queries = self._query_queryset()
        total = queries.count()
        by_status = queries.values("status").annotate(count=Count("id"))
        status_breakdown = {item["status"]: item["count"] for item in by_status}

        answer = f"❓ **Total Customer Queries: {total}**\n\n"
        emojis = {"pending": "⏳", "converted_to_order": "✅", "archived": "📁", "rejected": "❌"}
        for status, count in status_breakdown.items():
            answer += f"{emojis.get(status, '•')} {status.replace('_', ' ').title()}: {count}\n"

        return {
            "success": True,
            "query_type": "total_queries",
            "answer": answer,
            "data": {"total": total, "by_status": status_breakdown},
        }

    def _pending_queries(self, query: str) -> dict:
        """Get pending queries"""
        queries = self._query_queryset().filter(status="pending")
        count = queries.count()

        recent = [
            {
                "account": q.account.account_name if q.account else "N/A",
                "item": q.item_name.name if q.item_name else q.item_name_custom or "N/A",
            }
            for q in queries.order_by("-created_at")[:5]
        ]

        answer = f"⏳ **{count} Pending Queries**\n\n"
        if recent:
            answer += "**Recent:**\n"
            for q in recent:
                answer += f"• {q['account']} - {q['item']}\n"

        return {
            "success": True,
            "query_type": "pending_queries",
            "answer": answer,
            "data": {"count": count, "recent": recent},
        }

    def _converted_queries(self, query: str) -> dict:
        """Get converted queries"""
        count = self._query_queryset().filter(status="converted_to_order").count()
        return {
            "success": True,
            "query_type": "converted_queries",
            "answer": f"✅ **{count} Queries Converted to Orders**",
            "data": {"count": count},
        }

    def _archived_queries(self, query: str) -> dict:
        """Get archived queries"""
        count = self._query_queryset().filter(status="archived").count()
        return {
            "success": True,
            "query_type": "archived_queries",
            "answer": f"📁 **{count} Archived Queries**",
            "data": {"count": count},
        }

    def _queries_today(self, query: str) -> dict:
        """Get queries today"""
        today = timezone.now().date()
        count = self._query_queryset().filter(created_at__date=today).count()
        return {
            "success": True,
            "query_type": "queries_today",
            "answer": f"❓ **{count} queries today**",
            "data": {"count": count},
        }

    def _queries_this_week(self, query: str) -> dict:
        """Get queries this week"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        count = self._query_queryset().filter(created_at__date__gte=week_start).count()
        return {
            "success": True,
            "query_type": "queries_this_week",
            "answer": f"❓ **{count} queries this week**",
            "data": {"count": count},
        }

    def _expiring_queries(self, query: str) -> dict:
        """Get expiring queries"""
        today = timezone.now().date()
        next_week = today + timedelta(days=7)

        expiring = self._query_queryset().filter(
            status="pending", expiry_date__gte=today, expiry_date__lte=next_week
        )
        count = expiring.count()

        expiring_list = [
            {
                "account": q.account.account_name if q.account else "N/A",
                "item": q.item_name.name if q.item_name else "N/A",
                "days_left": (q.expiry_date - today).days if q.expiry_date else 0,
            }
            for q in expiring[:5]
        ]

        answer = f"⚠️ **{count} Queries Expiring Soon** (7 days)\n\n"
        for q in expiring_list:
            answer += f"• {q['account']} - {q['item']} ({q['days_left']} days left)\n"

        return {
            "success": True,
            "query_type": "expiring_queries",
            "answer": answer,
            "data": {"count": count, "queries": expiring_list},
        }

    def _query_conversion_rate(self, query: str) -> dict:
        """Get query conversion rate"""
        queries = self._query_queryset()
        total = queries.count()
        converted = queries.filter(status="converted_to_order").count()
        rate = round((converted / total * 100), 1) if total > 0 else 0

        answer = f"📊 **Query Conversion Rate: {rate}%**\n\n• Total: {total}\n• Converted: {converted}\n• Pending: {queries.filter(status='pending').count()}"
        return {
            "success": True,
            "query_type": "query_conversion_rate",
            "answer": answer,
            "data": {"rate": rate, "total": total, "converted": converted},
        }

    def _queries_by_item(self, query: str) -> dict:
        """Get queries by item"""
        by_item = (
            self._query_queryset()
            .filter(item_name__isnull=False)
            .values("item_name__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        answer = "❓ **Popular Items (by queries):**\n\n"
        for item in by_item:
            answer += f"• {item['item_name__name']}: {item['count']} queries\n"

        if not by_item:
            answer = "❓ No query data by item found."

        return {
            "success": True,
            "query_type": "queries_by_item",
            "answer": answer,
            "data": list(by_item),
        }
