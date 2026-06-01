"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { queryList, queryReopen, type QueryResponse } from "@/lib/backend";
import { generateQueryPDF } from "@/lib/queryPDF";

type Query = QueryResponse;

export function ArchivedQueriesList() {
  const router = useRouter();
  const { toast } = useToast();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [meta, setMeta] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  useEffect(() => {
    const loadQueries = async () => {
      setLoading(true);
      try {
        const data = await queryList({
          page,
          page_size: pageSize,
          status: "archived",
          search: searchTerm || undefined,
        });
        setQueries(data.results || []);
        setFilteredQueries(data.results || []); // Use backend-filtered results directly
        setMeta({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
        });
      } catch (err) {
        console.error("Failed to load archived queries:", err);

        toast({
          variant: "destructive",
          title: "Failed to load archived queries",
          description:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred. Please try again.",
        });

        setQueries([]);
        setFilteredQueries([]);
        setMeta({
          count: 0,
          next: null,
          previous: null,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadQueries();
  }, [page, pageSize, searchTerm, toast]);

  const handleViewDetails = useCallback(
    (queryId: string) => {
      router.push(`/vouchers/archived-queries/${queryId}`);
    },
    [router]
  );

  const handleReopen = useCallback(
    async (query: Query) => {
      if (
        !confirm(
          `Reopen query for ${query.account?.account_name || "this customer"}? This will move it back to pending queries.`
        )
      ) {
        return;
      }

      try {
        await queryReopen(query.id);

        toast({
          title: "Query Reopened",
          description: "The query has been moved back to pending queries.",
        });

        // Refresh the list
        setQueries(queries.filter((q) => q.id !== query.id));
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Reopen Failed",
          description:
            err instanceof Error ? err.message : "Failed to reopen query",
        });
      }
    },
    [queries, toast]
  );

  const handleDownloadPDF = useCallback(
    async (query: Query) => {
      try {
        const pdfData = {
          accountName: query.account?.account_name || "Unknown",
          subaccount: query.subaccount || "",
          location: query.location || "",
          itemName:
            query.item_name?.name || query.item_name_custom || "Unknown",
          goldCarat: query.gold_carat || "",
          size: query.size || "",
          gender: query.gender || "",
          deliveryType: query.delivery_type || "",
          queryInDate: query.query_in_date,
          expiryDate: query.expiry_date || "",
          referenceImage: query.reference_image || "",
          referenceImageType: "image/jpeg",
        };

        await generateQueryPDF(pdfData);

        toast({
          title: "PDF Downloaded",
          description: "Query PDF has been downloaded successfully.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "PDF Download Failed",
          description:
            err instanceof Error ? err.message : "Failed to download PDF",
        });
      }
    },
    [toast]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Archived Queries</CardTitle>
          <CardDescription>
            Queries that have been archived or expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by account, item name, or carat..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {filteredQueries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No archived queries match your search"
                  : "No archived queries yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Gold Carat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Query Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Archived Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueries.map((query) => {
                    return (
                      <tr key={query.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {query.account?.account_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {query.item_name?.name ||
                            query.item_name_custom ||
                            "—"}
                        </td>
                        <td className="px-4 py-3">{query.gold_carat}</td>
                        <td className="px-4 py-3">{query.size}</td>
                        <td className="px-4 py-3">
                          {new Date(query.query_in_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {query.archived_at
                            ? new Date(query.archived_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            📦 Archived
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(query.id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(query)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              📄 PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReopen(query)}
                              className="text-green-600 hover:text-green-900"
                            >
                              ↩️ Reopen
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredQueries.length} of {meta.count} archived queries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.previous}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.next}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
