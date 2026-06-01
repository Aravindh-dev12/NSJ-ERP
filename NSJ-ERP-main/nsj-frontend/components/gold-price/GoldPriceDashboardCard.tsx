"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  goldPricesCurrent,
  goldPricesCheckPermission,
  type GoldPriceCurrentResponse,
} from "@/lib/backend";
import { DollarSign, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export function GoldPriceDashboardCard() {
  const [data, setData] = useState<GoldPriceCurrentResponse | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentRate, permission] = await Promise.all([
        goldPricesCurrent(),
        goldPricesCheckPermission(),
      ]);

      setData(currentRate);
      setCanUpdate(permission.can_update);
    } catch (error) {
      console.error("Failed to load gold price:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gold & Silver Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const isLocked = data?.is_locked || false;
  const needsFeeding = data?.needs_feeding || false;
  const rate = data?.rate;

  return (
    <Card className={needsFeeding ? "border-red-500" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-5 w-5" />
          Gold & Silver Rates
        </CardTitle>
        <div className="flex items-center gap-2">
          {isLocked && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Locked (10 PM - 12 PM)
            </Badge>
          )}
          {needsFeeding && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Needs Update
            </Badge>
          )}
          {canUpdate && (
            <Link href="/gold-rates">
              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-3 w-3 mr-1" />
                Update Rates
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {needsFeeding ? (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Today&apos;s gold price has not been updated yet. Please update
                the rates.
              </AlertDescription>
            </Alert>
            {canUpdate && (
              <Link href="/gold-rates">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Update Gold Price Now
                </Button>
              </Link>
            )}
          </div>
        ) : rate ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">24K Gold</p>
                <p className="text-2xl font-bold">
                  ₹{parseFloat(rate.gold_24k_rate).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">per gram</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">22K Gold</p>
                <p className="text-2xl font-bold">
                  ₹{parseFloat(rate.gold_22k_rate).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">per gram</p>
              </div>
              {rate.silver_rate && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Silver</p>
                  <p className="text-2xl font-bold">
                    ₹{parseFloat(rate.silver_rate).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">per gram</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                <p>Last updated: {format(new Date(rate.fed_at), "PPp")}</p>
                {rate.fed_by_name && <p>By: {rate.fed_by_name}</p>}
                <p>
                  Type:{" "}
                  {rate.update_type === "OPENING"
                    ? "Opening (12 PM)"
                    : "Closing (Before 10 PM)"}
                </p>
              </div>
              {isLocked && (
                <div className="text-xs text-red-600 font-medium">
                  Rate locked until 12 PM
                </div>
              )}
            </div>

            {rate.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Notes:</p>
                <p className="text-sm">{rate.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No rate data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
