"use client";

import type { ComponentType } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  FileText as _FileText,
  CheckSquare,
  Menu,
  X,
  Database,
  FileText,
  UserCheck,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  Stamp,
  Package,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  subLinks: Array<{
    label: string;
    href: string;
    hasSubItems?: boolean;
    devOnly?: boolean;
    founderOnly?: boolean;
    salesOnly?: boolean;
    productionOnly?: boolean;
    salesAndProduction?: boolean;
    rawMaterialOnly?: boolean;
    productionReadOnly?: boolean;
    rawMaterialReadOnly?: boolean;
    hiddenFromSidebar?: boolean;
  }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    subLinks: [],
  },
  {
    label: "Daily Log",
    href: "/daily-log",
    icon: CalendarDays,
    subLinks: [],
  },
  {
    label: "Query Orders",
    href: "/query-orders",
    icon: CheckSquare,
    subLinks: [],
  },
  {
    label: "Inventory",
    href: "/raw-material-purchase/inventory",
    icon: Package,
    subLinks: [],
  },
  {
    label: "Masters",
    href: "/masters-hub",
    icon: Database,
    subLinks: [
      { label: "Account Master", href: "/masters-hub/account-master" },
      { label: "Item Master", href: "/masters-hub/item-master" },
    ],
  },
  {
    label: "Gold Rates",
    href: "/gold-rates",
    icon: TrendingUp,
    subLinks: [],
  },
  {
    label: "Need Founder",
    href: "/need-founder",
    icon: UserCheck,
    subLinks: [],
  },
  {
    label: "Task Management",
    href: "/tasks/dashboard",
    icon: CheckSquare,
    subLinks: [],
  },
  {
    label: "Manage Users",
    href: "/manage-users",
    icon: Users,
    subLinks: [],
  },
];

