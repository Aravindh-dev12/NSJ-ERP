"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  itemGroupsList,
  itemGroupCreate,
  itemGroupUpdate,
  itemGroupDelete,
  type ItemGroup,
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
import { useToast } from "@/hooks/use-toast";
import { Search, FolderTree, Plus, Pencil, Trash2 } from "lucide-react";

export default function ItemGroupsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<ItemGroup[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemGroup | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await itemGroupsList();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load item groups",
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
    setFormData({ name: "" });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (item: ItemGroup) => {
    setSelectedItem(item);
    setFormData({ name: item.name });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: ItemGroup) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name is required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await itemGroupCreate({
        name: formData.name.trim(),
      });
      toast({
        title: "Item group created successfully",
      });
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create item group",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedItem || !formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name is required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await itemGroupUpdate(selectedItem.id, {
        name: formData.name.trim(),
      });
      toast({
        title: "Item group updated successfully",
      });
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update item group",
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
      await itemGroupDelete(selectedItem.id);
      toast({
        title: "Item group deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete item group",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Item Groups Management</h1>
          <p className="text-muted-foreground">Product category groups</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold">{items.length}</span>
            <span className="text-muted-foreground">groups</span>
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
              placeholder="Search item groups..."
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
          <CardTitle>All Item Groups ({filteredItems.length})</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Showing ${filteredItems.length} of ${items.length} groups`
              : "Complete list of product category groups"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery
                ? "No items found matching your search"
                : "No item groups found"}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{item.name}</span>
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
        <Button variant="outline" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item Group</DialogTitle>
            <DialogDescription>
              Create a new product category group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Karigar Group, Finished Goods"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={100}
              />
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
            <DialogTitle>Edit Item Group</DialogTitle>
            <DialogDescription>
              Update the product category group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Karigar Group, Finished Goods"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={100}
              />
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
              This will permanently delete the item group &quot;
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
