"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { accountDetail, accountDelete, type Account } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accountId = params.id as string;

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await accountDetail(accountId);
        setAccount(data);
      } catch (err) {
        setError("Failed to load account details.");
        toast({
          variant: "destructive",
          title: "Unable to load account",
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadAccount();
  }, [accountId, toast]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account?"
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await accountDelete(accountId);
      toast({
        title: "Account removed",
        description: "The account has been deleted successfully.",
      });
      router.push("/accounts/list");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description:
          err instanceof Error ? err.message : "Could not delete account.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts/list">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts/list">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {error || "Account not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back to List button - Top Left */}
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/accounts/list">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Link>
      </Button>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const { exportAccount } = await import("@/lib/backend");
              const { blob, fileName } = await exportAccount(account.id);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName ?? `Account_${account.account_name}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              toast({
                title: "Account exported successfully",
              });
            } catch (err) {
              toast({
                variant: "destructive",
                title: "Export failed",
              });
            }
          }}
        >
          Export
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{account.account_name}</CardTitle>
          <CardDescription>
            Account #{account.account_no} • {account.group_code} •{" "}
            <span
              className={
                account.status === "ACTIVE"
                  ? "text-emerald-600 font-semibold"
                  : "text-amber-600 font-semibold"
              }
            >
              {account.status}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{account.account_no || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Group Code</p>
                <p className="font-medium">{account.group_code || "—"}</p>
              </div>
              {account.remarks && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="font-medium">{account.remarks}</p>
                </div>
              )}
            </div>
          </section>

          {/* Contact Information */}
          {account.contact && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {account.contact.address_line && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {account.contact.address_line}
                    </p>
                  </div>
                )}
                {account.contact.state && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-medium">{account.contact.state}</p>
                  </div>
                )}
                {account.contact.city && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{account.contact.city}</p>
                  </div>
                )}
                {account.contact.pin_code && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">PIN Code</p>
                    <p className="font-medium">{account.contact.pin_code}</p>
                  </div>
                )}
                {account.contact.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{account.contact.phone}</p>
                  </div>
                )}
                {account.contact.email && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{account.contact.email}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Bank Details */}
          {account.bank &&
            (account.bank.bank_name ||
              account.bank.account_number ||
              account.bank.ifsc) && (
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Bank Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {account.bank.bank_name && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{account.bank.bank_name}</p>
                    </div>
                  )}
                  {account.bank.account_number && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Account Number
                      </p>
                      <p className="font-medium">
                        {account.bank.account_number}
                      </p>
                    </div>
                  )}
                  {account.bank.ifsc && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">IFSC</p>
                      <p className="font-medium">{account.bank.ifsc}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Tax Information */}
          {account.tax && (account.tax.gstin || account.tax.pan) && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Tax Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {account.tax.gstin && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">GSTIN</p>
                    <p className="font-medium">{account.tax.gstin}</p>
                  </div>
                )}
                {account.tax.pan && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">PAN</p>
                    <p className="font-medium">{account.tax.pan}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Opening Balance */}
          {account.opening_balance &&
            (account.opening_balance.amount ||
              account.opening_balance.gold_fine ||
              account.opening_balance.silver_fine) && (
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Opening Balance</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {account.opening_balance.amount && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {account.opening_balance.amount}{" "}
                        {account.opening_balance.amount_drcr &&
                          `(${account.opening_balance.amount_drcr})`}
                      </p>
                    </div>
                  )}
                  {account.opening_balance.gold_fine && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Gold Fine</p>
                      <p className="font-medium">
                        {account.opening_balance.gold_fine}{" "}
                        {account.opening_balance.gold_drcr &&
                          `(${account.opening_balance.gold_drcr})`}
                      </p>
                    </div>
                  )}
                  {account.opening_balance.silver_fine && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Silver Fine
                      </p>
                      <p className="font-medium">
                        {account.opening_balance.silver_fine}{" "}
                        {account.opening_balance.silver_drcr &&
                          `(${account.opening_balance.silver_drcr})`}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Metadata */}
          <section className="space-y-3 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-2 text-xs text-muted-foreground">
              <div>
                <p>Created: {new Date(account.created_at).toLocaleString()}</p>
              </div>
              {account.updated_at && (
                <div>
                  <p>
                    Last Updated:{" "}
                    {new Date(account.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
