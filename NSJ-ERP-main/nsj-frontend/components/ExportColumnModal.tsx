import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExportColumnModalProps {
  columns: string[];
  selected: string[];
  onChange: (cols: string[]) => void;
  onClose: () => void;
  onExport: () => void;
  loading?: boolean;
}

// Map canonical column keys to professional display names
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  invoice_no: "Invoice No",
  invoice_date: "Invoice Date",
  party_name: "Party Name",
  city: "City",
  state: "State",
  cat_no: "Catalog No",
  product_description: "Product Description",
  product_category: "Product Category",
  quantity: "Quantity",
  rate: "Rate",
  total_amt: "Total Amount",
  net_amount: "Net Amount",
  tcs: "TCS",
  freight: "Freight",
  disc_percent: "Discount %",
  adjustment_of_goods_return: "Goods Return Adj.",
  lr_no: "LR No",
  lr_date: "LR Date",
  transporter_name: "Transporter Name",
  order_no: "Order No",
  po_no: "PO No",
  order_dt: "Order Date",
  sales_person_name: "Salesperson Name",
};

export function ExportColumnModal({
  columns,
  selected,
  onChange,
  onClose,
  onExport,
  loading,
}: ExportColumnModalProps) {
  const toggle = (col: string) => {
    if (selected.includes(col)) {
      onChange(selected.filter((c) => c !== col));
    } else {
      onChange([...selected, col]);
    }
  };

  const handleSelectAll = () => {
    onChange([...columns]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select columns to export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSelectAll}
              disabled={selected.length === columns.length || loading}
              aria-label="Select all columns"
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDeselectAll}
              disabled={selected.length === 0 || loading}
              aria-label="Deselect all columns"
            >
              Deselect All
            </Button>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {columns.map((col) => (
              <label key={col} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(col)}
                  onChange={() => toggle(col)}
                  className="accent-blue-600"
                />
                <span className="text-sm">
                  {COLUMN_DISPLAY_NAMES[col] || col}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={onExport}
              disabled={loading || selected.length === 0}
              aria-label="Download export file"
            >
              {loading ? "Exporting..." : "Download"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
