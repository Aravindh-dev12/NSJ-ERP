"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  usersList,
  userCreate,
  userUpdate,
  userDelete,
  type ManagedUser,
  type ManagedUserPayload,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Users,
  Shield,
  Download,
  X,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";

const DEPARTMENT_CHOICES = [
  { value: "PRODUCT_DESIGN", label: "Product Design" },
  { value: "SALES", label: "Sales" },
  { value: "SOURCING", label: "Sourcing" },
  { value: "FOUNDER", label: "Founder" },
  { value: "ACCOUNTS", label: "Accounts" },
  { value: "RAW_MATERIAL_INVENTORY", label: "Raw Material Inventory" },
  { value: "ADMINISTRATION", label: "Administration" },
  { value: "PRODUCTION", label: "Production" },
  { value: "PRODUCT_INVENTORY", label: "Product Inventory" },
  { value: "LOGISTICS", label: "Logistics" },
];

const ROLE_CHOICES = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "ADMIN", label: "Admin" },
];

const EMPTY_FORM: ManagedUserPayload & {
  role: string;
  firstName: string;
  lastName: string;
} = {
  name: "",
  email: "",
  password: "",
  department: "",
  role: "EMPLOYEE",
  is_active: true,
  firstName: "",
  lastName: "",
};

function deptLabel(val: string) {
  return DEPARTMENT_CHOICES.find((d) => d.value === val)?.label ?? val;
}

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterDept, setFilterDept] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const role = (user as any)?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersList();
      setUsers(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  // Apply all filters client-side
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !(u.department || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (filterStatus === "active" && !u.is_active) return false;
      if (filterStatus === "inactive" && u.is_active) return false;
      if (filterDept && u.department !== filterDept) return false;
      if (filterDateFrom && u.created_at < filterDateFrom) return false;
      if (filterDateTo && u.created_at.slice(0, 10) > filterDateTo)
        return false;
      return true;
    });
  }, [users, search, filterStatus, filterDept, filterDateFrom, filterDateTo]);

  const hasFilters =
    search ||
    filterStatus !== "all" ||
    filterDept ||
    filterDateFrom ||
    filterDateTo;

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterDept("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterDept, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Export CSV
  const handleExport = () => {
    const rows = [
      [
        "Name",
        "Email",
        "Password",
        "Department",
        "Role",
        "Status",
        "Created At",
      ],
      ...filtered.map((u) => [
        u.name,
        u.email,
        u.plain_password || "",
        deptLabel(u.department),
        u.role,
        u.is_active ? "Active" : "Inactive",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${filtered.length} users exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    const nameParts = u.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    setFormData({
      name: u.name,
      email: u.email,
      password: u.plain_password || "",
      department: u.department || "",
      role: u.role,
      is_active: u.is_active,
      firstName,
      lastName,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = "First name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "Enter a valid email address";
    if (!editingUser && !formData.password?.trim())
      errs.password = "Password is required for new users";
    if (formData.password?.trim() && formData.password.trim().length < 8)
      errs.password = "Password must be at least 8 characters";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const fullName =
        `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      if (editingUser) {
        const payload: Partial<ManagedUserPayload> = {
          name: fullName,
          email: formData.email.trim(),
          department: formData.department,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password?.trim())
          payload.password = formData.password.trim();
        await userUpdate(editingUser.id, payload);
        toast({ title: "User updated successfully" });
      } else {
        await userCreate({
          ...formData,
          name: fullName,
          email: formData.email.trim(),
        });
        toast({
          title: "User created",
          description: `${fullName} can now log in.`,
        });
      }
      setIsFormOpen(false);
      load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: editingUser ? "Failed to update user" : "Failed to create user",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: ManagedUser) => {
    try {
      await userUpdate(u.id, { is_active: !u.is_active });
      toast({
        title: u.is_active ? `${u.name} deactivated` : `${u.name} activated`,
      });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await userDelete(deletingUser.id);
      toast({ title: "User deleted" });
      setIsDeleteOpen(false);
      setDeletingUser(null);
      load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  if (!isAdmin) return null;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage user accounts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="bg-white rounded-xl border p-4 text-center cursor-pointer hover:border-indigo-300 transition"
          onClick={() => setFilterStatus("all")}
        >
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">
            Total Users
          </p>
        </div>
        <div
          className="bg-white rounded-xl border p-4 text-center cursor-pointer hover:border-green-300 transition"
          onClick={() => setFilterStatus("active")}
        >
          <p className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.is_active).length}
          </p>
          <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">
            Active
          </p>
        </div>
        <div
          className="bg-white rounded-xl border p-4 text-center cursor-pointer hover:border-red-300 transition"
          onClick={() => setFilterStatus("inactive")}
        >
          <p className="text-2xl font-bold text-red-500">
            {users.filter((u) => !u.is_active).length}
          </p>
          <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">
            Inactive
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-700 normal-case font-semibold"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        {/* Row 1: Search + Status + Department */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENT_CHOICES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Date range */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Created:</span>
          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="h-9 w-40 text-sm"
          />
          <span className="text-gray-400 text-sm">to</span>
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="h-9 w-40 text-sm"
          />
        </div>

        {hasFilters && (
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-800">{filtered.length}</span>{" "}
            of <span className="font-bold">{users.length}</span> users
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
          {hasFilters ? (
            <div>
              <p>No users match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-indigo-600 text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            'No users found. Click "Add User" to create one.'
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Department
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-700">
                  Created
                </th>
                <th className="px-5 py-3 text-center font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-5 py-3 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-gray-50 transition ${!u.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {deptLabel(u.department) || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={
                        u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                          ? "text-indigo-700 border-indigo-200 bg-indigo-50"
                          : ""
                      }
                    >
                      {u.role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : u.role === "ADMIN"
                          ? "Admin"
                          : "Employee"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge
                      className={
                        u.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(u)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                        title={u.is_active ? "Deactivate" : "Activate"}
                        className={
                          u.is_active
                            ? "text-amber-600 hover:text-amber-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {u.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingUser(u);
                          setIsDeleteOpen(true);
                        }}
                        title="Delete"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border px-5 py-3">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {filtered.length}
            </span>{" "}
            users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 py-1 text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${page === p ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* Colored header */}
          <div className="bg-indigo-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold m-0">
                  {editingUser ? "Edit User" : "Create New User"}
                </DialogTitle>
                <DialogDescription className="text-indigo-200 text-sm mt-0.5">
                  {editingUser
                    ? "Update the user's details below."
                    : "Fill in the details to create a new user account."}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 py-5 space-y-4">
            {/* First Name + Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    setFormErrors((p) => ({ ...p, firstName: "" }));
                  }}
                  placeholder="Rahul"
                  className={`h-10 ${formErrors.firstName ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {formErrors.firstName && (
                  <p className="text-xs text-red-500">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Last Name
                </Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                  }}
                  placeholder="Sharma"
                  className="h-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setFormErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="rahul@example.com"
                className={`h-10 ${formErrors.email ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password{" "}
                {!editingUser && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setFormErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder={
                    editingUser && !formData.password
                      ? "Enter new password to set"
                      : editingUser
                        ? ""
                        : "Minimum 8 characters"
                  }
                  className={`h-10 pr-10 ${formErrors.password ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500">{formErrors.password}</p>
              )}
              {editingUser && !formData.password && (
                <p className="text-xs text-gray-400">
                  Leave blank to keep current password, or enter a new one to
                  change it
                </p>
              )}
            </div>

            {/* Department + Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Department
                </Label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select department</option>
                  {DEPARTMENT_CHOICES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </Label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ROLE_CHOICES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active toggle — edit mode only */}
            {editingUser && (
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${formData.is_active ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Account Status
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.is_active
                      ? "User can log in to the system"
                      : "User cannot log in"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, is_active: !formData.is_active })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
            >
              {submitting
                ? editingUser
                  ? "Saving..."
                  : "Creating..."
                : editingUser
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{deletingUser?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user. Consider deactivating instead —
              deactivated users can no longer log in but their history is
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
