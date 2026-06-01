"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  itemNamesList,
  goldCaratsList,
  metalTypesList,
  metalColorsList,
  itemGroupsList,
  masterRequestPending,
  type MasterDataItem,
  type GoldCarat,
  type MetalType,
  type MetalColor,
  type ItemGroup,
  type MasterDataRequest,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Package,
  Gem,
  Palette,
  Bell,
  ChevronRight,
  FolderTree,
} from "lucide-react";

export default function MastersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [itemNames, setItemNames] = useState<MasterDataItem[]>([]);
  const [goldCarats, setGoldCarats] = useState<GoldCarat[]>([]);
  const [metalTypes, setMetalTypes] = useState<MetalType[]>([]);
  const [metalColors, setMetalColors] = useState<MetalColor[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MasterDataRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, carats, types, colors, groups, pending] = await Promise.all(
        [
          itemNamesList(),
          goldCaratsList(),
          metalTypesList(),
          metalColorsList(),
          itemGroupsList(),
          masterRequestPending(),
        ]
      );

      setItemNames(items);
      setGoldCarats(carats);
      setMetalTypes(types);
      setMetalColors(colors);
      setItemGroups(groups);
      setPendingRequests(pending);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load master data",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const masterCategories = [
    {
      title: "Item Names",
      description: "Jewelry types and product categories",
      icon: Package,
      count: itemNames.length,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      route: "/masters-hub/item-master/item-names",
    },
    {
      title: "Gold Carats",
      description: "Standard and custom gold carat values",
      icon: Gem,
      count: goldCarats.length,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      route: "/masters-hub/item-master/gold-carats",
    },
    {
      title: "Metal Types",
      description: "Available metal types",
      icon: Database,
      count: metalTypes.length,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      route: "/masters-hub/item-master/metal-types",
    },
    {
      title: "Metal Colors",
      description: "Metal color variations",
      icon: Palette,
      count: metalColors.length,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      route: "/masters-hub/item-master/metal-colors",
    },
    {
      title: "Item Groups",
      description: "Product category groups",
      icon: FolderTree,
      count: itemGroups.length,
      color: "text-green-600",
      bgColor: "bg-green-50",
      route: "/masters-hub/item-master/item-groups",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Item Master</h1>
          <p className="text-muted-foreground">
            Manage jewelry items, metals, and product categories
          </p>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-amber-900">
                    Pending Requests
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    {pendingRequests.length} request
                    {pendingRequests.length !== 1 ? "s" : ""} waiting for
                    approval
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => router.push("/masters-hub/item-master/requests")}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Review Requests
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Master Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {masterCategories.map((category) => (
          <Card
            key={category.title}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(category.route)}
          >
            <CardHeader>
              <div className={`rounded-lg ${category.bgColor} p-3 w-fit mb-3`}>
                <category.icon className={`h-6 w-6 ${category.color}`} />
              </div>
              <CardTitle className="text-lg">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{category.count}</p>
                  <p className="text-sm text-muted-foreground">Total items</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Item Master Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {itemNames.length +
                goldCarats.length +
                metalTypes.length +
                metalColors.length +
                itemGroups.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {pendingRequests.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Popular Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">Item Names</p>
            <p className="text-sm text-muted-foreground">
              {itemNames.length} items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Item Names Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Item Names Preview</CardTitle>
              <CardDescription>
                First 10 jewelry types (alphabetically sorted)
              </CardDescription>
            </div>
            <Badge variant="outline">{itemNames.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : Array.isArray(itemNames) && itemNames.length > 0 ? (
            <>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
                {itemNames.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
              {itemNames.length > 10 && (
                <p className="text-sm text-muted-foreground mt-4">
                  + {itemNames.length - 10} more items
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No item names found</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/masters-hub/item-master/requests")}
        >
          View All Requests
        </Button>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
    </div>
  );
}
