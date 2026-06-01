import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DEFAULT_LINKS = [
  { label: "Overview", href: "/process/pre-rhodium-quality-check" },
  { label: "List", href: "/process/pre-rhodium-quality-check/list" },
  { label: "Add New", href: "/process/pre-rhodium-quality-check/add" },
];

type NavLink = { label: string; href: string };

type PreRhodiumQualityCheckHeaderProps = {
  title: string;
  description?: string;
  links?: NavLink[];
};

export function PreRhodiumQualityCheckHeader({
  title,
  description,
  links,
}: PreRhodiumQualityCheckHeaderProps) {
  const SUBNAV_LINKS = links ?? DEFAULT_LINKS;
  const pathname = usePathname();
  const normalizedPath = pathname?.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

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
        {SUBNAV_LINKS.map((link) => {
          const normalizedHref = link.href.endsWith("/")
            ? link.href.slice(0, -1)
            : link.href;
          const isActive = normalizedPath === normalizedHref;

          return (
            <Link
              key={link.href}
              href={link.href}
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
