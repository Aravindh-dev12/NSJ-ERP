"use client";

import { use, useEffect, useState } from "react";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderIssueDetail, orderIssueUpdate } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

type Params = {
  id: string;
};

export default function OrderIssueDetailPage({ params }: { params: Params }) {
  const { id } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issue, setIssue] = useState<Record<string, unknown> | null>(null);
  const [editedIssue, setEditedIssue] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await orderIssueDetail(id);
        if (mounted) {
          setIssue(data);
          setEditedIssue(data);
        }
      } catch {
        if (mounted) {
          toast({
            variant: "destructive",
            title: "Failed to load order issue",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const handleSave = async () => {
    if (!editedIssue) return;
    setSaving(true);
    try {
      await orderIssueUpdate(id, editedIssue);
      toast({
        title: "Updated",
        description: "Order issue updated successfully.",
      });
      setIssue(editedIssue);
    } catch {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <VouchersHeader title="Order Issue" description="Loading..." />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="space-y-6">
        <VouchersHeader title="Order Issue" description="Not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VouchersHeader
        title="Edit Order Issue"
        description="View and manage order issue details."
      />

      <Card>
        <CardHeader>
          <CardTitle>Order Issue Details</CardTitle>
          <CardDescription>
            This order issue is linked to order:{" "}
            {issue.order && typeof issue.order === "object"
              ? ((issue.order as Record<string, unknown>).bill_no as string)
              : (issue.order as string)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Account</Label>
              <div className="mt-1 rounded border bg-muted/50 px-3 py-2 text-sm">
                {issue.account && typeof issue.account === "object"
                  ? ((issue.account as Record<string, unknown>)
                      .account_name as string) ||
                    ((issue.account as Record<string, unknown>).name as string)
                  : (issue.account as string)}
              </div>
            </div>

            <div>
              <Label>Item Name</Label>
              <div className="mt-1 rounded border bg-muted/50 px-3 py-2 text-sm">
                {issue.item_name && typeof issue.item_name === "object"
                  ? ((issue.item_name as Record<string, unknown>)
                      .name as string)
                  : (issue.item_name as string)}
              </div>
            </div>

            <div>
              <Label>Order Reference</Label>
              <Input
                value={(editedIssue?.order_ref as string) || ""}
                onChange={(e) =>
                  setEditedIssue({ ...editedIssue, order_ref: e.target.value })
                }
                placeholder="Order reference"
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
                value={(editedIssue?.status as string) || "pending"}
                onChange={(e) =>
                  setEditedIssue({ ...editedIssue, status: e.target.value })
                }
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Description/Notes</Label>
              <textarea
                className="mt-1 block w-full rounded border bg-transparent px-3 py-2 text-sm"
                rows={4}
                value={(editedIssue?.description as string) || ""}
                onChange={(e) =>
                  setEditedIssue({
                    ...editedIssue,
                    description: e.target.value,
                  })
                }
                placeholder="Add notes about this order issue"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setEditedIssue(issue)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
