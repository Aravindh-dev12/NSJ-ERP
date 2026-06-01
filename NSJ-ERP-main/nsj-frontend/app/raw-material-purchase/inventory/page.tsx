"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  rawMaterialInventoryList,
  rawMaterialInventorySummary,
  type QueryValue,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

export default function RawMaterialInventoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const pageSize = 20;

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryResp, summaryResp] = await Promise.all([
        rawMaterialInventoryList({
          page,
          page_size: pageSize,
          show_all: showAll ? "true" : "false",
        } as Record<string, QueryValue>),
        rawMaterialInventorySummary(),
      ]);
      setInventory(inventoryResp.results ?? []);
      setTotalCount(Number(inventoryResp.count) ?? 0);
      setSummary(summaryResp);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load inventory" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, showAll]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-800",
      PARTIALLY_ISSUED: "bg-yellow-100 text-yellow-800",
      FULLY_ISSUED: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Raw Material Inventory
          </h1>
          <p className="text-muted-foreground">
            View all inventory and issue materials.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_items}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.available_items}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Available (ct)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_available_carat?.toFixed(3)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issued (ct)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.total_issued_carat?.toFixed(3)}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory ({totalCount})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Read-only reference - All entries come from Daily Log
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded"
              />
              Show fully issued
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                No inventory items found.
              </p>
              <p className="text-sm text-muted-foreground">
                Add purchases through Daily Log to populate inventory
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">
                        DIA. ID
                      </th>
                      <th className="text-left py-3 px-2 font-medium">Date</th>
                      <th className="text-left py-3 px-2 font-medium">
                        Supplier
                      </th>
                      <th className="text-left py-3 px-2 font-medium">
                        Metal Type
                      </th>
                      <th className="text-left py-3 px-2 font-medium">Shape</th>
                      <th className="text-right py-3 px-2 font-medium">
                        Original (ct)
                      </th>
                      <th className="text-right py-3 px-2 font-medium">
                        Available (ct)
                      </th>
                      <th className="text-right py-3 px-2 font-medium">
                        Issued (ct)
                      </th>
                      <th className="text-center py-3 px-2 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-mono text-xs">
                          {inv.purchase_details?.dia_id || inv.id?.slice(0, 8)}
                        </td>
                        <td className="py-3 px-2">
                          {inv.purchase_details?.date || "—"}
                        </td>
                        <td className="py-3 px-2">
                          {inv.purchase_details?.supplier || "—"}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {inv.purchase_details?.material_type || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {inv.purchase_details?.shape || "—"}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {inv.original_carat}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-green-600">
                          {inv.available_carat}
                        </td>
                        <td className="py-3 px-2 text-right text-orange-600">
                          {inv.issued_carat}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
