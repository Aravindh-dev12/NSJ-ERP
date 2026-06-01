"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  accountTransactionsTallyExport,
  accountsDropdown,
} from "@/lib/backend";

export function TallyExportSection() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("all");
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    accountsDropdown()
      .then((data) => {
        if (mounted) setAccounts(data);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Date range required",
        description: "Please select both start and end dates.",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        variant: "destructive",
        title: "Invalid date range",
        description: "Start date cannot be after end date.",
      });
      return;
    }

    setDownloading(true);
    try {
      const params: {
        start_date?: string;
        end_date?: string;
        account_id?: string;
      } = {
        start_date: startDate,
        end_date: endDate,
      };

      if (accountId !== "all") {
        params.account_id = accountId;
      }

      const blob = await accountTransactionsTallyExport(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tally_export_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Transaction export downloaded for ${startDate} to ${endDate}.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to generate Tally export. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Tally Export (Account Transactions)</CardTitle>
        <CardDescription>
          Export all transaction data (Orders, Sales, Payments, Journals,
          Receipts, Purchases, Returns, Repairs) linked to Account Master for
          the selected date range. All fields exported.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="account-filter">Account (Optional)</Label>
            <select
              id="account-filter"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto"
          >
            {downloading ? "Generating..." : "Download Tally Export"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