export function SidebarNav({
  hideMobileHeader = false,
}: {
  hideMobileHeader?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showDevLinks, setShowDevLinks] = useState(true); // Default to true for initial render
  const [isFounder, setIsFounder] = useState(false);
  const [isSalesDept, setIsSalesDept] = useState(false);
  const [isProductionDept, setIsProductionDept] = useState(false);
  const [isRawMaterialDept, setIsRawMaterialDept] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );

  // Auto-expand parent menus when navigating to a sub-route
  useEffect(() => {
    if (pathname?.startsWith("/masters-hub")) {
      setExpandedMenus((prev) => ({
        ...prev,
        Masters: true,
        "mobile-Masters": true,
      }));
    }
  }, [pathname]);

  useEffect(() => {
    // Check if user is Niti (Founder)
    if (user) {
      const founderCheck =
        user.name === "Niti" ||
        user.email === "niti@nsj.com" ||
        (user as Record<string, unknown>).task_role === "FOUNDER";
      setIsFounder(founderCheck);

      // Check if user is Sales Department
      const salesCheck =
        user.name === "Sales Department" || user.email === "sales@nsj.com";
      setIsSalesDept(salesCheck);

      // Check if user is Production Department (Sanjana)
      const productionCheck =
        user.name === "Sanjana" ||
        user.name === "Production" ||
        user.name === "Production Department" ||
        user.email === "sanjana@nsj.com";
      setIsProductionDept(productionCheck);

      // Check if user is Raw Material Department (Jinu Bhai)
      const rawMaterialCheck =
        user.name === "Jinu" ||
        user.name === "Jinu Bhai" ||
        user.email === "jinu@nsj.com";
      setIsRawMaterialDept(rawMaterialCheck);
      const role = (user as Record<string, unknown>).role as string | undefined;
      setIsAdmin(role === "ADMIN" || role === "SUPER_ADMIN");
    } else {
      setIsFounder(false);
      setIsSalesDept(false);
      setIsProductionDept(false);
      setIsRawMaterialDept(false);
      setIsAdmin(false);
    }
  }, [user]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  useEffect(() => {
    // Check if user should see dev-only links
    // Dev users: Admin1, Aryan, or no simulated user set (pure dev mode)
    const checkDevAccess = () => {
      const simulatedUserName = localStorage.getItem("currentTaskUserName");
      const accessToken = localStorage.getItem("accessToken");

      // If no access token and no simulated user, show dev links (pure dev mode)
      if (!accessToken && !simulatedUserName) {
        setShowDevLinks(true);
        return;
      }

      // If simulated user is Admin1 or Aryan, show dev links
      if (simulatedUserName === "Admin1" || simulatedUserName === "Aryan") {
        setShowDevLinks(true);
        return;
      }

      // If logged in (has access token), check if it's a dev user
      // For now, hide dev links for logged-in users unless they're simulating
      if (accessToken && !simulatedUserName) {
        // Real login - we'd need to check the user's role from the token
        // For simplicity, hide dev links for real logins
        setShowDevLinks(false);
        return;
      }

      // Otherwise, hide dev links (simulated as non-dev user)
      setShowDevLinks(false);
    };

    checkDevAccess();

    // Listen for storage changes (when user switches)
    window.addEventListener("storage", checkDevAccess);
    return () => window.removeEventListener("storage", checkDevAccess);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const basePath = pathname ? pathname.split("?")[0] : "";

  // Hide the sidebar on the login page (mobile and desktop)
  if (basePath === "/login" || basePath.startsWith("/login/")) {
    return null;
  }

  return (
    <>
      <aside className="no-print relative hidden min-h-screen w-64 flex-col border-r border-border bg-white text-foreground shadow-md lg:flex">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border/60 px-6 pb-6 pt-8">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                src={require("../logo.png")}
                alt="Niti Shah Jewels"
                className="h-10 w-10 object-cover"
                width={40}
                height={40}
              />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-wide text-foreground">
                Niti Shah Jewels
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {NAV_ITEMS.filter((item) => {
                // For Sales Department: show Dashboard, Process, and Task Management
                if (isSalesDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // For Raw Material Department: show Dashboard, Process, and Task Management
                if (isRawMaterialDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // For Production Department: show Dashboard, Process, and Task Management
                if (isProductionDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // Hide "Need Founder" section if user is not founder
                if (item.label === "Need Founder" && !isFounder) {
                  return false;
                }
                // Hide "Manage Users" if not admin
                if (item.label === "Manage Users" && !isAdmin) {
                  return false;
                }
                return true;
              }).map((item) => {
                const itemBase = item.href.split("?")[0];
                const isActive = basePath.startsWith(itemBase);
                const Icon = item.icon;
                const hasSubLinks = item.subLinks.length > 0;

                return (
                  <li key={item.label} className="relative">
                    <div className="flex items-center gap-1">
                      {hasSubLinks ? (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors relative z-10",
                            isActive
                              ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 shadow-sm"
                              : "text-foreground hover:bg-secondary hover:text-primary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 ml-auto transition-transform",
                              expandedMenus[item.label] && "rotate-90"
                            )}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors relative z-10",
                            isActive
                              ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 shadow-sm"
                              : "text-foreground hover:bg-secondary hover:text-primary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </div>
                    {hasSubLinks &&
                      (() => {
                        const isExpanded = expandedMenus[item.label];
                        const baseHidden =
                          "overflow-hidden pl-9 pt-0 text-xs text-muted-foreground transition-all duration-300";
                        const expandedClass = isExpanded
                          ? "max-h-[60vh] overflow-y-auto opacity-100 pt-2 pointer-events-auto"
                          : "max-h-0 opacity-0 pointer-events-none";
                        const decorClass = isExpanded
                          ? "bg-white shadow-sm rounded-md z-20"
                          : "";

                        const subContainerClass = `${baseHidden} ${expandedClass} ${decorClass}`;
                        const _scrollContainerClass = isExpanded
                          ? "overflow-y-auto pr-2"
                          : "";

                        return (
                          <div className={subContainerClass}>
                            <ul className="space-y-2">
                              {item.subLinks
                                .filter((subLink) => {
                                  // For Sales Department: only show salesOnly or salesAndProduction items
                                  if (isSalesDept) {
                                    return (
                                      subLink.salesOnly === true ||
                                      subLink.salesAndProduction === true
                                    );
                                  }
                                  // For Production Department: show productionOnly, salesAndProduction, or productionReadOnly items
                                  if (isProductionDept) {
                                    return (
                                      subLink.productionOnly === true ||
                                      subLink.salesAndProduction === true ||
                                      subLink.productionReadOnly === true
                                    );
                                  }
                                  // For Raw Material Department: show rawMaterialOnly, productionReadOnly, or rawMaterialReadOnly items
                                  if (isRawMaterialDept) {
                                    return (
                                      subLink.rawMaterialOnly === true ||
                                      subLink.productionReadOnly === true ||
                                      subLink.rawMaterialReadOnly === true
                                    );
                                  }
                                  // Filter out devOnly links if not showing dev links
                                  if (subLink.devOnly && !showDevLinks)
                                    return false;
                                  // Filter out founderOnly links if not founder
                                  if (subLink.founderOnly && !isFounder)
                                    return false;
                                  // Filter out hiddenFromSidebar links
                                  if (subLink.hiddenFromSidebar) return false;
                                  return true;
                                })
                                .map((subLink) => {
                                  // Support sub-links with query params (e.g. /masters-hub?tab=account)
                                  const subLinkBase =
                                    subLink.href.split("?")[0];
                                  const subLinkQuery = subLink.href.includes(
                                    "?"
                                  )
                                    ? subLink.href.split("?")[1]
                                    : "";
                                  let subActive: boolean;
                                  if (subLinkQuery) {
                                    const currentSearch =
                                      typeof window !== "undefined"
                                        ? window.location.search.slice(1)
                                        : "";
                                    subActive =
                                      basePath === subLinkBase &&
                                      currentSearch === subLinkQuery;
                                  } else {
                                    subActive = basePath === subLink.href;
                                  }

                                  // Special handling for Order with nested query items
                                  if (
                                    subLink.hasSubItems &&
                                    subLink.label === "Order"
                                  ) {
                                    const isOrderExpanded =
                                      expandedMenus[`order-${item.label}`];
                                    return (
                                      <li
                                        key={subLink.label}
                                        className="relative"
                                      >
                                        <button
                                          onClick={() =>
                                            toggleMenu(`order-${item.label}`)
                                          }
                                          className={cn(
                                            "w-full text-left block rounded-lg px-3 py-2 transition-colors",
                                            subActive
                                              ? "bg-primary/10 text-primary"
                                              : "hover:bg-secondary hover:text-primary"
                                          )}
                                        >
                                          {subLink.label}
                                        </button>
                                        {/* Nested query items - click/tap to expand */}
                                        {isOrderExpanded && (
                                          <div className="pl-4 pt-2">
                                            <ul className="space-y-2">
                                              <li>
                                                <Link
                                                  href="/vouchers"
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath === "/vouchers"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Order Overview
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/pending-queries/new"
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/pending-queries/new"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Query Form
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/pending-queries"
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/pending-queries"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Pending Leads
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/archived-queries"
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/archived-queries"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Archived Queries
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  }

                                  return (
                                    <li key={subLink.label}>
                                      <Link
                                        href={subLink.href}
                                        className={cn(
                                          "block rounded-lg px-3 py-2 transition-colors",
                                          subActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-secondary hover:text-primary"
                                        )}
                                      >
                                        {subLink.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        );
                      })()}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border/60 px-6 py-6 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Need help?</p>
            <p className="mt-2 leading-relaxed">
              Support is available Monday through Friday, 9am – 6pm CET.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      {!hideMobileHeader && (
        <div className="no-print sticky top-0 z-40 flex w-full items-center justify-between border-b border-border bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
            <div className="flex h-9 w-9 items-center justify-center">
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                src={require("../logo.png")}
                alt="Niti Shah Jewels"
                className="h-9 w-9 object-cover"
                width={36}
                height={36}
              />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Niti Shah Jewels
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center">
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  src={require("../logo.png")}
                  alt="Niti Shah Jewels"
                  className="h-10 w-10 object-cover"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-wide text-foreground">
                  Niti Shah Jewels
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-2 hover:bg-secondary transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {NAV_ITEMS.filter((item) => {
                // For Sales Department: show Dashboard, Process, and Task Management
                if (isSalesDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // For Raw Material Department: show Dashboard, Process, and Task Management
                if (isRawMaterialDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // For Production Department: show Dashboard, Process, and Task Management
                if (isProductionDept) {
                  return (
                    item.label === "Dashboard" ||
                    item.label === "Process" ||
                    item.label === "Task Management"
                  );
                }
                // Hide "Need Founder" section if user is not founder
                if (item.label === "Need Founder" && !isFounder) {
                  return false;
                }
                // Hide "Manage Users" if not admin
                if (item.label === "Manage Users" && !isAdmin) {
                  return false;
                }
                return true;
              }).map((item) => {
                const itemBase = item.href.split("?")[0];
                const isActive = basePath.startsWith(itemBase);
                const Icon = item.icon;
                const hasSubLinks = item.subLinks.length > 0;

                return (
                  <li key={item.label} className="relative">
                    {hasSubLinks ? (
                      <button
                        onClick={() => toggleMenu(`mobile-${item.label}`)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors relative z-10",
                          isActive
                            ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 shadow-sm"
                            : "text-foreground hover:bg-secondary hover:text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors relative z-10",
                          isActive
                            ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 shadow-sm"
                            : "text-foreground hover:bg-secondary hover:text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                    {hasSubLinks &&
                      (() => {
                        const isExpanded =
                          expandedMenus[`mobile-${item.label}`];
                        const baseHidden =
                          "overflow-hidden pl-9 pt-0 text-xs text-muted-foreground transition-all duration-300";
                        const expandedClass = isExpanded
                          ? "max-h-[60vh] overflow-y-auto opacity-100 pt-2 pointer-events-auto"
                          : "max-h-0 opacity-0 pointer-events-none";
                        const decorClass = isExpanded
                          ? "bg-white shadow-sm rounded-md z-20"
                          : "";

                        const subContainerClass = `${baseHidden} ${expandedClass} ${decorClass}`;
                        const _scrollContainerClass = isExpanded
                          ? "overflow-y-auto pr-2"
                          : "";

                        return (
                          <div className={subContainerClass}>
                            <ul className="space-y-2">
                              {item.subLinks
                                .filter((subLink) => {
                                  // For Sales Department: only show salesOnly or salesAndProduction items
                                  if (isSalesDept) {
                                    return (
                                      subLink.salesOnly === true ||
                                      subLink.salesAndProduction === true
                                    );
                                  }
                                  // For Production Department: show productionOnly, salesAndProduction, or productionReadOnly items
                                  if (isProductionDept) {
                                    return (
                                      subLink.productionOnly === true ||
                                      subLink.salesAndProduction === true ||
                                      subLink.productionReadOnly === true
                                    );
                                  }
                                  // For Raw Material Department: show rawMaterialOnly or productionReadOnly items
                                  if (isRawMaterialDept) {
                                    return (
                                      subLink.rawMaterialOnly === true ||
                                      subLink.productionReadOnly === true ||
                                      subLink.rawMaterialReadOnly === true
                                    );
                                  }
                                  if (subLink.devOnly && !showDevLinks)
                                    return false;
                                  if (subLink.founderOnly && !isFounder)
                                    return false;
                                  // Filter out hiddenFromSidebar links
                                  if (subLink.hiddenFromSidebar) return false;
                                  return true;
                                })
                                .map((subLink) => {
                                  // Support sub-links with query params (e.g. /masters-hub?tab=account)
                                  const subLinkBase =
                                    subLink.href.split("?")[0];
                                  const subLinkQuery = subLink.href.includes(
                                    "?"
                                  )
                                    ? subLink.href.split("?")[1]
                                    : "";
                                  let subActive: boolean;
                                  if (subLinkQuery) {
                                    const currentSearch =
                                      typeof window !== "undefined"
                                        ? window.location.search.slice(1)
                                        : "";
                                    subActive =
                                      basePath === subLinkBase &&
                                      currentSearch === subLinkQuery;
                                  } else {
                                    subActive = basePath === subLink.href;
                                  }

                                  // For mobile, handle Order with nested items differently
                                  if (
                                    subLink.hasSubItems &&
                                    subLink.label === "Order"
                                  ) {
                                    const isOrderExpanded =
                                      expandedMenus[
                                        `mobile-order-${item.label}`
                                      ];
                                    return (
                                      <li key={subLink.label}>
                                        <button
                                          onClick={() =>
                                            toggleMenu(
                                              `mobile-order-${item.label}`
                                            )
                                          }
                                          className={cn(
                                            "w-full text-left block rounded-lg px-3 py-2 transition-colors",
                                            subActive
                                              ? "bg-primary/10 text-primary"
                                              : "hover:bg-secondary hover:text-primary"
                                          )}
                                        >
                                          {subLink.label}
                                        </button>
                                        {isOrderExpanded && (
                                          <div className="pl-4 pt-2">
                                            <ul className="space-y-2">
                                              <li>
                                                <Link
                                                  href="/vouchers"
                                                  onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                  }
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath === "/vouchers"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Order Overview
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/pending-queries/new"
                                                  onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                  }
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/pending-queries/new"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Query Form
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/pending-queries"
                                                  onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                  }
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/pending-queries"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Pending Leads
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  href="/vouchers/archived-queries"
                                                  onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                  }
                                                  className={cn(
                                                    "block rounded-lg px-3 py-2 text-xs transition-colors",
                                                    basePath ===
                                                      "/vouchers/archived-queries"
                                                      ? "bg-primary/10 text-primary"
                                                      : "hover:bg-secondary hover:text-primary"
                                                  )}
                                                >
                                                  → Archived Queries
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  }

                                  return (
                                    <li key={subLink.label}>
                                      <Link
                                        href={subLink.href}
                                        onClick={() =>
                                          setIsMobileMenuOpen(false)
                                        }
                                        className={cn(
                                          "block rounded-lg px-3 py-2 transition-colors",
                                          subActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-secondary hover:text-primary"
                                        )}
                                      >
                                        {subLink.label}
                                      </Link>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        );
                      })()}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border/60 px-6 py-6 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Need help?</p>
            <p className="mt-2 leading-relaxed">
              Support is available Monday through Friday, 9am – 6pm CET.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
