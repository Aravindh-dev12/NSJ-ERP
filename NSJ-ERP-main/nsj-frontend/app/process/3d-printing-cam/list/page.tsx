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
import { ThreeDPrintingCAMHeader } from "@/components/process/ThreeDPrintingCAMHeader";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  threeDPrintingCAMList,
  threeDPrintingCAMDelete,
  type ThreeDPrintingCAM,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

export default function ThreeDPrintingCAMListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [records, setRecords] = useState<ThreeDPrintingCAM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const response = await threeDPrintingCAMList({
          page,
          page_size: PAGE_SIZE,
          search: searchTerm || undefined,
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
  }, [page, searchTerm, toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setPage(1);

    // Update URL with search parameter
    const newParams = new URLSearchParams(window.location.search);
    if (newSearchTerm) {
      newParams.set("search", newSearchTerm);
    } else {
      newParams.delete("search");
    }
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CAM piece record?")) {
      return;
    }

    setDeletingId(id);
    try {
      await threeDPrintingCAMDelete(id);
      toast({
        title: "Success",
        description: "CAM piece record deleted successfully.",
      });

      // Reload data
      const response = await threeDPrintingCAMList({
        page,
        page_size: PAGE_SIZE,
        search: searchTerm || undefined,
      });

      const items = response.results || [];
      const count = (response.count as number) || items.length;

      setRecords(items);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    } catch (error: any) {
      console.error("Failed to delete record", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to delete record. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (record: ThreeDPrintingCAM) => {
    router.push(`/process/3d-printing-cam/edit/${record.id}`);
  };

  return (
    <div className="space-y-6">
      <ThreeDPrintingCAMHeader
        title="3D Printing/CAM Pieces"
        description="View and manage all 3D printing/CAM piece records."
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All CAM Pieces</CardTitle>
              <CardDescription>
                List of all 3D printing/CAM piece records with search and filter
                capabilities.
              </CardDescription>
            </div>
            <Link href="/process/3d-printing-cam/add">
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
                <Link href="/process/3d-printing-cam/add">
                  <Button className="mt-4">Create Your First Record</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-4">Order ID</div>
                  <div className="col-span-3">Image</div>
                  <div className="col-span-3">Created Date</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
                  >
                    <div className="col-span-4 font-medium">
                      {record.account_order_id}
                    </div>
                    <div className="col-span-3">
                      {record.cam_piece_image_url ? (
                        <a
                          href={record.cam_piece_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Image
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Link
                        href={`/process/3d-printing-cam/detail/${record.id}`}
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

              {/* Pagination */}
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
