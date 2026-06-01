import { CheckCircle2 } from "lucide-react";

interface OrderDetailsDisplayProps {
  validatedOrder: any;
}

export function OrderDetailsDisplay({
  validatedOrder,
}: OrderDetailsDisplayProps) {
  if (!validatedOrder) return null;

  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
      <p className="text-sm font-semibold text-green-800 flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Order ID validated successfully
      </p>

      {/* Account Details */}
      {validatedOrder.account && (
        <div className="border-t border-green-200 pt-3">
          <p className="text-sm font-semibold text-green-800 mb-2">
            Account Details:
          </p>
          <div className="text-sm text-green-700 space-y-1 pl-3">
            <p>
              <strong>Account Name:</strong>{" "}
              {validatedOrder.account.account_name || "N/A"}
            </p>
            {validatedOrder.account.email && (
              <p>
                <strong>Email:</strong> {validatedOrder.account.email}
              </p>
            )}
            {validatedOrder.account.phone && (
              <p>
                <strong>Phone:</strong> {validatedOrder.account.phone}
              </p>
            )}
            {validatedOrder.account.address && (
              <p>
                <strong>Address:</strong> {validatedOrder.account.address}
                {validatedOrder.account.city &&
                  `, ${validatedOrder.account.city}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="border-t border-green-200 pt-3">
        <p className="text-sm font-semibold text-green-800 mb-2">
          Order Details:
        </p>
        <div className="text-sm text-green-700 space-y-1 pl-3">
          <p>
            <strong>Bill No:</strong> {validatedOrder.bill_no || "N/A"}
          </p>
          <p>
            <strong>Job No:</strong> {validatedOrder.job_no || "N/A"}
          </p>
          {validatedOrder.item_name && (
            <p>
              <strong>Item:</strong> {validatedOrder.item_name}
            </p>
          )}
          {validatedOrder.date && (
            <p>
              <strong>Date:</strong>{" "}
              {new Date(validatedOrder.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
