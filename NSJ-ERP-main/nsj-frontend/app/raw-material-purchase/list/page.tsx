"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  rawMaterialPurchaseList,
  rawMaterialPurchaseDelete,
  type QueryValue,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, Plus } from "lucide-react";

export default function RawMaterialPurchaseListPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const resp = await rawMaterialPurchaseList({
        page,
        page_size: pageSize,
      } as Record<string, QueryValue>);
      setPurchases(resp.results ?? resp.items ?? []);
      setTotalCount(resp.count ?? 0);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load purchases" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await rawMaterialPurchaseDelete(id);
      toast({ title: "Deleted", description: "Purchase deleted successfully" });
      loadPurchases();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-8">
      <SalesHeader
        title="Raw Material Purchases"
        description="View and manage all diamond purchases."
        links={[
          { label: "Overview", href: "/raw-material-purchase" },
          { label: "List", href: "/raw-material-purchase/list" },
          { label: "Add New", href: "/raw-material-purchase/new" },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Purchases ({totalCount})</CardTitle>
          <Link href="/raw-material-purchase/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : purchases.length === 0 ? (
            <p className="text-muted-foreground">No purchases found.</p>
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
                      <th className="text-left py-3 px-2 font-medium">Shape</th>
                      <th className="text-right py-3 px-2 font-medium">
                        Carat
                      </th>
                      <th className="text-left py-3 px-2 font-medium">
                        Colour
                      </th>
                      <th className="text-left py-3 px-2 font-medium">
                        Clarity
                      </th>
                      <th className="text-left py-3 px-2 font-medium">Lab</th>
                      <th className="text-right py-3 px-2 font-medium">
                        Total (INR)
                      </th>
                      <th className="text-center py-3 px-2 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-mono text-xs">
                          {p.dia_id || p.id?.slice(0, 8)}
                        </td>
                        <td className="py-3 px-2">{p.date || "—"}</td>
                        <td className="py-3 px-2">{p.supplier?.name || "—"}</td>
                        <td className="py-3 px-2">
                          {p.shape?.name || p.shape || "—"}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {p.carat || "—"}
                        </td>
                        <td className="py-3 px-2">
                          {p.colour?.name || p.colour || "—"}
                        </td>
                        <td className="py-3 px-2">
                          {p.clarity?.name || p.clarity || "—"}
                        </td>
                        <td className="py-3 px-2">
                          {p.lab?.name || p.lab || "—"}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {p.total
                            ? `₹${parseFloat(p.total).toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-2">
                            {p.proof_image_url && (
                              <a
                                href={p.proof_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="View Proof"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
