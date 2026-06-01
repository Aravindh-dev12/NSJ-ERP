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
import { Badge } from "@/components/ui/badge";
import {
  preRhodiumQualityCheckList,
  type PreRhodiumQualityCheck,
} from "@/lib/backend";
import {
  Search,
  Plus,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { PreRhodiumQualityCheckHeader } from "@/components/process/PreRhodiumQualityCheckHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import { getLocalFirstOfMonth, getLocalToday } from "@/lib/date";

export function PreRhodiumQualityCheckList() {
  const router = useRouter();
  const [records, setRecords] = useState<PreRhodiumQualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dateFrom, setDateFrom] = useState(getLocalFirstOfMonth());
  const [dateTo, setDateTo] = useState(getLocalToday());

  useEffect(() => {
    loadRecords();
  }, [currentPage, searchTerm, dateFrom, dateTo]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await preRhodiumQualityCheckList({
        page: currentPage,
        page_size: 10,
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
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
      <PreviousBackButton />
      <PreRhodiumQualityCheckHeader
        title="Pre-Rhodium Quality Checks"
        description="View and manage all pre-rhodium quality check records"
      />

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Records</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4" />
              </Button>
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
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>All Records</CardTitle>
          <CardDescription>
            Showing {records.length} of {records.length} records
          </CardDescription>
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
                      <Badge
                        variant={
                          record.quality_check ? "default" : "destructive"
                        }
                      >
                        {record.quality_check ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Passed
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created:{" "}
                      {new Date(record.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/process/pre-rhodium-quality-check/detail/${record.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link
                      href={`/process/pre-rhodium-quality-check/edit/${record.id}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
