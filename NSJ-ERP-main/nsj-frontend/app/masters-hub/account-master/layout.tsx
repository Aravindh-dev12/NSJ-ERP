"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Layers, Users, FolderTree } from "lucide-react";

const TABS = [
  {
    key: "account-master",
    label: "Account Master",
    icon: Layers,
    href: "/masters-hub/account-master",
  },
  {
    key: "tally-group",
    label: "Tally Account Transactions",
    icon: Users,
    href: "/masters-hub/account-master/tally-group",
  },
  {
    key: "ac-group",
    label: "A/C Groups",
    icon: FolderTree,
    href: "/masters-hub/account-master/ac-group",
  },
];

export default function AccountMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname?.startsWith("/masters-hub/account-master/tally-group"))
      return "tally-group";
    if (pathname?.startsWith("/masters-hub/account-master/ac-group"))
      return "ac-group";
    return "account-master";
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Account Master</h1>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-border pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-fuchsia-600 text-fuchsia-700"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>{children}</div>
    </div>
  );
}
