"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GoldQualityOption {
  value: string;
  label: string;
}

interface GoldQualityInputProps {
  value: string;
  onChange: (value: string) => void;
  options?: GoldQualityOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Gold Quality Input Component
 * 
 * Shows dropdown with standard options + "Custom" option at the end.
 * When "Custom" is selected, shows an input field below for manual entry.
 */
export function GoldQualityInput({
  value,
  onChange,
  options = [],
  placeholder = "Enter custom gold quality (e.g., 20KT, 23KT)",
  className,
  disabled = false,
}: GoldQualityInputProps) {
  // Track if custom input should be shown - initialize based on whether value is custom
  const [showCustomInput, setShowCustomInput] = React.useState(() => {
    // If value exists, check if it's custom
    if (!value) return false;
    // If options haven't loaded yet, assume custom if it doesn't look like standard format
    if (!options.length) {
      // Standard values are typically like "14KT", "18KT", etc. If value doesn't match pattern, treat as custom
      const standardPattern = /^(9|10|14|18|22|24)KT$/i;
      return !standardPattern.test(value);
    }
    // Options are loaded, check properly
    const standardValues = options.map(opt => opt.value);
    return !standardValues.includes(value);
  });
  
  // Update showCustomInput when options load and value exists
  React.useEffect(() => {
    if (value && options.length > 0) {
      const standardValues = options.map(opt => opt.value);
      const isCustom = !standardValues.includes(value);
      setShowCustomInput(isCustom);
    }
  }, [value, options]);
  
  // Check if value is a standard option
  const isStandardValue = React.useMemo(() => {
    if (!value) return false;
    const standardValues = options.map(opt => opt.value);
    return standardValues.includes(value);
  }, [value, options]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === "CUSTOM") {
      // User selected "Custom" - show input field
      setShowCustomInput(true);
      onChange(""); // Clear value for custom input
    } else {
      // User selected a standard option
      setShowCustomInput(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customValue = e.target.value.toUpperCase().slice(0, 10);
    onChange(customValue);
  };

  return (
    <div className={className}>
      <Label>Gold Quality (KT)</Label>
      
      {/* Dropdown with standard options + Custom option */}
      <select
        value={showCustomInput || !value ? "" : value}
        onChange={handleDropdownChange}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Select gold quality</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="CUSTOM">Custom (Enter manually)</option>
      </select>

      {/* Custom Input Field - Only shown when "Custom" is selected */}
      {showCustomInput && (
        <Input
          type="text"
          value={value}
          onChange={handleCustomInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-2"
          maxLength={10}
          autoFocus
        />
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        Select from standard options or choose "Custom" to enter your own value
      </p>
    </div>
  );
}
