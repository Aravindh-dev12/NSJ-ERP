"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { masterRequestCreate } from "@/lib/backend";

interface RequestAdditionDialogProps {
  open: boolean;
  onClose: () => void;
  masterType: string;
  masterTypeDisplay: string;
  onSuccess?: () => void;
}

export function RequestAdditionDialog({
  open,
  onClose,
  masterType,
  masterTypeDisplay,
  onSuccess,
}: RequestAdditionDialogProps) {
  const { toast } = useToast();
  const [requestedValue, setRequestedValue] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedValue.trim()) {
      toast({
        variant: "destructive",
        title: "Value Required",
        description: `Please enter the ${masterTypeDisplay.toLowerCase()} you want to add.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await masterRequestCreate({
        master_type: masterType,
        requested_value: requestedValue.trim(),
        additional_info: additionalInfo.trim() || undefined,
      });

      toast({
        title: "Request Submitted",
        description: `Your request to add "${requestedValue}" has been submitted for admin approval.`,
      });

      setRequestedValue("");
      setAdditionalInfo("");
      onClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description:
          error instanceof Error ? error.message : "Failed to submit request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">
          Request New {masterTypeDisplay}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requested-value">{masterTypeDisplay} Name *</Label>
            <Input
              id="requested-value"
              placeholder={`e.g., ${
                masterType === "item_name"
                  ? "Anklet"
                  : masterType === "gold_carat"
                    ? "21K"
                    : "New Value"
              }`}
              value={requestedValue}
              onChange={(e) => setRequestedValue(e.target.value)}
              disabled={isSubmitting}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This will be reviewed by an admin before being added to the
              system.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info">
              Additional Information (Optional)
            </Label>
            <textarea
              id="additional-info"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
              placeholder="Any additional context or details..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
