"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  goldCaratsList,
  goldCaratCreate,
  goldCaratUpdate,
  goldCaratDelete,
  type GoldCarat,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Gem, Plus, Pencil, Trash2 } from "lucide-react";

export default function GoldCaratsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<GoldCarat[]>([]);
  const [filteredItems, setFilteredItems] = useState<GoldCarat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GoldCarat | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    is_standard: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await goldCaratsList();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load gold carats",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const handleCreate = () => {
    setFormData({ name: "", value: "", is_standard: false });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (item: GoldCarat) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      value: String(item.value),
      is_standard: item.is_standard,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: GoldCarat) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.name.trim() || !formData.value) {
      toast({
        variant: "destructive",
        title: "Name and Value are required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await goldCaratCreate({
        name: formData.name.trim(),
        value: parseInt(formData.value, 10),
        is_standard: formData.is_standard,
      });
      toast({
        title: "Gold carat created successfully",
      });
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create gold carat",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedItem || !formData.name.trim() || !formData.value) {
      toast({
        variant: "destructive",
        title: "Name and Value are required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await goldCaratUpdate(selectedItem.id, {
        name: formData.name.trim(),
        value: parseInt(formData.value, 10),
        is_standard: formData.is_standard,
      });
      toast({
        title: "Gold carat updated successfully",
      });
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update gold carat",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await goldCaratDelete(selectedItem.id);
      toast({
        title: "Gold carat deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete gold carat",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/masters-hub/item-master")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gold Carats Management</h1>
            <p className="text-muted-foreground">
              Standard and custom gold carat values
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-amber-600" />
            <span className="text-2xl font-bold">{items.length}</span>
            <span className="text-muted-foreground">carats</span>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search gold carats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>All Gold Carats ({filteredItems.length})</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Showing ${filteredItems.length} of ${items.length} carats`
              : "Complete list of gold carat values"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery
                ? "No items found matching your search"
                : "No gold carats found"}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border bg-amber-50/50 px-4 py-3 hover:bg-amber-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Value: {item.value}
                      {item.is_standard && " • Standard"}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/masters-hub/item-master")}
        >
          Back to Overview
        </Button>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Gold Carat</DialogTitle>
            <DialogDescription>Create a new gold carat value</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., 24K, 22K, 18K"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-value">Value *</Label>
              <Input
                id="create-value"
                type="number"
                placeholder="e.g., 24, 22, 18"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-standard"
                checked={formData.is_standard}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_standard: checked as boolean })
                }
              />
              <Label htmlFor="create-standard">
                Is Standard (Industry Standard)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gold Carat</DialogTitle>
            <DialogDescription>Update the gold carat value</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., 24K, 22K, 18K"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value *</Label>
              <Input
                id="edit-value"
                type="number"
                placeholder="e.g., 24, 22, 18"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-standard"
                checked={formData.is_standard}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_standard: checked as boolean })
                }
              />
              <Label htmlFor="edit-standard">
                Is Standard (Industry Standard)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the gold carat &quot;
              {selectedItem?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
