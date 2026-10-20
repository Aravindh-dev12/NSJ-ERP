"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Factory,
  Gem,
  FileSpreadsheet,
  Layers,
  CheckSquare,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

  const handleOpenChat = () => {
    const chatBtn = document.querySelector(
      'button[aria-label="Open Assistant"]'
    ) as HTMLButtonElement;
    if (chatBtn) {
      chatBtn.click();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* 1. MINIMAL WHITE HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
              <Image
                src="/logo.png"
                alt="NSJ ERP"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                NSJ ERP
              </span>
              <span className="text-xs text-slate-500 block -mt-0.5">Enterprise System</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#rates" className="hover:text-slate-900 transition-colors">
              Live Rates
            </a>
            <a href="#modules" className="hover:text-slate-900 transition-colors">
              Modules
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Production
            </a>
            <button
              onClick={handleOpenChat}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Assistant
            </button>
          </nav>

          {/* Header Action: Dashboard button only (routes to /login if not authenticated) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {loading ? (
              <div className="h-8 w-24 rounded bg-slate-100 animate-pulse" />
            ) : (
              <Link
                href={user ? "/dashboard" : "/login"}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors shadow-xs"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. SIMPLE HERO SECTION */}
      <section className="bg-white py-16 sm:py-24 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-tight">
            Jewelry Enterprise Management System
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Integrated operations for fine jewelry manufacturing, certified diamond inventory, 
            gold bullion accounting, and customer order fulfillment.
          </p>

          {/* Action: Single Dashboard button (routes to /login if not logged in) */}
          <div className="mt-8 flex items-center justify-center">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-sm font-medium text-white transition-colors shadow-2xs"
            >
              <span>Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. LIVE METAL RATES (CLEAN WHITE TABLE) */}
      <section id="rates" className="bg-slate-50/50 py-12 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Today's Metal Market Rates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Benchmark rates used across voucher calculations and client estimates.
              </p>
            </div>
            <span className="mt-2 sm:mt-0 text-xs text-slate-500">Updated Daily</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { metal: "Gold 24K", purity: "99.9% Pure", rate: "₹7,450 / g" },
              { metal: "Gold 22K", purity: "Jewelry Standard", rate: "₹6,830 / g" },
              { metal: "Gold 18K", purity: "Diamond Jewelry", rate: "₹5,590 / g" },
              { metal: "Gold 14K", purity: "Export Quality", rate: "₹4,340 / g" },
              { metal: "Fine Silver", purity: "99.9% Pure", rate: "₹89.50 / g" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
              >
                <div className="text-xs font-semibold text-slate-900">{item.metal}</div>
                <div className="text-[11px] text-slate-500">{item.purity}</div>
                <div className="mt-2 text-sm font-bold text-slate-950">{item.rate}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE MODULES (CLEAN WHITE CARDS) */}
      <section id="modules" className="bg-white py-16 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Enterprise Modules
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              End-to-end tooling designed specifically for fine jewelry business workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Factory,
                title: "Workshop Production & Casting",
                desc: "3D CAD matrix designs, CAM wax printing, vacuum casting, filing, stone setting, polish, and hallmarking.",
              },
              {
                icon: Gem,
                title: "Diamond & Stone Inventory",
                desc: "Carat weight, color, clarity, cut tracking with lab certificate verification (GIA/IGI) and vault audits.",
              },
              {
                icon: FileSpreadsheet,
                title: "Accounting & GST Invoices",
                desc: "Receipt vouchers, payment vouchers, contra entries, journal adjustments, and tax invoices with metal balance ledgers.",
              },
              {
                icon: Layers,
                title: "Custom & Stock Orders",
                desc: "Bespoke design specifications, stock jewelry catalog, stage-by-stage artisan tracking, and delivery dispatch.",
              },
              {
                icon: CheckSquare,
                title: "Task & Workflow Coordination",
                desc: "Departmental task assignment, priority deadlines, status tracking, bottleneck detection, and daily work plans.",
              },
              {
                icon: TrendingUp,
                title: "Bullion & Master Data",
                desc: "Daily gold price logs, party-specific rate contracts, customer master databases, and department permissions.",
              },
            ].map((mod, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 mb-3">
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRODUCTION WORKFLOW (CLEAN 7-STEP LIFECYCLE) */}
      <section id="workflow" className="bg-slate-50/50 py-16 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Production Lifecycle
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Standardized seven-stage workshop manufacturing process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: "01", title: "CAD Modeling", desc: "3D CAD modeling and rendering in Rhino & Matrix." },
              { step: "02", title: "CAM Wax Print", desc: "High-resolution 3D resin wax printing." },
              { step: "03", title: "Tree Casting", desc: "Vacuum induction gold and platinum alloy casting." },
              { step: "04", title: "Filing & Assembly", desc: "Precision filing, pre-polishing, and component fitting." },
              { step: "05", title: "Stone Setting", desc: "Microscope prong, pave, and bezel gemstone setting." },
              { step: "06", title: "Final Polish", desc: "Ultrasonic bath cleaning and rhodium plating." },
              { step: "07", title: "BIS Hallmarking", desc: "Government laser hallmark verification and final QC." },
            ].map((st, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="text-xs font-mono font-bold text-slate-400">{st.step}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{st.title}</div>
                <div className="mt-1 text-xs text-slate-600 leading-relaxed">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. MINIMAL WHITE FOOTER */}
      <footer className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NSJ ERP"
              width={22}
              height={22}
              className="object-contain"
            />
            <span>© 2026 NSJ ERP. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleOpenChat}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Assistant
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
