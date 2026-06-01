"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RawMaterialTallyHeader } from "@/components/process/RawMaterialTallyHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { Search, Eye, Edit, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";
import {
  rawMaterialTallyList,
  rawMaterialTallyDelete,
  type RawMaterialTally,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

export default function RawMaterialTallyListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [records, setRecords] = useState<RawMaterialTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const response = await rawMaterialTallyList({
          page,
          page_size: PAGE_SIZE,
          search: searchTerm || undefined,
          date_from: dateFrom,
          date_to: dateTo,
        });

        const items = response.results || [];
        const count = (response.count as number) || items.length;

        setRecords(items);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      } catch (error) {
        console.error("Failed to fetch records", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load records. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [page, searchTerm, dateFrom, dateTo, toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setPage(1);

    const newParams = new URLSearchParams(window.location.search);
    if (newSearchTerm) {
      newParams.set("search", newSearchTerm);
    } else {
      newParams.delete("search");
    }
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this raw material tally record?"
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await rawMaterialTallyDelete(id);
      toast({
        title: "Success",
        description: "Raw material tally record deleted successfully.",
      });

      const response = await rawMaterialTallyList({
        page,
        page_size: PAGE_SIZE,
        search: searchTerm || undefined,
        date_from: dateFrom,
        date_to: dateTo,
      });

      const items = response.results || [];
      const count = (response.count as number) || items.length;

      setRecords(items);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    } catch (error: unknown) {
      console.error("Failed to delete record", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete record. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (record: RawMaterialTally) => {
    router.push(`/process/raw-material-tally/edit/${record.id}`);
  };

  return (
    <div className="space-y-6">
      <PreviousBackButton />
      <RawMaterialTallyHeader
        title="Raw Material Tally Records"
        description="View and manage all raw material tally records."
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Raw Material Tallies</CardTitle>
              <CardDescription>
                List of all raw material tally records with search and filter
                capabilities.
              </CardDescription>
            </div>
            <Link href="/process/raw-material-tally/add">
              <Button>Add New Record</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
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
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-48 w-full bg-muted animate-pulse rounded"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No records found matching your search."
                  : "No records found."}
              </p>
              {!searchTerm && (
                <Link href="/process/raw-material-tally/add">
                  <Button className="mt-4">Create Your First Record</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-3">Order ID</div>
                  <div className="col-span-4">Materials</div>
                  <div className="col-span-2">Image</div>
                  <div className="col-span-2">Created Date</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50 items-center"
                  >
                    <div className="col-span-3 font-medium">
                      {record.account_order_id || "N/A"}
                    </div>
                    <div className="col-span-4 text-sm text-muted-foreground">
                      {record.raw_material_movement &&
                      record.raw_material_movement.length > 0
                        ? record.raw_material_movement
                            .map((m) => m.material)
                            .filter(Boolean)
                            .join(", ") || "N/A"
                        : "N/A"}
                    </div>
                    <div className="col-span-2">
                      {record.carry_forward_image_url ? (
                        <a
                          href={record.carry_forward_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <Link
                        href={`/process/raw-material-tally/detail/${record.id}`}
                      >
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                    records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
