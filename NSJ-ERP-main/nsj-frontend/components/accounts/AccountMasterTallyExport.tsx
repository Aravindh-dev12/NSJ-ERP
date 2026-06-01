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
import { useToast } from "@/hooks/use-toast";
import { accountsTallyExport } from "@/lib/backend";
import { Download } from "lucide-react";

export function AccountMasterTallyExport() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Date range required",
        description: "Please select both From and To dates.",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        variant: "destructive",
        title: "Invalid date range",
        description: "From date cannot be after To date.",
      });
      return;
    }

    setDownloading(true);
    try {
      const blob = await accountsTallyExport({
        start_date: startDate,
        end_date: endDate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tally_ledger_export_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Tally ledger export downloaded for ${startDate} to ${endDate}.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Export failed",
        description:
          "Failed to generate Tally ledger export. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Export Tally Ledgers</CardTitle>
        <CardDescription>
          Download Account Masters in Tally-compatible Excel format for the
          selected date range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">To</label>
            <Input
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
            <Download className="h-4 w-4 mr-1" />
            {downloading ? "Exporting..." : "Export Ledgers"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
