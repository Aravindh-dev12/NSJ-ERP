import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { backend } from "@/lib/backend";

interface DashboardKPIsProps {
  refreshKey?: number;
}

function formatCurrency(value: number | null) {
  if (value === null) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCount(value: number | null) {
  if (value === null) return "--";
  return value.toLocaleString("en-IN");
}

const KPI_CARDS = [
  {
    key: "totalSales",
    title: "Total Sales",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: (props: { className?: string }) => (
      <span
        className={props.className || ""}
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}
      >
        ₹
      </span>
    ),
  },
  {
    key: "totalOrders",
    title: "Total Orders",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: ShoppingCart,
  },
  {
    key: "totalQuantity",
    title: "Total Quantity",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    icon: Package,
  },
  {
    key: "averageOrderValue",
    title: "Average Order Value",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    icon: TrendingUp,
  },
] as const;

type KpiKey = (typeof KPI_CARDS)[number]["key"];

export function DashboardKPIs({ refreshKey }: DashboardKPIsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregates, setAggregates] = useState<
    Partial<{
      total_sales: number | null;
      total_orders: number | null;
      total_quantity: number | null;
      average_order_value: number | null;
    }>
  >({});
  const [latestMonthLabel, setLatestMonthLabel] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await backend.getSalesAggregates();
        if (!cancelled) {
          setAggregates({
            total_sales:
              typeof data.total_sales === "string"
                ? Number(data.total_sales.replace(/[\,\s]/g, ""))
                : (data.total_sales ?? null),
            total_orders:
              typeof data.total_orders === "string"
                ? Number(data.total_orders.replace(/[\,\s]/g, ""))
                : (data.total_orders ?? null),
            total_quantity:
              typeof data.total_quantity === "string"
                ? Number(data.total_quantity.replace(/[\,\s]/g, ""))
                : (data.total_quantity ?? null),
            average_order_value:
              typeof data.average_order_value === "string"
                ? Number(data.average_order_value.replace(/[\,\s]/g, ""))
                : (data.average_order_value ?? null),
          });
          setLatestMonthLabel(
            typeof data.latest_month_label === "string"
              ? data.latest_month_label
              : ""
          );
        }
      } catch (err) {
        if (!cancelled) {
          setAggregates({});
          setError("Failed to load KPI metrics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Unable to load KPI metrics. {error}
      </div>
    );
  }

  // Always render all KPI cards, using '--' for missing/undefined/null values
  const totalSales = aggregates?.total_sales ?? null;
  const totalOrders = aggregates?.total_orders ?? null;
  const totalQuantity = aggregates?.total_quantity ?? null;
  const averageOrderValue = aggregates?.average_order_value ?? null;

  const values: Record<KpiKey, string> = {
    totalSales: formatCurrency(totalSales),
    totalOrders: formatCount(totalOrders),
    totalQuantity: formatCount(totalQuantity),
    averageOrderValue: formatCurrency(averageOrderValue),
  };

  const meta: Record<KpiKey, string> = {
    totalSales: latestMonthLabel
      ? `Gross revenue for ${latestMonthLabel}`
      : "Gross revenue for last 30 days",
    totalOrders: latestMonthLabel
      ? `Orders processed in ${latestMonthLabel}`
      : "Orders processed in last 30 days",
    totalQuantity: latestMonthLabel
      ? `Items fulfilled in ${latestMonthLabel}`
      : "Items fulfilled in last 30 days",
    averageOrderValue: latestMonthLabel
      ? `Revenue per order (${latestMonthLabel})`
      : "Revenue per order for last 30 days",
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className="border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`${card.iconBg} flex h-10 w-10 items-center justify-center rounded-lg`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {values[card.key]}
                  </div>
                  <div className="text-sm text-gray-600">{card.title}</div>
                  <p className="text-xs text-muted-foreground">
                    {meta[card.key]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
