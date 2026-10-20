"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  RotateCcw,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const { user } = useAuth();

  const getGreeting = () => {
    if (user?.name) {
      return `Welcome, ${user.name}. How can I assist you today?`;
    }
    return "Welcome to NSJ ERP. How can I assist you today?";
  };

  const initialWelcome = `${getGreeting()}

You can ask me to:
• Check live gold and metal rates
• Create and assign tasks for your team
• Calculate jewelry price and quotation estimates
• Review your daily pending tasks and schedule
• Check system bottlenecks and delayed orders`;

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
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  // Local knowledge-base answers for standard questions
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
        text: `**NSJ ERP Access Credentials:**\n\n• **Founder / Management:**\n  Email: \`niti@nsj.com\`\n  Password: \`admin123\`\n\n• **Superuser Admin:**\n  Email: \`admin123@gmail.com\`\n  Password: \`admin123\`\n\nClick below to open the Sign In portal.`,
        actionLink: { label: "Go to Sign In Page", href: "/login" },
      };
    }

    // Sign up / Registration
    if (
      q === "sign up" ||
      q === "register" ||
      q === "how to create account"
    ) {
      return {
        text: `**Create a New Account:**\n\nYou can register a new team member with your name, email, department, and password.\n\nDepartment roles:\n• Administration\n• Accounts\n• Sales\n• Production\n• Inventory\n\nClick below to register.`,
        actionLink: { label: "Go to Sign Up Page", href: "/register" },
      };
    }

    // Production steps overview
    if (q === "explain jewelry production workflow" || q === "production workflow") {
      return {
        text: `**NSJ 7-Stage Production Lifecycle:**\n\n1. **3D CAD Design & Rendering** — Matrix/Rhino jewelry modeling\n2. **CAM 3D Wax Resin Printing** — Precision micro-detail printing\n3. **Casting & Tree Assembly** — Vacuum gold/platinum induction\n4. **Filing & Pre-Polish** — Master craftsmanship hand-finish\n5. **Diamond & Gemstone Setting** — Microscope prong/pave setting\n6. **Final Polish & Ultrasonic Bath** — Mirror finish & rhodium plating\n7. **BIS Hallmarking & Quality Check** — Laser hallmark verification`,
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

    // Fast local knowledge lookup
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

    // Backend query execution
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
      console.warn("Assistant query error:", err);
    }

    // Fallback response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `I received your request: "${queryText.trim()}". You can view active tasks or records directly in the dashboard.`,
          timestamp: new Date(),
          actionLink: { label: "Go to Dashboard", href: user ? "/dashboard" : "/login" },
        },
      ]);
      setIsLoading(false);
    }, 300);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        type: "assistant",
        content: `Chat cleared. ${getGreeting()}`,
        timestamp: new Date(),
      },
    ]);
  };

  const quickShortcuts = [
    { label: "Gold Rates", query: "What are today's gold rates?" },
    { label: "Today's Tasks", query: "What should I work on today?" },
    { label: "Jewelry Quote", query: "Calculate quote for 15g 22K with 12% making charges" },
    { label: "Bottlenecks", query: "Scan system bottlenecks and delayed orders" },
    { label: "Create Task", query: "Create task Polish 18K Ring for Production due tomorrow urgency High" },
  ];

  return (
    <>
      {/* Floating Action Button - Clean Minimal White Theme with Official Logo */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Assistant" : "Open Assistant"}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95",
            isOpen
              ? "bg-slate-900 text-white shadow-lg"
              : "bg-white border border-slate-300 shadow-md hover:shadow-lg"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="relative h-10 w-10 overflow-hidden rounded-full p-0.5">
                <Image
                  src="/logo.png"
                  alt="NSJ ERP"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Online Green Indicator Dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Window Modal - Clean Minimal White Theme */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="NSJ ERP Assistant"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[600px] max-h-[85vh] w-[92vw] sm:w-[420px] max-w-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white p-0.5">
                <Image
                  src="/logo.png"
                  alt="NSJ"
                  width={34}
                  height={34}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                  NSJ Assistant
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  {user?.name ? `${user.name} • ${user.department || "Operations"}` : "Enterprise Operations & Guidance"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Bar - Clean Flex Wrap (No Horizontal Scrollbar) */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs overflow-x-hidden">
            {quickShortcuts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(s.query)}
                className="rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 text-slate-700 text-[11px] font-medium transition-colors shadow-2xs"
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Container - No Horizontal Scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.type === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0.5">
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
                    "max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed break-words overflow-hidden",
                    message.type === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-900 border border-slate-200"
                  )}
                >
                  {/* Clean Structured Card if Task Created */}
                  {message.action_type === "TASK_CREATED" && message.actionData && (
                    <div className="mb-2.5 rounded-lg border-l-4 border-slate-900 bg-white p-2.5 border border-slate-200 shadow-2xs">
                      <div className="font-semibold text-xs text-slate-900 mb-1">
                        Task Registered in System
                      </div>
                      <div className="text-xs space-y-0.5 text-slate-600">
                        <div><span className="font-medium text-slate-800">Title:</span> {message.actionData.title}</div>
                        <div><span className="font-medium text-slate-800">Department:</span> {message.actionData.department}</div>
                        <div><span className="font-medium text-slate-800">Priority:</span> {message.actionData.urgency}</div>
                        <div><span className="font-medium text-slate-800">Due:</span> {message.actionData.deadline}</div>
                      </div>
                    </div>
                  )}

                  {/* Clean Structured Card if Quote Calculated */}
                  {message.action_type === "QUOTE_CALCULATED" && message.actionData && (
                    <div className="mb-2.5 rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-xs pb-1 mb-1 border-b border-slate-100">
                        <span className="font-semibold text-slate-900">
                          Gold {message.actionData.purity} ({message.actionData.weight_grams}g)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Rate: ₹{message.actionData.rate_per_gram?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-xs text-slate-600">Estimated Total:</span>
                        <span className="text-sm font-bold text-slate-900">
                          ₹{message.actionData.grand_total?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Action link */}
                  {message.actionLink && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <Link
                        href={message.actionLink.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-xs font-medium transition-colors"
                      >
                        <span>{message.actionLink.label}</span>
                        <ArrowRight className="h-3 w-3" />
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0.5">
                  <Image
                    src="/logo.png"
                    alt="NSJ"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600 border border-slate-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="border-t border-slate-200 bg-white p-3 overflow-x-hidden">
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
                placeholder="Ask about rates, orders, tasks..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  input.trim() && !isLoading
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>NSJ Assistant</span>
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
