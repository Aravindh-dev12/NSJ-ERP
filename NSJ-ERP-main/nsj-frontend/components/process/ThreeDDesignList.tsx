"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { threeDDesignList } from "@/lib/backend";
import { type ThreeDDesign } from "@/lib/backend";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

export function ThreeDDesignList() {
  const [designs, setDesigns] = useState<ThreeDDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadDesigns = async () => {
      setLoading(true);
      try {
        const response = await threeDDesignList({
          page,
          page_size: PAGE_SIZE,
          search: searchTerm || undefined,
        });

        const items = response.results || [];
        const count = response.count || items.length;

        setDesigns(items);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      } catch (error) {
        console.error("Failed to fetch 3D designs", error);
      } finally {
        setLoading(false);
      }
    };
    loadDesigns();
  }, [page, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All 3D Designs</CardTitle>
              <CardDescription>List of all 3D design records</CardDescription>
            </div>
            <Link href="/process/3d-design/add">
              <Button>Add New Design</Button>
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
            <p className="text-sm text-muted-foreground">Loading designs...</p>
          ) : designs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "No designs found matching your search."
                  : "No designs found."}
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    (window.location.href = "/process/3d-design/add")
                  }
                >
                  Create Your First Design
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-3">Order ID</div>
                  <div className="col-span-2">Design Image</div>
                  <div className="col-span-2">Approved Image</div>
                  <div className="col-span-3">Created Date</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
                  >
                    <div className="col-span-3 font-medium">
                      {design.account_order_id || "No ID"}
                    </div>
                    <div className="col-span-2">
                      {design.design_image_url ? (
                        <a
                          href={design.design_image_url}
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
                    <div className="col-span-2">
                      {design.approved_design_image_url ? (
                        <a
                          href={design.approved_design_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:underline"
                        >
                          View Approved
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {new Date(design.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/process/3d-design/detail/${design.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}{" "}
                    designs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {page} of {totalPages}
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
