"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SUBNAV_SUFFIXES = [
  { label: "Overview", suffix: "" },
  { label: "List", suffix: "/list" },
  { label: "Add New", suffix: "/new" },
  { label: "Sub Accounts", suffix: "/sub-account" },
  { label: "Sub Accounts List", suffix: "/sub-accounts-list" },
];

function getAccountsBasePath(pathname: string | null): string {
  if (pathname?.startsWith("/masters-hub/account-master")) {
    return "/masters-hub/account-master";
  }
  return "/accounts";
}

type AccountsHeaderProps = {
  title: string;
  description?: string;
};

export function AccountsHeader({ title, description }: AccountsHeaderProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  const basePath = getAccountsBasePath(pathname);

  return (
    <div className="space-y-6 rounded-lg border border-border bg-background p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        {SUBNAV_SUFFIXES.map((link) => {
          const href = basePath + link.suffix;
          const normalizedHref = href.endsWith("/") ? href.slice(0, -1) : href;
          const isActive = normalizedPath === normalizedHref;

          return (
            <Link
              key={link.suffix}
              href={href}
              className={cn(
                "rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
