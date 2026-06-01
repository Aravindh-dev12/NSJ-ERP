"use client";

import { useState, useEffect } from "react";
import {
  dashboardConfigCurrent,
  type DashboardConfiguration,
  type DashboardWidget,
} from "@/lib/backend";
import { TaskManagementWidget } from "@/components/widgets/TaskManagementWidget";
import { PendingInvoicesWidget } from "@/components/widgets/PendingInvoicesWidget";
import { AdvancePaymentsWidget } from "@/components/widgets/AdvancePaymentsWidget";
import { ProductionWorkflowWidget } from "@/components/widgets/ProductionWorkflowWidget";
import { InventorySummaryWidget } from "@/components/widgets/InventorySummaryWidget";
import { SalesLeadDashboardWidget } from "@/components/widgets/SalesLeadDashboardWidget";
import { NeedFounderWidget } from "@/components/widgets/NeedFounderWidget";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function DepartmentDashboard() {
  const [config, setConfig] = useState<DashboardConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardConfig();
  }, []);

  const loadDashboardConfig = async () => {
    try {
      const dashboardConfig = await dashboardConfigCurrent();
      setConfig(dashboardConfig);
    } catch (error: any) {
      console.error("Failed to load dashboard config:", error);
      // If 404, user has no active department or no config - this is expected
      // Component will show "No Dashboard Configuration" message
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case "TASK_MANAGEMENT":
        return <TaskManagementWidget key={widget.position} />;
      case "PENDING_INVOICES":
        return <PendingInvoicesWidget key={widget.position} />;
      case "ADVANCE_PAYMENTS":
        return <AdvancePaymentsWidget key={widget.position} />;
      case "PRODUCTION_WORKFLOW":
        return <ProductionWorkflowWidget key={widget.position} />;
      case "INVENTORY_SUMMARY":
        return <InventorySummaryWidget key={widget.position} />;
      case "SALES_QUERY_DASHBOARD":
        return <SalesLeadDashboardWidget key={widget.position} />;
      case "NEED_FOUNDER_INTERVENTION":
        return <NeedFounderWidget key={widget.position} />;
      default:
        return null;
    }
  };

  if (loading) {
    return null; // Don't show loading state for department dashboard
  }

  // Don't render anything if no config (user has no departments)
  if (!config) {
    return null;
  }

  // Sort widgets by position
  const sortedWidgets = [...config.widgets].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card className="rounded-3xl border-white/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {config.department.name} Dashboard
          </CardTitle>
          {config.department.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {config.department.description}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Need Founder Intervention - Always show at top if there are tasks */}
      <NeedFounderWidget />

      {/* Widgets Grid */}
      <div
        className={`grid gap-6 ${config.layout_type === "GRID" ? "lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {sortedWidgets.map((widget) => renderWidget(widget))}
      </div>
    </div>
  );
}
