"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  title?: string;
  actionType?: "save" | "markDone";
}

export function MissingFieldsModal({
  isOpen,
  onClose,
  missingFields,
  title = "Required Fields Missing",
  actionType = "save",
}: MissingFieldsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {actionType === "markDone"
              ? "The following required fields must be filled before marking this step as done:"
              : "Cannot save — the following required fields are missing:"}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-2">
          <ul className="space-y-2">
            {missingFields.map((field, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-destructive mt-0.5">•</span>
                <span className="text-foreground font-medium">{field}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {actionType === "markDone" ? "OK, Go Back" : "OK, Go Back"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
