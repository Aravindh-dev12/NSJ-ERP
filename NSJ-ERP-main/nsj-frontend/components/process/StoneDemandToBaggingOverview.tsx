"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  stoneDemandToBaggingOverview,
  type StoneDemandToBagging,
} from "@/lib/backend";
import { Plus, Eye, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { StoneDemandToBaggingHeader } from "@/components/process/StoneDemandToBaggingHeader";

export function StoneDemandToBaggingOverview() {
  const [stats, setStats] = useState({
    total_records: 0,
    recent_activity: 0,
    recent_records: [] as StoneDemandToBagging[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await stoneDemandToBaggingOverview();
        setStats(data);
      } catch (err) {
        console.error("Failed to load overview:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <StoneDemandToBaggingHeader
        title="Stone Demand to Bagging Overview"
        description="Monitor and manage stone demand to bagging records"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total_records}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All time records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.recent_activity}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Records
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold">
                {stats.recent_records.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Latest entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Recent Records</CardTitle>
            <Link href="/process/stone-demand-to-bagging/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Record
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading recent records...
            </p>
          ) : stats.recent_records.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No records yet. Add your first stone demand to bagging record.
              </p>
              <Link
                href="/process/stone-demand-to-bagging/add"
                className="mt-4 inline-block"
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Record
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recent_records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {record.account_order_id || "No Order ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      {record.diamond_color_stone || "No stone details"}
                    </p>
                    {(record.approved_bagging_list_url ||
                      record.carry_forward_image_url) && (
                      <div className="flex gap-2 text-xs">
                        {record.approved_bagging_list_url && (
                          <span className="text-primary">
                            Approved Bagging List
                          </span>
                        )}
                        {record.carry_forward_image_url && (
                          <span className="text-primary">
                            Carry-Forward Image
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/process/stone-demand-to-bagging/detail/${record.id}`}
                    >
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Link
                  href="/process/stone-demand-to-bagging/list"
                  className="text-sm text-primary hover:underline"
                >
                  View All Records →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
