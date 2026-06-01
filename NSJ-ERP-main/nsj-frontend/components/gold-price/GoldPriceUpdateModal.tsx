"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { goldPricesCreate, type GoldPriceCreateData } from "@/lib/backend";
import { DollarSign } from "lucide-react";

interface GoldPriceUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GoldPriceUpdateModal({
  open,
  onOpenChange,
  onSuccess,
}: GoldPriceUpdateModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GoldPriceCreateData>({
    gold_24k_rate: "",
    gold_22k_rate: "",
    silver_rate: "",
    update_type: "OPENING",
    feeding_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation
      if (
        !form.gold_24k_rate ||
        parseFloat(form.gold_24k_rate.toString()) <= 0
      ) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please enter a valid 24K gold rate",
        });
        setSubmitting(false);
        return;
      }

      if (
        !form.gold_22k_rate ||
        parseFloat(form.gold_22k_rate.toString()) <= 0
      ) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please enter a valid 22K gold rate",
        });
        setSubmitting(false);
        return;
      }

      await goldPricesCreate(form);

      toast({
        title: "Success",
        description: "Gold price updated successfully",
      });

      // Reset form
      setForm({
        gold_24k_rate: "",
        gold_22k_rate: "",
        silver_rate: "",
        update_type: "OPENING",
        feeding_date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update gold price",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Update Gold Price
          </DialogTitle>
          <DialogDescription>
            Enter the current gold and silver rates. This will be used across
            the system for calculations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feeding_date">Date *</Label>
              <Input
                id="feeding_date"
                type="date"
                value={form.feeding_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, feeding_date: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="update_type">Update Type *</Label>
              <select
                id="update_type"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.update_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    update_type: e.target.value as "OPENING" | "CLOSING",
                  }))
                }
                required
              >
                <option value="OPENING">Opening (12 PM)</option>
                <option value="CLOSING">Closing (Before 10 PM)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gold_24k_rate">24K Gold Rate (₹/gram) *</Label>
            <Input
              id="gold_24k_rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter 24K gold rate"
              value={form.gold_24k_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, gold_24k_rate: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gold_22k_rate">22K Gold Rate (₹/gram) *</Label>
            <Input
              id="gold_22k_rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter 22K gold rate"
              value={form.gold_22k_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, gold_22k_rate: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="silver_rate">Silver Rate (₹/gram)</Label>
            <Input
              id="silver_rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter silver rate (optional)"
              value={form.silver_rate}
              onChange={(e) =>
                setForm((f) => ({ ...f, silver_rate: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this rate update"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Gold Price"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
