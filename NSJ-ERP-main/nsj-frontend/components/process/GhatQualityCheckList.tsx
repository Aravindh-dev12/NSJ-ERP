"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghatQualityCheckList, type GhatQualityCheck } from "@/lib/backend";
import { Search, Plus, Eye, Edit, AlertCircle } from "lucide-react";
import Link from "next/link";
import { GhatQualityCheckHeader } from "@/components/process/GhatQualityCheckHeader";

export function GhatQualityCheckList() {
  const router = useRouter();
  const [records, setRecords] = useState<GhatQualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRecords();
  }, [currentPage, searchTerm]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await ghatQualityCheckList({
        page: currentPage,
        page_size: 10,
        search: searchTerm,
      });

      const results = response.results || response.items || [];
      setRecords(results);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRecords();
  };

  return (
    <div className="space-y-6">
      <GhatQualityCheckHeader
        title="Ghat Quality Checks"
        description="View and manage all ghat quality check records"
      />

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Records</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Records</CardTitle>
              <CardDescription>
                Showing {records.length} records
              </CardDescription>
            </div>
            <Link href="/process/ghat-quality-check/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No records found
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by creating a new record"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">
                        {record.account_order_id || "No Order ID"}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                    {record.carry_forward_image_url && (
                      <p className="text-sm text-muted-foreground">
                        Has carry-forward image
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/process/ghat-quality-check/detail/${record.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link
                      href={`/process/ghat-quality-check/edit/${record.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
