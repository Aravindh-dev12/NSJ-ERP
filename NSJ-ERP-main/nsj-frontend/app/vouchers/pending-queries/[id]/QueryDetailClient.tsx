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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";
import {
  queryDetail,
  queryArchive,
  queryReopen,
  queryUpdate,
  type QueryResponse,
} from "@/lib/backend";

const DELIVERY_TYPE_OPTIONS = [
  { label: "Home Delivery", value: "HOME" },
  { label: "Pickup", value: "PICKUP" },
  { label: "In-Store", value: "INSTORE" },
  { label: "Local Parcel", value: "LOCAL_PARCEL" },
  { label: "Jay Ambe Express Logistics", value: "JAY_AMBE" },
  { label: "Maa Bhawani Logistics", value: "MAA_BHAWANI" },
  { label: "BVC Logistics", value: "BVC" },
  { label: "Sequel Logistics", value: "SEQUEL" },
];

// Calculate days until expiry
function getDaysUntilExpiry(
  expiryDate: string | null | undefined
): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get status badge styling
function getStatusBadge(status: string, isExpired: boolean) {
  if (isExpired || status === "archived") {
    return {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: isExpired ? "Expired" : "Archived",
    };
  }
  switch (status) {
    case "pending":
      return { bg: "bg-yellow-50", text: "text-yellow-800", label: "Pending" };
    case "converted_to_order":
      return {
        bg: "bg-green-50",
        text: "text-green-800",
        label: "Converted to Order",
      };
    case "rejected":
      return { bg: "bg-red-50", text: "text-red-800", label: "Rejected" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-800", label: status };
  }
}

// Type for editable query fields
type EditableQueryFields = {
  gold_carat: string;
  gender: string;
  size: string;
  location: string;
  delivery_type: string;
  query_in_date: string;
  expiry_date: string;
};

export function QueryDetailClient() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [query, setQuery] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditableQueryFields>({
    gold_carat: "",
    gender: "",
    size: "",
    location: "",
    delivery_type: "",
    query_in_date: "",
    expiry_date: "",
  });

  const queryId = params.id as string;

  useEffect(() => {
    const loadQuery = async () => {
      setLoading(true);
      try {
        const data = await queryDetail(queryId);
        setQuery(data);
        // Initialize edit form with current values
        setEditForm({
          gold_carat: data.gold_carat || "",
          gender: data.gender || "",
          size: data.size || "",
          location: data.location || "",
          delivery_type: data.delivery_type || "",
          query_in_date: data.query_in_date || "",
          expiry_date: data.expiry_date || "",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to load query",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadQuery();
  }, [queryId, toast]);

  const handleArchive = async () => {
    if (!query) return;
    setArchiving(true);
    try {
      await queryArchive(query.id);
      toast({
        title: "Query archived",
        description: "The query has been moved to archives.",
      });
      router.push("/vouchers/pending-queries");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to archive query",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setArchiving(false);
    }
  };

  const handleReopen = async () => {
    if (!query) return;
    setReopening(true);
    try {
      const updatedQuery = await queryReopen(query.id);
      setQuery(updatedQuery);
      toast({
        title: "Query reopened",
        description: "The query has been reactivated and is now pending.",
      });
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

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form to current query values
      if (query) {
        setEditForm({
          gold_carat: query.gold_carat || "",
          gender: query.gender || "",
          size: query.size || "",
          location: query.location || "",
          delivery_type: query.delivery_type || "",
          query_in_date: query.query_in_date || "",
          expiry_date: query.expiry_date || "",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    field: keyof EditableQueryFields,
    value: string
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!query) return;
    setSaving(true);
    try {
      // Build payload with only changed fields
      const payload: Partial<QueryResponse> = {};
      if (editForm.gold_carat !== query.gold_carat)
        payload.gold_carat = editForm.gold_carat;
      if (editForm.gender !== (query.gender || ""))
        payload.gender = editForm.gender || null;
      if (editForm.size !== query.size) payload.size = editForm.size;
      if (editForm.location !== (query.location || ""))
        payload.location = editForm.location || null;
      if (editForm.delivery_type !== (query.delivery_type || ""))
        payload.delivery_type = editForm.delivery_type || null;
      if (editForm.query_in_date !== query.query_in_date)
        payload.query_in_date = editForm.query_in_date;
      if (editForm.expiry_date !== (query.expiry_date || ""))
        payload.expiry_date = editForm.expiry_date || null;

      const updatedQuery = await queryUpdate(query.id, payload);
      setQuery(updatedQuery);
      setIsEditing(false);
      toast({
        title: "Query updated",
        description: "Changes have been saved successfully.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to update query",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
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
        <p className="text-muted-foreground">Query not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/vouchers/pending-queries")}
        >
          Back to Pending Queries
        </Button>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(query.expiry_date);
  const statusBadge = getStatusBadge(query.status, query.is_expired);
  const isApproachingExpiry =
    daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  const canConvert = query.status === "pending" && !query.is_expired;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground mt-2">
            Order ID: {query.id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex gap-2">
          {query.status === "pending" && (
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={handleEditToggle}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          )}
          <PreviousBackButton />
        </div>
      </div>

      {/* Expiry Warning Banner */}
      {isApproachingExpiry && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-semibold">
              ⚠️ Expiry Warning
            </span>
            <span className="text-orange-700">
              This query expires in {daysUntilExpiry} day
              {daysUntilExpiry !== 1 ? "s" : ""}. Please follow up with the
              client or convert to order before expiry.
            </span>
          </div>
        </div>
      )}

      {/* Expired Banner */}
      {query.is_expired && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">❌ Query Expired</span>
            <span className="text-red-700">
              This query has expired and will be auto-archived. Contact the
              client if they wish to reactivate.
            </span>
          </div>
        </div>
      )}

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
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
            >
              {statusBadge.label}
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
                {isEditing ? (
                  <Input
                    value={editForm.gold_carat}
                    onChange={(e) =>
                      handleInputChange("gold_carat", e.target.value)
                    }
                    placeholder="e.g., 22K, 24K, 18K"
                  />
                ) : (
                  <p className="font-medium">{query.gold_carat}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Gender</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    placeholder="e.g., Man, Woman, Unisex"
                  />
                ) : (
                  <p className="font-medium">{query.gender || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Size</Label>
                {isEditing ? (
                  <Input
                    value={editForm.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    placeholder="Size"
                  />
                ) : (
                  <p className="font-medium">{query.size}</p>
                )}
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
                {isEditing ? (
                  <Input
                    value={editForm.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Location"
                  />
                ) : (
                  <p className="font-medium">{query.location || "—"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Delivery Type
                </Label>
                {isEditing ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editForm.delivery_type}
                    onChange={(e) =>
                      handleInputChange("delivery_type", e.target.value)
                    }
                  >
                    <option value="">Select delivery type</option>
                    {DELIVERY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-medium">{query.delivery_type || "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Timeline
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Query In Date
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm.query_in_date}
                    onChange={(e) =>
                      handleInputChange("query_in_date", e.target.value)
                    }
                  />
                ) : (
                  <p className="font-medium">
                    {new Date(query.query_in_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Expiry Date
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm.expiry_date}
                    onChange={(e) =>
                      handleInputChange("expiry_date", e.target.value)
                    }
                  />
                ) : (
                  <p
                    className={`font-medium ${query.is_expired ? "text-destructive" : isApproachingExpiry ? "text-orange-600" : ""}`}
                  >
                    {query.expiry_date
                      ? new Date(query.expiry_date).toLocaleDateString()
                      : "—"}
                    {query.is_expired && " (Expired)"}
                    {isApproachingExpiry && ` (${daysUntilExpiry} days left)`}
                  </p>
                )}
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
            {isEditing
              ? "Save your changes or cancel to discard them"
              : query.status === "archived"
                ? "This query is archived. You can reopen it to reactivate."
                : canConvert
                  ? "Convert this query to an order after receiving advance payment"
                  : query.is_expired
                    ? "This query has expired. Archive it or contact the client to reactivate."
                    : "This query has already been processed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleEditToggle}
                disabled={saving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {canConvert && (
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/vouchers/pending-queries/${query.id}/convert`)
                  }
                >
                  Convert to Order (Link Receipt Voucher)
                </Button>
              )}

              {query.status === "pending" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleArchive}
                  disabled={archiving}
                >
                  {archiving ? "Archiving..." : "Archive Query"}
                </Button>
              )}

              {query.status === "archived" && (
                <Button
                  className="w-full"
                  onClick={handleReopen}
                  disabled={reopening}
                >
                  {reopening ? "Reopening..." : "Reopen Query"}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/vouchers/pending-queries`)}
              >
                Back to Pending Queries
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
