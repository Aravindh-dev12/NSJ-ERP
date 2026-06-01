"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountsList, type Account } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AccountsHeader } from "./AccountsHeader";

const RECENT_LIMIT = 5;

type OverviewState = {
  total: number;
  active: number;
  inactive: number;
  recent: Account[];
};

const initialState: OverviewState = {
  total: 0,
  active: 0,
  inactive: 0,
  recent: [],
};

export function AccountsOverview() {
  const { toast } = useToast();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/masters-hub/account-master")
    ? "/masters-hub/account-master"
    : "/accounts";
  const [state, setState] = useState<OverviewState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [allResponse, activeResponse, inactiveResponse] =
          await Promise.all([
            accountsList({ page: 1, page_size: RECENT_LIMIT }),
            accountsList({ page: 1, page_size: 1, status: "ACTIVE" }),
            accountsList({ page: 1, page_size: 1, status: "INACTIVE" }),
          ]);

        if (!isMounted) return;

        setState({
          total: allResponse.count ?? allResponse.results.length ?? 0,
          active: activeResponse.count ?? activeResponse.results.length ?? 0,
          inactive:
            inactiveResponse.count ?? inactiveResponse.results.length ?? 0,
          recent: (allResponse.results ?? []).slice(0, RECENT_LIMIT),
        });
      } catch (err) {
        if (!isMounted) return;
        setError("Unable to load accounts overview.");
        setState(initialState);
        toast({
          variant: "destructive",
          title: "Failed to load accounts",
          description: err instanceof Error ? err.message : "Unexpected error.",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  return (
    <div className="space-y-8">
      <AccountsHeader
        title="Account Master"
        description="Monitor ledger health at a glance and jump into detailed account management."
      />

      {/* redundant top-level action buttons removed per design request */}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Total accounts</CardTitle>
                <CardDescription>All accounts recorded in NSJ.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-foreground">
                  {state.total}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Active</CardTitle>
                <CardDescription>Accounts currently enabled.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-600">
                  {state.active}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Inactive</CardTitle>
                <CardDescription>Accounts paused or archived.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-600">
                  {state.inactive}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Recent accounts</CardTitle>
              <CardDescription>
                Latest accounts added to the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(state.recent ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No accounts available yet. Create one to get started.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {state.recent.map((account) => (
                    <li
                      key={account.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {account.account_name ?? "Unnamed account"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.account_no ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {account.ledger_role ?? account.group_code ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button asChild variant="ghost" size="sm">
                <Link href={`${basePath}/list`}>See all accounts</Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
