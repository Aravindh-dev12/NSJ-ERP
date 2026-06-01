"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  masterRequestsList,
  masterRequestApprove,
  masterRequestReject,
  type MasterDataRequest,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function MasterRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MasterDataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await masterRequestsList({
        status: filter === "all" ? undefined : filter,
      });
      setRequests(response.results || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load requests",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this request?")) return;

    setProcessingId(id);
    try {
      await masterRequestApprove(id);
      toast({
        title: "Request Approved",
        description: "The master data has been added to the system.",
      });
      loadRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await masterRequestReject(id, rejectionReason);
      toast({
        title: "Request Rejected",
        description: "The request has been rejected.",
      });
      setRejectingId(null);
      setRejectionReason("");
      loadRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Master Data Requests</h1>
          <p className="text-muted-foreground">
            Review and approve requests to add new master data
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/masters-hub/item-master")}
        >
          Back to Masters
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "pending"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setFilter("pending")}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "approved"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setFilter("approved")}
        >
          Approved
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "rejected"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "all"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No {filter !== "all" ? filter : ""} requests found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {request.requested_value}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      <span className="font-medium">
                        {request.master_type_display}
                      </span>{" "}
                      • Requested by {request.requested_by_name} •{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {request.additional_info && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Additional Info:</strong>{" "}
                      {request.additional_info}
                    </p>
                  </div>
                )}

                {request.status === "rejected" && request.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong>{" "}
                      {request.rejection_reason}
                    </p>
                  </div>
                )}

                {request.status === "approved" && request.reviewed_by_name && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Approved by {request.reviewed_by_name} on{" "}
                    {request.reviewed_at
                      ? new Date(request.reviewed_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                )}

                {request.status === "pending" && (
                  <div className="flex gap-3">
                    {rejectingId === request.id ? (
                      <div className="flex-1 space-y-3">
                        <textarea
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                          placeholder="Reason for rejection (optional)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id
                              ? "Rejecting..."
                              : "Confirm Reject"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processingId === request.id
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setRejectingId(request.id)}
                          disabled={processingId === request.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
