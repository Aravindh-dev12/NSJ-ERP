"use client";

import { useEffect, useState, useCallback } from "react";
import { acGroupMastersList, type ACGroupMaster } from "@/lib/backend";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import Link from "next/link";

export function ACGroupMastersList() {
  const [groups, setGroups] = useState<ACGroupMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await acGroupMastersList();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load AC Group Masters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = groups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.tally_parent_group?.toLowerCase().includes(q) ||
      g.financial_statement?.toLowerCase().includes(q) ||
      g.universal_nature?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Spark Account Groups</CardTitle>
            <CardDescription>
              All configured A/C groups with their Tally mapping and
              classification fields.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, tally group, statement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} group{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No account groups found.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    Spark Account Group
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Tally Parent Group
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Financial Statement
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Universal Nature
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Normal Balance
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.tally_parent_group || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.financial_statement === "Balance Sheet"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {group.financial_statement}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.universal_nature === "Asset"
                            ? "bg-emerald-100 text-emerald-800"
                            : group.universal_nature === "Liability"
                              ? "bg-red-100 text-red-800"
                              : group.universal_nature === "Income"
                                ? "bg-green-100 text-green-800"
                                : group.universal_nature === "Expense"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {group.universal_nature}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.normal_balance === "Dr"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {group.normal_balance}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          group.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {group.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
