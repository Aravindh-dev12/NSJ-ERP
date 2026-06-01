"use client";

import { useState } from "react";
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
import { accountTransactionsTallyExport } from "@/lib/backend";

export function ACGroupExportSection() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Date range required",
        description:
          "Please select both start and end dates to export transactions.",
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
      const blob = await accountTransactionsTallyExport({
        start_date: startDate,
        end_date: endDate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `account_transactions_tally_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Tally export downloaded for ${startDate} to ${endDate}.`,
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
        <CardTitle>Export Transactions</CardTitle>
        <CardDescription>
          Download account transactions as Excel for the selected date range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="txn-start-date">From</Label>
            <Input
              id="txn-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="txn-end-date">To</Label>
            <Input
              id="txn-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto"
          >
            {downloading ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
