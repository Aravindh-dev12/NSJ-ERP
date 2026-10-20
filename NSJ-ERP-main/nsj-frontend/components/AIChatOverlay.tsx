"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Coins,
  Gem,
  Factory,
  FileSpreadsheet,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { useAuth } from "@/lib/auth";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  action_type?: string;
  actionData?: any;
  actionLink?: {
    label: string;
    href: string;
  };
}

interface AIChatOverlayProps {
  isVisible?: boolean;
}

export function AIChatOverlay({ isVisible = true }: AIChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "automations">("chat");
  const { user } = useAuth();

  const getGreeting = () => {
    if (user?.name) {
      return `Hi ${user.name}! 👋 I'm your NSJ AI Assistant & Workflow Copilot.`;
    }
    return "Hi there! 👋 Welcome to NSJ ERP.";
  };

  const initialWelcome = `${getGreeting()}

⚡ **AI Automations Available:**
• 📋 **Auto-Create Tasks** — *"Create task Polish 18K Ring for Production due tomorrow"*
• 💰 **Instant Jewelry Quotes** — *"Calculate quote for 14.5g 22K with 12% making charges"*
• 📅 **Daily Work Planner** — *"What should I work on today?"*
• 🚨 **Bottleneck Scanner** — *"Scan system bottlenecks and delayed orders"*
• 🔄 **Task Status Updates** — *"Mark task 'Ring Polishing' as completed"*

Tap **⚡ AI Automations** above for 1-click tools, or type your request below!`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: initialWelcome,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeTab]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  // Local knowledge-base answers for quick offline / common lookups
  const getKnowledgeResponse = (
    query: string
  ): { text: string; actionLink?: { label: string; href: string } } | null => {
    const q = query.toLowerCase().trim();

    // Sign in credentials
    if (
      q === "how do i sign in?" ||
      q === "login" ||
      q === "sign in" ||
      q === "credentials"
    ) {
      return {
        text: `🔐 **NSJ ERP Access Credentials:**\n\n• **Founder / Management:**\n  Email: \`niti@nsj.com\`\n  Password: \`admin123\`\n\n• **Superuser Admin:**\n  Email: \`admin123@gmail.com\`\n  Password: \`admin123\`\n\nClick below to open the Sign In portal.`,
        actionLink: { label: "Go to Sign In Page →", href: "/login" },
      };
    }

    // Sign up / Registration
    if (
      q === "sign up" ||
      q === "register" ||
      q === "how to create account"
    ) {
      return {
        text: `📝 **Create a New NSJ Account:**\n\nYou can register a new team member with your name, email, department, and password.\n\nDepartment roles available:\n• Administration\n• Accounts\n• Sales\n• Production\n• Inventory\n\nClick below to open the Sign Up page.`,
        actionLink: { label: "Go to Sign Up Page →", href: "/register" },
      };
    }

    // Production steps overview
    if (q === "explain jewelry production workflow" || q === "production workflow") {
      return {
        text: `🏭 **NSJ 7-Stage Production Lifecycle:**\n\n1. **3D CAD Design & Rendering** — Matrix/Rhino jewelry modeling\n2. **CAM 3D Wax Resin Printing** — Precision micro-detail printing\n3. **Casting & Tree Assembly** — Vacuum gold/platinum induction\n4. **Filing, Pre-Polish & Assembly** — Master craftsmanship hand-finish\n5. **Diamond & Gemstone Micro-Setting** — Microscope prong/pave setting\n6. **Final Polish & Ultrasonic Bath** — Mirror finish & rhodium plating\n7. **BIS Hallmarking & Quality Check** — Laser hallmark verification`,
        actionLink: { label: "Open Production Module", href: user ? "/production" : "/login" },
      };
    }

    return null;
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: queryText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setActiveTab("chat"); // Switch to chat view to see response

    // Check fast static knowledge-base if simple informational question
    const localMatch = getKnowledgeResponse(queryText.trim());
    if (localMatch) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: localMatch.text,
            timestamp: new Date(),
            actionLink: localMatch.actionLink,
          },
        ]);
        setIsLoading(false);
      }, 250);
      return;
    }

    // Call the AI Automation Engine API endpoint
    try {
      const response = await fetch(`/api/tasks/nlp_query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: queryText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              type: "assistant",
              content: data.answer,
              timestamp: new Date(),
              action_type: data.action_type,
              actionData: data.task || data.quote,
              actionLink: data.actionLink || {
                label: "Open Dashboard",
                href: user ? "/dashboard" : "/login",
              },
            },
          ]);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("AI Automation Engine query error:", err);
    }

    // Fallback response if offline
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `I received your request: "${queryText.trim()}".\n\nI can execute task creations, jewelry quotations, bottleneck scans, and status updates for your team.`,
          timestamp: new Date(),
          actionLink: { label: "Go to Dashboard", href: user ? "/dashboard" : "/login" },
        },
      ]);
      setIsLoading(false);
    }, 400);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        type: "assistant",
        content: `Chat cleared! ${getGreeting()} How can I assist or automate your jewelry workflow?`,
        timestamp: new Date(),
      },
    ]);
  };

  const quickQuestions = [
    { label: "💰 22K Gold Quote", query: "Calculate quote for 15g 22K with 12% making charges" },
    { label: "📋 My Tasks Today", query: "What should I work on today?" },
    { label: "🚨 Scan Bottlenecks", query: "Scan system bottlenecks and delayed orders" },
    { label: "➕ Create Task", query: "Create task Polish 18K Ring for Production due tomorrow urgency High" },
    { label: "🔄 Mark Complete", query: "Mark my most recent task as completed" },
    { label: "📊 Team Workload", query: "Who completed the most tasks this month?" },
  ];

  const automationPresets = [
    {
      category: "Task Management Automation",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      items: [
        {
          title: "Create Production Task",
          desc: "Schedule 3D wax CAD printing or casting task",
          query: "Create task 3D Wax CAD Print for Production due tomorrow urgency High",
        },
        {
          title: "Create Accounts Follow-up",
          desc: "Automate invoice or payment collection task",
          query: "Create task Follow up on client payment for Accounts due today urgency Urgent",
        },
        {
          title: "Complete Recent Task",
          desc: "Auto-transition active task to COMPLETED",
          query: "Mark my most recent task as completed",
        },
      ],
    },
    {
      category: "Pricing & Sales Quotation",
      icon: Calculator,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      items: [
        {
          title: "22K Jewelry Quote (15g)",
          desc: "Real-time metal rate + 12% making charges + 3% GST",
          query: "Calculate quote for 15g 22K with 12% making charges",
        },
        {
          title: "18K Diamond Jewelry Quote (8.5g)",
          desc: "Fine gold quote with 15% custom craftsmanship",
          query: "Calculate quote for 8.5g 18K with 15% making charges",
        },
        {
          title: "24K Bullion Bar (50g)",
          desc: "Pure bullion valuation with 3% investment GST",
          query: "Calculate quote for 50g 24K with 2% making charges",
        },
      ],
    },
    {
      category: "Operations & Bottleneck Scanner",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      items: [
        {
          title: "Scan Production Bottlenecks",
          desc: "Identify stuck jobs, delayed casting, and overdue tasks",
          query: "Scan system bottlenecks and delayed orders",
        },
        {
          title: "Employee Daily Standup",
          desc: "Generate your prioritized task checklist for today",
          query: "What should I work on today?",
        },
        {
          title: "Team Performance & Velocity",
          desc: "Analyze task completion leaderboards across departments",
          query: "Who completed the most tasks this month?",
        },
      ],
    },
  ];

  return (
    <>
      {/* Floating Action Button with NSJ Logo */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip badge visible on hover when closed */}
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/95 border border-amber-300 px-3.5 py-1.5 text-xs text-slate-800 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-right-3 duration-200 pointer-events-none">
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span className="font-bold text-slate-900">NSJ AI Automations</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          className={cn(
            "relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95",
            isOpen
              ? "bg-slate-900 text-white border-2 border-slate-700 hover:bg-slate-800"
              : "bg-white border-2 border-amber-500 shadow-[0_8px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_35px_rgba(245,158,11,0.5)] ring-4 ring-amber-400/20"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              {/* NSJ Logo inside floating button */}
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-full border border-amber-400 bg-white p-0.5 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="NSJ ERP"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Online Green Indicator Dot */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>

              {/* Automation Lightning Badge */}
              <div className="absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 border border-amber-300 shadow">
                ⚡
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Window Modal - White Theme with AI Automations */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="NSJ ERP AI Assistant & Automation Center"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[620px] max-h-[88vh] w-[95vw] sm:w-[440px] max-w-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-amber-400 bg-white p-0.5 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="NSJ"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    NSJ AI Copilot
                  </h3>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300">
                    <Zap className="h-2.5 w-2.5 fill-amber-500 text-amber-600" />
                    <span>Automations</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {user?.name ? `Signed in: ${user.name} (${user.department || "Team"})` : "Employee Workflow & System AI"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs: Chat vs. 1-Click Automations */}
          <div className="flex items-center border-b border-slate-200 bg-slate-100/70 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all",
                activeTab === "chat"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>AI Chat Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab("automations")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all",
                activeTab === "automations"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              <span>⚡ 1-Click Automations</span>
            </button>
          </div>

          {/* Quick Shortcuts Bar (Visible in chat mode) */}
          {activeTab === "chat" && (
            <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 bg-slate-50/80 border-b border-slate-200 text-[11px] scrollbar-none">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuery(q.query)}
                  className="whitespace-nowrap rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400 border border-slate-200 px-2.5 py-1 text-slate-700 font-medium transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                >
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* MAIN BODY: Chat View OR 1-Click Automations View */}
          {activeTab === "chat" ? (
            /* Messages Container */
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    message.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400 bg-white p-0.5 shadow-sm">
                      <Image
                        src="/logo.png"
                        alt="NSJ"
                        width={22}
                        height={22}
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm",
                      message.type === "user"
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none"
                        : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm"
                    )}
                  >
                    {/* Rich Interactive Action Card if Task Created */}
                    {message.action_type === "TASK_CREATED" && message.actionData && (
                      <div className="mb-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-slate-900 shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs mb-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Task Registered in ERP Database</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-700">
                          <div>
                            <span className="font-semibold">Task:</span> {message.actionData.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              {message.actionData.department}
                            </span>
                            <span className="rounded bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              {message.actionData.urgency}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Due: {message.actionData.deadline}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rich Interactive Action Card if Quote Calculated */}
                    {message.action_type === "QUOTE_CALCULATED" && message.actionData && (
                      <div className="mb-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-slate-900 shadow-sm">
                        <div className="flex items-center justify-between text-xs mb-1.5 border-b border-amber-200/80 pb-1">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5 text-amber-600" />
                            Gold {message.actionData.purity} • {message.actionData.weight_grams}g
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Rate: ₹{message.actionData.rate_per_gram?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-[11px] font-medium text-slate-600">Total with 3% GST:</span>
                          <span className="text-sm font-extrabold text-amber-900">
                            ₹{message.actionData.grand_total?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Optional action link button */}
                    {message.actionLink && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <Link
                          href={message.actionLink.href}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-xs font-bold transition-all shadow-sm"
                        >
                          <span>{message.actionLink.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}

                    <div className="mt-1 text-right text-[10px] text-slate-400">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2.5 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400 bg-white p-0.5 shadow-sm">
                    <Image
                      src="/logo.png"
                      alt="NSJ"
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-xs text-slate-600 rounded-bl-none border border-slate-200 shadow-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                    <span>Executing AI automation...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* 1-Click Automations Catalog View */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80">
              <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <Zap className="h-4 w-4 text-amber-600 fill-amber-400" />
                  <span>Employee AI Automation Hub</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tap any card to instantly execute the automated workflow in the ERP database.
                </p>
              </div>

              {automationPresets.map((category, cIdx) => (
                <div key={cIdx} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <category.icon className="h-4 w-4 text-slate-600" />
                    <span>{category.category}</span>
                  </div>

                  <div className="space-y-1.5">
                    {category.items.map((item, iIdx) => (
                      <button
                        key={iIdx}
                        onClick={() => sendQuery(item.query)}
                        className="w-full text-left rounded-xl border border-slate-200 bg-white p-2.5 hover:border-amber-400 hover:bg-amber-50/40 transition-all shadow-sm group active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900 group-hover:text-amber-800">
                            {item.title}
                          </span>
                          <span className="rounded-full bg-slate-100 group-hover:bg-amber-200/60 p-1 text-slate-400 group-hover:text-amber-900 transition-colors">
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Input Area */}
          <div className="border-t border-slate-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuery(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask or automate: 'Create task...', 'Quote 15g 22K'..."
                className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send query"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                  input.trim() && !isLoading
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:from-amber-600 hover:to-yellow-700 shadow"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
              <span>NSJ AI Copilot & Automations</span>
              <span className="text-amber-700 font-semibold">Active & Online</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
