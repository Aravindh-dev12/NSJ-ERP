"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  stoneDemandToBaggingList,
  stoneDemandToBaggingDelete,
  type StoneDemandToBagging,
} from "@/lib/backend";
import { Plus, Search, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { StoneDemandToBaggingHeader } from "@/components/process/StoneDemandToBaggingHeader";

interface StoneDemandToBaggingListProps {
  initialSearch?: string;
}

export function StoneDemandToBaggingList({
  initialSearch = "",
}: StoneDemandToBaggingListProps) {
  const router = useRouter();
  const [records, setRecords] = useState<StoneDemandToBagging[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = async (page: number, search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search) {
        params.search = search;
      }

      const response = await stoneDemandToBaggingList(params);
      const results = response.results || response.items || [];

      // Group records by account_order_id to show only one entry per order
      const groupedRecords: StoneDemandToBagging[] = [];
      const seenOrders = new Set<string>();

      results.forEach((record: StoneDemandToBagging) => {
        const orderId = record.account_order_id?.toString().trim();
        if (orderId) {
          if (!seenOrders.has(orderId)) {
            seenOrders.add(orderId);
            groupedRecords.push(record);
          }
        } else {
          // If no order ID, just add as a separate entry
          groupedRecords.push(record);
        }
      });

      setRecords(groupedRecords);
      const count =
        typeof response.count === "number" ? response.count : results.length;
      setTotalPages(Math.ceil(count / pageSize));
    } catch (err: any) {
      setError(err?.message || "Failed to load records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRecords(1, searchTerm);
  };

  const handleDelete = async (
    id: string,
    accountOrderId: string | undefined
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete record ${accountOrderId || id}?`
      )
    ) {
      return;
    }

    try {
      await stoneDemandToBaggingDelete(id);
      loadRecords(currentPage, searchTerm);
    } catch (err: any) {
      setError(err?.message || "Failed to delete record");
    }
  };

  return (
    <div className="space-y-6">
      <StoneDemandToBaggingHeader
        title="Stone Demand to Bagging Records"
        description="View and manage all stone demand to bagging records"
      />

      {/* Search and Add Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Link href="/process/stone-demand-to-bagging/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Record
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Records List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No records found.{" "}
              {searchTerm
                ? "Try adjusting your search."
                : "Add a new record to get started."}
            </p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {record.account_order_id || "No Order ID"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                    {(record.approved_bagging_list_url ||
                      record.carry_forward_image_url) && (
                      <div className="flex gap-2 text-sm">
                        {record.approved_bagging_list_url && (
                          <a
                            href={record.approved_bagging_list_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Approved Bagging List
                          </a>
                        )}
                        {record.carry_forward_image_url && (
                          <a
                            href={record.carry_forward_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Carry-Forward Image
                          </a>
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
                    <Link
                      href={`/process/stone-demand-to-bagging/edit/${record.id}`}
                    >
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDelete(record.id, record.account_order_id)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && records.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
