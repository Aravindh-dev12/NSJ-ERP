"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RequestAdditionDialog } from "./RequestAdditionDialog";
import { useToast } from "@/hooks/use-toast";
import {
  itemNamesList,
  goldCaratsList,
  metalTypesList,
  metalColorsList,
  itemGroupsList,
} from "@/lib/backend";

export interface MasterDataOption {
  id: string;
  name: string;
  code?: string | null;
}

interface MasterDataDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  masterType:
    | "item_name"
    | "gold_carat"
    | "metal_type"
    | "metal_color"
    | "item_group";
  required?: boolean;
  disabled?: boolean;
  onRequestSuccess?: () => void;
  placeholder?: string;
  className?: string;
}

const MASTER_TYPE_CONFIG = {
  item_name: {
    display: "Item Name",
    fetchFn: itemNamesList,
  },
  gold_carat: {
    display: "Gold Carat",
    fetchFn: goldCaratsList,
  },
  metal_type: {
    display: "Metal Type",
    fetchFn: metalTypesList,
  },
  metal_color: {
    display: "Metal Color",
    fetchFn: metalColorsList,
  },
  item_group: {
    display: "Item Group",
    fetchFn: itemGroupsList,
  },
};

export function MasterDataDropdown({
  label,
  value,
  onChange,
  masterType,
  required = false,
  disabled = false,
  onRequestSuccess,
  placeholder = "Select...",
  className = "",
}: MasterDataDropdownProps) {
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [options, setOptions] = useState<MasterDataOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedOptions, setSortedOptions] = useState<MasterDataOption[]>([]);

  const config = MASTER_TYPE_CONFIG[masterType];
  const displayLabel = label || config.display;

  // Fetch options from API
  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      setLoading(true);
      try {
        const data = await config.fetchFn();
        if (mounted) {
          setOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(`Failed to load ${masterType}:`, error);
        if (mounted) {
          setOptions([]);
          toast({
            variant: "destructive",
            title: "Failed to load options",
            description: `Could not load ${config.display.toLowerCase()} options.`,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadOptions();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterType]);

  // Sort options alphabetically
  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      const sorted = [...options].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      setSortedOptions(sorted);
    } else {
      setSortedOptions([]);
    }
  }, [options]);

  const handleRequestSuccess = () => {
    toast({
      title: "Request Submitted",
      description: `Your request to add a new ${config.display.toLowerCase()} has been submitted for approval.`,
    });
    setShowRequestDialog(false);
    if (onRequestSuccess) {
      onRequestSuccess();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={`master-${masterType}`}>
        {displayLabel}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <select
          id={`master-${masterType}`}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          value={value}
          onChange={(e) => {
            if (e.target.value === "__request_addition__") {
              setShowRequestDialog(true);
              // Reset to empty after opening dialog
              setTimeout(() => onChange(""), 0);
            } else {
              onChange(e.target.value);
            }
          }}
          disabled={disabled || loading}
          required={required}
        >
          <option value="">{loading ? "Loading..." : placeholder}</option>
          {sortedOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
          {!disabled && !loading && (
            <option
              value="__request_addition__"
              className="font-semibold text-blue-600"
            >
              + Request Addition...
            </option>
          )}
        </select>
      </div>

      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowRequestDialog(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Can&apos;t find what you&apos;re looking for?
        </Button>
      )}

      <RequestAdditionDialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        masterType={masterType}
        masterTypeDisplay={config.display}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
