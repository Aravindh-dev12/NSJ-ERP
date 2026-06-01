"use client";

import { useEffect, useState } from "react";
import {
  dailyReportDashboard,
  dailyReportList,
  dailyReportCreate,
  dailyBookCloseStatus,
  dailyBookCloseCreate,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Lock,
  Users,
  Package,
  ClipboardList,
} from "lucide-react";

export default function DailyReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dashboard, setDashboard] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [bookStatus, setBookStatus] = useState<any>(null);
  const [closingBooks, setClosingBooks] = useState(false);

  // My report form
  const [myReport, setMyReport] = useState({
    tasks_completed: "",
    tasks_pending: "",
    orders_processed: "",
    materials_issued: "",
    summary: "",
    challenges: "",
    next_day_plan: "",
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardResp, reportsResp, statusResp] = await Promise.all([
        dailyReportDashboard(selectedDate),
        dailyReportList({ date: selectedDate }),
        dailyBookCloseStatus(selectedDate),
      ]);
      setDashboard(dashboardResp);
      setReports(reportsResp.results ?? []);
      setBookStatus(statusResp);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleSubmitReport = async () => {
    setSubmittingReport(true);
    try {
      await dailyReportCreate({
        date: selectedDate,
        tasks_completed: parseInt(myReport.tasks_completed) || 0,
        tasks_pending: parseInt(myReport.tasks_pending) || 0,
        orders_processed: parseInt(myReport.orders_processed) || 0,
        materials_issued: parseInt(myReport.materials_issued) || 0,
        summary: myReport.summary,
        challenges: myReport.challenges,
        next_day_plan: myReport.next_day_plan,
        is_submitted: true,
      });
      toast({
        title: "Report Submitted",
        description: "Your daily report has been saved.",
      });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to submit report" });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCloseBooks = async () => {
    if (
      !confirm(
        `Are you sure you want to close books for ${selectedDate}? This action cannot be undone.`
      )
    ) {
      return;
    }
    setClosingBooks(true);
    try {
      await dailyBookCloseCreate({ date: selectedDate });
      toast({
        title: "Books Closed",
        description: `Books for ${selectedDate} have been closed.`,
      });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to close books" });
    } finally {
      setClosingBooks(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Reports Dashboard</h1>
          <p className="text-muted-foreground">
            View and manage daily reports and book closing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          {bookStatus && !bookStatus.is_closed && (
            <Button
              onClick={handleCloseBooks}
              disabled={closingBooks}
              variant="destructive"
            >
              <Lock className="h-4 w-4 mr-2" />
              {closingBooks ? "Closing..." : "Close Books"}
            </Button>
          )}
        </div>
      </div>

      {/* Book Status Banner */}
      {bookStatus?.is_closed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">
              Books Closed for {selectedDate}
            </p>
            <p className="text-sm text-red-600">
              Closed by {bookStatus.closed_by} at {bookStatus.closed_at}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {dashboard && (
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Reports Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.submitted_reports} /{" "}
                {dashboard.total_users_with_reports}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.pending_reports} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.total_tasks_completed}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.total_tasks_pending} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Orders Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.total_orders_processed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materials Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.total_materials_issued}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit My Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit My Daily Report
            </CardTitle>
            <CardDescription>
              Fill in your daily activities for {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tasks Completed</Label>
                  <Input
                    type="number"
                    min="0"
                    value={myReport.tasks_completed}
                    onChange={(e) =>
                      setMyReport((r) => ({
                        ...r,
                        tasks_completed: e.target.value,
                      }))
                    }
                    disabled={bookStatus?.is_closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasks Pending</Label>
                  <Input
                    type="number"
                    min="0"
                    value={myReport.tasks_pending}
                    onChange={(e) =>
                      setMyReport((r) => ({
                        ...r,
                        tasks_pending: e.target.value,
                      }))
                    }
                    disabled={bookStatus?.is_closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orders Processed</Label>
                  <Input
                    type="number"
                    min="0"
                    value={myReport.orders_processed}
                    onChange={(e) =>
                      setMyReport((r) => ({
                        ...r,
                        orders_processed: e.target.value,
                      }))
                    }
                    disabled={bookStatus?.is_closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Materials Issued</Label>
                  <Input
                    type="number"
                    min="0"
                    value={myReport.materials_issued}
                    onChange={(e) =>
                      setMyReport((r) => ({
                        ...r,
                        materials_issued: e.target.value,
                      }))
                    }
                    disabled={bookStatus?.is_closed}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Brief summary of today's work..."
                  value={myReport.summary}
                  onChange={(e) =>
                    setMyReport((r) => ({ ...r, summary: e.target.value }))
                  }
                  disabled={bookStatus?.is_closed}
                />
              </div>
              <div className="space-y-2">
                <Label>Challenges Faced</Label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder="Any challenges or blockers..."
                  value={myReport.challenges}
                  onChange={(e) =>
                    setMyReport((r) => ({ ...r, challenges: e.target.value }))
                  }
                  disabled={bookStatus?.is_closed}
                />
              </div>
              <div className="space-y-2">
                <Label>Plan for Tomorrow</Label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder="What you plan to work on tomorrow..."
                  value={myReport.next_day_plan}
                  onChange={(e) =>
                    setMyReport((r) => ({
                      ...r,
                      next_day_plan: e.target.value,
                    }))
                  }
                  disabled={bookStatus?.is_closed}
                />
              </div>
              <Button
                onClick={handleSubmitReport}
                disabled={submittingReport || bookStatus?.is_closed}
                className="w-full"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Reports
            </CardTitle>
            <CardDescription>
              Reports submitted by team members for {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No reports submitted yet.
              </p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{report.user_name}</p>
                      {report.is_submitted ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Submitted
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs">Tasks Done</span>
                        <span className="font-medium text-foreground">
                          {report.tasks_completed}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs">Pending</span>
                        <span className="font-medium text-foreground">
                          {report.tasks_pending}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs">Orders</span>
                        <span className="font-medium text-foreground">
                          {report.orders_processed}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs">Materials</span>
                        <span className="font-medium text-foreground">
                          {report.materials_issued}
                        </span>
                      </div>
                    </div>
                    {report.summary && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {report.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
