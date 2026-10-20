"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Coins,
  Gem,
  Factory,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  LogIn,
  UserPlus,
  KeyRound,
  Bot,
  ChevronRight,
  Check,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenChat = () => {
    const chatBtn = document.querySelector(
      'button[aria-label="Open AI Assistant"]'
    ) as HTMLButtonElement;
    if (chatBtn) {
      chatBtn.click();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2 text-center text-xs font-semibold text-slate-950 tracking-wide flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-slate-950 animate-pulse" />
        <span>NSJ Jewelry Enterprise ERP System • Full-Stack Production, Inventory & Accounting</span>
        <span className="hidden sm:inline-block rounded-full bg-slate-950/15 px-2 py-0.5 text-[10px] font-bold">
          v2.0 Live
        </span>
      </div>

      {/* 2. MAIN HEADER (NAVBAR - WHITE THEME) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300 bg-white p-1 shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="NSJ ERP Logo"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  NSJ ERP
                </span>
                <span className="rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  JEWELS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Enterprise Resource Planning</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#modules" className="hover:text-amber-600 transition-colors">
              Modules
            </a>
            <a href="#production" className="hover:text-amber-600 transition-colors">
              Production Workflow
            </a>
            <a href="#rates" className="hover:text-amber-600 transition-colors">
              Live Rates
            </a>
            <button
              onClick={handleOpenChat}
              className="flex items-center gap-1.5 hover:text-amber-600 transition-colors text-slate-600 font-semibold"
            >
              <Bot className="h-4 w-4 text-amber-600" />
              <span>AI Assistant</span>
            </button>
          </nav>

          {/* Right Action: Sign In, Sign Up, or Dashboard */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Online</span>
            </div>

            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-block text-xs text-slate-600">
                  Welcome, <span className="font-bold text-slate-900">{user.name || user.email}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:from-amber-600 hover:to-yellow-700 hover:shadow-lg transition-all"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 transition-colors"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (WHITE THEME) */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24 bg-gradient-to-b from-amber-50/40 via-white to-slate-50/60">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Intelligent Jewelry Enterprise Platform</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-950 leading-tight">
            Precision Management for{" "}
            <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
              Fine Jewelry Operations
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From pure 24K gold bullion and certified diamond inventory to 3D CAD casting, 
            seven-step workshop quality assurance, and automated voucher accounting — with integrated AI assistance.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-yellow-700 hover:scale-105 active:scale-95 transition-all"
            >
              <LogIn className="h-5 w-5" />
              <span>{user ? "Open ERP Dashboard" : "Sign In to ERP Portal"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/50 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-800 shadow-sm transition-all active:scale-95"
            >
              <UserPlus className="h-5 w-5 text-amber-600" />
              <span>Create Account (Sign Up)</span>
            </Link>

            <button
              onClick={handleOpenChat}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 px-5 py-3.5 text-sm sm:text-base font-bold text-amber-900 shadow-sm transition-all active:scale-95"
            >
              <Bot className="h-5 w-5 text-amber-600" />
              <span>Ask AI Assistant</span>
            </button>
          </div>

          {/* Quick Sign-In Credentials Card (White Theme) */}
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                  Quick Sign-In Access Credentials
                </h3>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium">
                Tap to copy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Founder Account */}
              <div
                onClick={() => handleCopy("niti@nsj.com", "founder")}
                className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/50 p-3 hover:bg-amber-100/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">👑 Founder / Admin</span>
                  {copiedKey === "founder" ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Copied!
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700">Copy</span>
                  )}
                </div>
                <div className="mt-2 text-slate-700 space-y-0.5 font-mono">
                  <p>Email: <span className="text-slate-950 font-bold">niti@nsj.com</span></p>
                  <p>Pass: <span className="text-slate-950 font-bold">admin123</span></p>
                </div>
              </div>

              {/* Superuser Account */}
              <div
                onClick={() => handleCopy("admin123@gmail.com", "superuser")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">⚡ Superuser / Tech</span>
                  {copiedKey === "superuser" ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Copied!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Copy</span>
                  )}
                </div>
                <div className="mt-2 text-slate-700 space-y-0.5 font-mono">
                  <p>Email: <span className="text-slate-950 font-bold">admin123@gmail.com</span></p>
                  <p>Pass: <span className="text-slate-950 font-bold">admin123</span></p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <Link
                href="/login"
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>Go to Sign In</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/register"
                className="font-bold text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
              >
                <span>Or Create New Account</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE RATES TICKER (WHITE THEME) */}
      <section id="rates" className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 tracking-wider uppercase">
              <Coins className="h-4 w-4 text-amber-600" />
              <span>Live Indicative Daily Metal Rates</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full md:w-auto">
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/90 px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-600">Gold 24K (99.9%)</p>
                <p className="text-base font-extrabold text-amber-700">₹7,450 / g</p>
              </div>
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/90 px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-600">Gold 22K (Jewelry)</p>
                <p className="text-base font-extrabold text-amber-700">₹6,830 / g</p>
              </div>
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/90 px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-600">Gold 18K (Diamond)</p>
                <p className="text-base font-extrabold text-amber-700">₹5,590 / g</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold text-slate-600">Fine Silver 999</p>
                <p className="text-base font-extrabold text-slate-800">₹89,500 / kg</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORE MODULES GRID (WHITE THEME) */}
      <section id="modules" className="py-16 sm:py-24 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
              Complete Business Coverage
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-950">
              Enterprise Modules Built for Jewelry
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal">
              Engineered for manufacturing precision, metal tunch weight reconciliation, diamond sieve lotting, and multi-department collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-4 border border-amber-200">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Accounting & Vouchers</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Full-featured Receipt, Payment, Journal, and Contra vouchers. Generate automated GST tax invoices with exact gold and gemstone weights.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>PDF Tax Invoices & Customer Estimates</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Cash & Bank Ledger Statements</span>
                </li>
              </ul>
            </div>

            {/* Module 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-4 border border-indigo-200">
                <Factory className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Production & Manufacturing</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tracks each job through 7 stages: CAD 3D design, CAM resin printing, Ghat casting, diamond bagging, setting, polishing, and final QC.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Metal Issue & Receive Reconciliation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Setter Diamond Bagging Logs</span>
                </li>
              </ul>
            </div>

            {/* Module 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 mb-4 border border-cyan-200">
                <Gem className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Diamonds & Raw Materials</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Granular inventory of certified loose diamonds, gemstones, pearls, and pure bullion. Tracks cut, clarity, color, and carat weights.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Real-time Vault Valuation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Purchase & Vendor History</span>
                </li>
              </ul>
            </div>

            {/* Module 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-yellow-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 mb-4 border border-yellow-200">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Daily Gold Rate Engine</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Feeds daily market metal rates across 24K, 22K, 20K, 18K, 14K, and 10K. Automatically updates cost calculations on orders.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Historical Rate Charts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Party-specific Gold Rate Profiles</span>
                </li>
              </ul>
            </div>

            {/* Module 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-rose-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mb-4 border border-rose-200">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sales CRM & Custom Orders</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Log customer inquiries, design references, and photo uploads. Convert sales queries directly into estimates and confirmed job orders.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Customer Follow-Up Timeline</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Estimate-to-Order Conversion</span>
                </li>
              </ul>
            </div>

            {/* Module 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-4 border border-purple-200">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Intelligent AI Assistant</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Floating conversational assistant ready 24/7. Ask questions in natural language about tasks, orders, vouchers, or rates.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Instant Natural Language Query Engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Floating Logo Icon on All Pages</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRODUCTION WORKFLOW SECTION (WHITE THEME) */}
      <section id="production" className="border-t border-slate-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
              End-to-End Workflow
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-950">
              7 Stages of Jewelry Craftsmanship
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Real-time accountability with photo verification, weight checks, and sign-offs at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Customer Query & Estimate", desc: "Design specs, gold purity, stone carat estimates" },
              { step: "02", title: "3D CAD Modeling", desc: "Matrix/Rhino 3D CAD design approval & 3D CAM resin printing" },
              { step: "03", title: "Ghat Casting & Inspection", desc: "Gold casting, gross weight check, and metal purity validation" },
              { step: "04", title: "Diamond & Stone Bagging", desc: "Precision stone allocation & setter assignment" },
              { step: "05", title: "Master Setting", desc: "Prong, channel, pave setting & microscopic alignment" },
              { step: "06", title: "Pre-Rhodium & Polish", desc: "Surface buffing, ultrasonic cleaning, and rhodium plating" },
              { step: "07", title: "Final QC & Dispatch", desc: "Hallmark verification, packaging, and tax invoice generation" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-3xl font-extrabold text-amber-500/20 absolute top-3 right-4">
                  {item.step}
                </span>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Step {item.step}</p>
                <h4 className="mt-1 text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}

            {/* Quick action card */}
            <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white p-5 flex flex-col justify-between shadow-sm">
              <div>
                <Sparkles className="h-6 w-6 text-amber-600" />
                <h4 className="mt-2 text-sm font-bold text-slate-900">Track Order Progress</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Log in or sign up to inspect active workshop stages and assignee status.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  <span>Sign In</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  <span>Sign Up</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALLOUT BANNER / "TOP FOOTER" ASSISTANT PROMPT (WHITE THEME) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-white p-1.5 shadow-md">
                <Image
                  src="/logo.png"
                  alt="NSJ"
                  width={52}
                  height={52}
                  className="object-contain"
                />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Have Questions? Ask Our AI Assistant</span>
                  <span className="text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-300 bg-amber-100 font-bold">
                    Live
                  </span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
                  Look for the floating NSJ logo in the bottom right corner of your screen at any time to check gold rates, production progress, or voucher steps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleOpenChat}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:from-amber-600 hover:to-yellow-700 transition-all active:scale-95"
              >
                <Bot className="h-4 w-4" />
                <span>Launch Assistant Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE FOOTER (WHITE / LIGHT THEME) */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-12 text-slate-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-white p-0.5 border border-amber-300 shadow-sm flex items-center justify-center">
                  <Image src="/logo.png" alt="NSJ" width={28} height={28} className="object-contain" />
                </div>
                <span className="font-bold text-base text-slate-900">NSJ ERP</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Niti Shah Jewels Enterprise System. Purpose-built resource planning for jewelry designers, manufacturers, wholesalers, and luxury retailers.
              </p>
              <div className="mt-3 text-[11px] text-amber-700 font-bold">
                Crafting Excellence with Technology
              </div>
            </div>

            {/* Col 2: Core Modules */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                ERP Modules
              </h4>
              <ul className="space-y-2">
                <li><Link href={user ? "/vouchers" : "/login"} className="hover:text-amber-600 transition-colors">Vouchers & Accounting</Link></li>
                <li><Link href={user ? "/process" : "/login"} className="hover:text-amber-600 transition-colors">Manufacturing & CAD</Link></li>
                <li><Link href={user ? "/gold-rates" : "/login"} className="hover:text-amber-600 transition-colors">Daily Gold Price Feeding</Link></li>
                <li><Link href={user ? "/raw-material-purchase" : "/login"} className="hover:text-amber-600 transition-colors">Diamond & Gemstone Vault</Link></li>
                <li><Link href={user ? "/daily-log" : "/login"} className="hover:text-amber-600 transition-colors">Tasks & Performance Logs</Link></li>
              </ul>
            </div>

            {/* Col 3: Portal Access */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Portal Access
              </h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-amber-600 transition-colors font-bold text-amber-700">Sign In to Account →</Link></li>
                <li><Link href="/register" className="hover:text-amber-600 transition-colors font-bold text-slate-800">Create Account (Sign Up) →</Link></li>
                <li><Link href={user ? "/dashboard" : "/login"} className="hover:text-amber-600 transition-colors">Founder Dashboard</Link></li>
                <li><button onClick={handleOpenChat} className="text-left hover:text-amber-600 transition-colors">Ask AI Assistant</button></li>
              </ul>
            </div>

            {/* Col 4: System Architecture */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                System Environment
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Frontend: Next.js 14 (Port 3000)</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Backend: Django 5.2 REST (Port 8001)</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Database: SQLite / PostgreSQL</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Network Access: 10.118.205.103</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 Niti Shah Jewels (NSJ ERP). All rights reserved.</p>
            <p className="font-medium text-slate-600">Designed for Luxury Jewelry Manufacturing & Wholesale</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
