"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { queryDetail, queryReopen, type QueryResponse } from "@/lib/backend";
import { generateQueryPDF } from "@/lib/queryPDF";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export function ArchivedQueryDetailClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [query, setQuery] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const queryId = params.id as string;

  useEffect(() => {
    const loadQuery = async () => {
      setLoading(true);
      try {
        const data = await queryDetail(queryId);
        setQuery(data);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load archived query",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadQuery();
  }, [queryId, toast]);

  const handleReopen = async () => {
    if (!query) return;
    setReopening(true);
    try {
      await queryReopen(query.id);
      toast({
        title: "Query Reopened",
        description: "The query has been moved back to pending queries.",
      });
      router.push("/vouchers/pending-queries");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to reopen query",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setReopening(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!query) return;
    setDownloadingPDF(true);
    try {
      const pdfData = {
        accountName: query.account?.account_name || "Unknown",
        subaccount: query.subaccount || "",
        location: query.location || "",
        itemName: query.item_name?.name || query.item_name_custom || "Unknown",
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
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Archived query not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/vouchers/archived-queries")}
        >
          Back to Archived Queries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Archived Order Details
          </h1>
          <p className="text-muted-foreground mt-2">
            Order ID: {query.id.slice(0, 8)}...
          </p>
        </div>
        <PreviousBackButton />
      </div>

      {/* Archived Banner */}
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-semibold">📦 Archived Order</span>
          <span className="text-gray-700">
            This query was archived on{" "}
            {query.archived_at
              ? new Date(query.archived_at).toLocaleDateString()
              : "N/A"}
            . You can download the PDF or reopen it if needed.
          </span>
        </div>
      </div>

      {/* Query Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Query Information</CardTitle>
              <CardDescription>
                Created on {new Date(query.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800">
              📦 Archived
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Account Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Account Name
                </Label>
                <p className="font-medium">
                  {query.account?.account_name || query.account?.name || "—"}
                </p>
              </div>
              {query.subaccount && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-sm">
                    Subaccount
                  </Label>
                  <p className="font-medium">{query.subaccount}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Location
                </Label>
                <p className="font-medium">{query.location || "—"}</p>
              </div>
            </div>
          </div>

          {/* Item Details Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Item Details
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Item Name
                </Label>
                <p className="font-medium">
                  {query.item_name?.name || query.item_name_custom || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Gold Carat
                </Label>
                <p className="font-medium">{query.gold_carat}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Gender</Label>
                <p className="font-medium">{query.gender || "—"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Size</Label>
                <p className="font-medium">{query.size}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Delivery Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Location
                </Label>
                <p className="font-medium">{query.location || "—"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Delivery Type
                </Label>
                <p className="font-medium">{query.delivery_type || "—"}</p>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Timeline
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Query Date
                </Label>
                <p className="font-medium">
                  {new Date(query.query_in_date).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Expiry Date
                </Label>
                <p className="font-medium">
                  {query.expiry_date
                    ? new Date(query.expiry_date).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Archived Date
                </Label>
                <p className="font-medium">
                  {query.archived_at
                    ? new Date(query.archived_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Last Updated
                </Label>
                <p className="font-medium">
                  {new Date(query.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Reference Image Section */}
          {query.reference_image && (
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                Reference Image
              </h3>
              <img
                src={query.reference_image}
                alt="Reference"
                className="max-w-sm rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Download the PDF or reopen this query to move it back to pending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? "Generating PDF..." : "📄 Download PDF"}
          </Button>

          <Button
            variant="outline"
            className="w-full text-green-600 hover:text-green-900 border-green-600"
            onClick={handleReopen}
            disabled={reopening}
          >
            {reopening ? "Reopening..." : "↩️ Reopen Query"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/vouchers/archived-queries")}
          >
            Back to Archived Queries
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
