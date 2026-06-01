"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Database, FolderTree, Stamp } from "lucide-react";

const TABS = [
  {
    key: "item-master",
    label: "Item Master",
    icon: Database,
    href: "/masters-hub/item-master",
  },
  {
    key: "item-groups",
    label: "Item Groups",
    icon: FolderTree,
    href: "/masters-hub/item-master/item-groups",
  },
  {
    key: "stamps",
    label: "Stamp Master",
    icon: Stamp,
    href: "/masters-hub/item-master/stamps",
  },
];

export default function ItemMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname?.startsWith("/masters-hub/item-master/stamps"))
      return "stamps";
    if (pathname?.startsWith("/masters-hub/item-master/item-groups"))
      return "item-groups";
    return "item-master";
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Item Master</h1>
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
