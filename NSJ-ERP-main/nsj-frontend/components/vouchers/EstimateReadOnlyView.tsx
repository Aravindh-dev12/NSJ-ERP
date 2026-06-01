"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { EstimateVoucher } from "@/components/vouchers/EstimateVoucherForm";

interface EstimateReadOnlyViewProps {
  estimate: EstimateVoucher;
}

export function EstimateReadOnlyView({ estimate }: EstimateReadOnlyViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estimate Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Order ID
              </label>
              <p className="font-semibold">{estimate.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="font-semibold">{formatDate(estimate.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Item Name
              </label>
              <p className="font-semibold">{estimate.item_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Customer
              </label>
              <p className="font-semibold">
                {typeof estimate.account === "object" &&
                estimate.account?.account_name
                  ? estimate.account.account_name
                  : typeof estimate.account === "string"
                    ? estimate.account
                    : "N/A"}
              </p>
            </div>
            {estimate.gold_quality && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Gold Quality
                </label>
                <p className="font-semibold">{estimate.gold_quality}</p>
              </div>
            )}
            {estimate.size_details && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Size Details
                </label>
                <p className="font-semibold">{estimate.size_details}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Image */}
      {(estimate as any).product_image && (
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={(estimate as any).product_image}
              alt="Product reference"
              className="max-w-xs rounded-lg border object-contain"
            />
          </CardContent>
        </Card>
      )}

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold text-sm">
                    Particulars
                  </th>
                  <th className="text-left p-3 font-semibold text-sm">Shape</th>
                  <th className="text-left p-3 font-semibold text-sm">
                    Colour
                  </th>
                  <th className="text-left p-3 font-semibold text-sm">
                    Clarity
                  </th>
                  <th className="text-center p-3 font-semibold text-sm">Pcs</th>
                  <th className="text-center p-3 font-semibold text-sm">
                    Weight
                  </th>
                  <th className="text-center p-3 font-semibold text-sm">
                    Unit
                  </th>
                  <th className="text-right p-3 font-semibold text-sm">Rate</th>
                  <th className="text-right p-3 font-semibold text-sm">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.line_items?.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3 text-sm">{item.particulars}</td>
                    <td className="p-3 text-sm">{item.shape || "-"}</td>
                    <td className="p-3 text-sm">{item.colour || "-"}</td>
                    <td className="p-3 text-sm">{item.clarity || "-"}</td>
                    <td className="p-3 text-sm text-center">
                      {item.pc || "-"}
                    </td>
                    <td className="p-3 text-sm text-center">
                      {item.weight && !isNaN(Number(item.weight))
                        ? Number(item.weight).toFixed(3)
                        : "-"}
                    </td>
                    <td className="p-3 text-sm text-center">
                      {item.unit || "-"}
                    </td>
                    <td className="p-3 text-sm text-right">
                      {item.rate ? formatCurrency(item.rate) : "-"}
                    </td>
                    <td className="p-3 text-sm text-right font-semibold">
                      {formatCurrency(item.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">Total Taxable Value:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(estimate.total_taxable_value || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="font-medium">GST Amount (3%):</span>
              <span className="font-semibold text-lg text-blue-700">
                {formatCurrency(estimate.gst_amount || 0)}
              </span>
            </div>
            {estimate.discount_amount && estimate.discount_amount > 0 && (
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="font-medium">Discount Amount:</span>
                <span className="font-semibold text-lg text-orange-700">
                  -{formatCurrency(estimate.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-4 bg-green-50 border-2 border-green-200 rounded">
              <span className="font-bold text-lg">Grand Total:</span>
              <span className="font-bold text-xl text-green-700">
                {formatCurrency(estimate.grand_total || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <p>Estimate ID: {estimate.id}</p>
              {estimate.created_at && (
                <p>Created on: {formatDate(estimate.created_at)}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className="text-green-700 border-green-200"
            >
              ✓ Approved & Locked
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
