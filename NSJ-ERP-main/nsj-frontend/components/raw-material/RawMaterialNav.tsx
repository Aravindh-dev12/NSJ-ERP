"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/raw-material-purchase" },
  { label: "Inventory", href: "/raw-material-purchase/inventory" },
  { label: "Issue Material", href: "/raw-material-purchase/issue" },
  { label: "Add Purchase", href: "/raw-material-purchase/new" },
];

export function RawMaterialNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border-2",
              isActive
                ? "bg-[#6B1C1C] text-white border-[#6B1C1C]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
