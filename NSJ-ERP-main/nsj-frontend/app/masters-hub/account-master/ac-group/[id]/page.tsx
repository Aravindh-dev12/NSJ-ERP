"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acGroupMastersList, type ACGroupMaster } from "@/lib/backend";
import {
  ArrowLeft,
  Layers,
  BookOpen,
  Scale,
  Tag,
  CheckCircle,
  AlertCircle,
  FileText,
  Hash,
} from "lucide-react";

const UNIVERSAL_NATURE_COLORS: Record<string, string> = {
  Asset: "bg-emerald-100 text-emerald-800",
  Liability: "bg-red-100 text-red-800",
  Income: "bg-green-100 text-green-800",
  Expense: "bg-orange-100 text-orange-800",
  Capital: "bg-purple-100 text-purple-800",
};

const FINANCIAL_STATEMENT_COLORS: Record<string, string> = {
  "Balance Sheet": "bg-blue-100 text-blue-800",
  "Profit & Loss": "bg-green-100 text-green-800",
};

const NORMAL_BALANCE_COLORS: Record<string, string> = {
  Dr: "bg-amber-100 text-amber-800",
  Cr: "bg-indigo-100 text-indigo-800",
};

export default function ACGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ACGroupMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      setError(null);
      try {
        const groups = await acGroupMastersList();
        const found = groups.find((g) => g.id === groupId);
        if (!found) {
          setError("A/C Group not found.");
        } else {
          setGroup(found);
        }
      } catch (err) {
        console.error("Failed to load A/C Group:", err);
        setError("Failed to load A/C Group details.");
      } finally {
        setLoading(false);
      }
    };

    void loadGroup();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {error || "A/C Group not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tally Parent Group: {group.tally_parent_group || "—"}
              </p>
            </div>
            <Badge
              className={
                group.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {group.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Group Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Spark Account Group
                </p>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{group.name}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Tally Parent Group
                </p>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">
                    {group.tally_parent_group || "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Financial Statement
                </p>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <Badge
                    className={
                      FINANCIAL_STATEMENT_COLORS[group.financial_statement] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {group.financial_statement}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Universal Nature
                </p>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <Badge
                    className={
                      UNIVERSAL_NATURE_COLORS[group.universal_nature] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {group.universal_nature}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Normal Balance</p>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gray-400" />
                  <Badge
                    className={
                      NORMAL_BALANCE_COLORS[group.normal_balance] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {group.normal_balance}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Use in Spark</p>
                <div className="flex items-center gap-2">
                  {group.use_in_spark === "YES" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <p className="font-medium">{group.use_in_spark}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Information */}
          {(group.ledger_examples || group.export_rule) && (
            <section className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Additional Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {group.ledger_examples && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Ledger Examples
                    </p>
                    <p className="font-medium">{group.ledger_examples}</p>
                  </div>
                )}
                {group.export_rule && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Export Rule</p>
                    <p className="font-medium">{group.export_rule}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section className="space-y-3 pt-4 border-t">
            <div className="grid gap-4 md:grid-cols-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3" />
                <p>ID: {group.id}</p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
