"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  itemFinalPackingListList,
  itemFinalPackingListDelete,
  type ItemFinalPackingList,
} from "@/lib/backend";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { ItemFinalPackingListHeader } from "@/components/process/ItemFinalPackingListHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";

interface ItemFinalPackingListListProps {
  initialSearch?: string;
}

export function ItemFinalPackingListList({
  initialSearch = "",
}: ItemFinalPackingListListProps) {
  const router = useRouter();
  const [records, setRecords] = useState<ItemFinalPackingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  const loadRecords = async (
    page: number,
    search: string = "",
    dateFrom?: string,
    dateTo?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search) {
        params.search = search;
      }
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }

      const response = await itemFinalPackingListList(params);
      const results = response.results || response.items || [];
      setRecords(results);
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
    loadRecords(currentPage, searchTerm, dateFrom, dateTo);
  }, [currentPage, searchTerm, dateFrom, dateTo]);

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
      await itemFinalPackingListDelete(id);
      loadRecords(currentPage, searchTerm, dateFrom, dateTo);
    } catch (err: any) {
      setError(err?.message || "Failed to delete record");
    }
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <ItemFinalPackingListHeader
        title="Item Final Packing List Records"
        description="View and manage all item final packing list records"
      />

      {/* Search and Add Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <form
              onSubmit={handleSearch}
              className="flex-1 flex gap-2 items-center"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center bg-white border rounded-lg h-10 px-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-muted-foreground mr-2">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
                />
                <span className="text-muted-foreground mx-3">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent border-none outline-none w-[110px] font-medium text-foreground cursor-pointer uppercase text-xs"
                />
              </div>
            </form>
            <Link href="/process/item-final-packing-list/add">
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
                    {record.jewellery_piece_image_url && (
                      <p className="text-sm">
                        <a
                          href={record.jewellery_piece_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Jewellery Piece Image
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/process/item-final-packing-list/detail/${record.id}`}
                    >
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link
                      href={`/process/item-final-packing-list/edit/${record.id}`}
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
