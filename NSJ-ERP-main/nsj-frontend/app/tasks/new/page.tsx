"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { emitTaskEvent, TASK_EVENTS } from "@/lib/taskEvents";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Company Structure - Departments, Sub-Departments, and People
const COMPANY_STRUCTURE: Record<
  string,
  {
    name: string;
    head: string;
    subDepartments: Record<string, { name: string; people: string[] }>;
    people: string[];
  }
> = {
  PRODUCT_DESIGN: {
    name: "Product Design",
    head: "Niti",
    subDepartments: {
      "2D_DESIGN": { name: "2D Design", people: ["Niti"] },
      R_AND_D: { name: "R&D", people: ["Niti"] },
    },
    people: ["Niti"],
  },
  SALES: {
    name: "Sales",
    head: "Niti",
    subDepartments: {
      CLIENT_SERVICING: { name: "Client Servicing", people: ["Niti"] },
      CATALOGUE: { name: "Catalogue", people: ["Niti"] },
    },
    people: ["Niti"],
  },
  SOURCING: {
    name: "Sourcing",
    head: "Niti",
    subDepartments: {
      DIAMOND_SOURCING: { name: "Diamond Sourcing", people: ["Niti"] },
      GOLD_SOURCING: { name: "Gold Sourcing", people: ["Niti"] },
      GEMSTONE_SOURCING: { name: "Gemstone Sourcing", people: ["Niti"] },
    },
    people: ["Niti"],
  },
  FOUNDER: {
    name: "Founder",
    head: "Niti",
    subDepartments: {
      STRATEGY: { name: "Strategy", people: ["Niti"] },
      OPERATIONS: { name: "Operations", people: ["Niti"] },
      INTEGRATION: { name: "Integration", people: ["Niti"] },
      TECH_INFRA: { name: "Tech Infra", people: ["Niti"] },
      HIRING: { name: "Hiring", people: ["Niti"] },
      LEGAL: { name: "Legal", people: ["Niti"] },
      BRANDING_PR: { name: "Branding & PR", people: ["Niti"] },
      GRAPHIC_DESIGN: { name: "Graphic Design", people: ["Niti"] },
      BUSINESS_DEVELOPMENT: { name: "Business Development", people: ["Niti"] },
      OFFLINE_MARKETING: { name: "Offline Marketing", people: ["Niti"] },
    },
    people: ["Niti"],
  },
  ACCOUNTS: {
    name: "Accounts",
    head: "Mehul",
    subDepartments: {
      BILLING: { name: "Billing", people: ["Mehul"] },
      GST: { name: "GST", people: ["Mehul"] },
      BOOKKEEPING: { name: "Bookkeeping", people: ["Mehul"] },
      CASH_BOOKS: { name: "Cash Books", people: ["Mehul"] },
    },
    people: ["Mehul"],
  },
  RAW_MATERIAL_INVENTORY: {
    name: "Raw Material Inventory",
    head: "Jinu Bhai",
    subDepartments: {
      DIAMOND_BOOKS: { name: "Diamond Books", people: ["Jinu Bhai"] },
      GOLD_BOOKS: { name: "Gold Books", people: ["Jinu Bhai"] },
      DAILY_IN_OUT: { name: "Daily In Out", people: ["Jinu Bhai"] },
      BAGGING: { name: "Bagging", people: ["Jinu Bhai"] },
    },
    people: ["Jinu Bhai"],
  },
  ADMINISTRATION: {
    name: "Administration",
    head: "Sandhya",
    subDepartments: {
      ERP: { name: "ERP", people: ["Sandhya"] },
      PHYSICAL_STOCK_KEEPING: {
        name: "Physical Stock Keeping",
        people: ["Sandhya"],
      },
    },
    people: ["Sandhya"],
  },
  PRODUCTION: {
    name: "Production",
    head: "Sanjana",
    subDepartments: {
      VENDOR_HANDLING: { name: "Vendor Handling", people: ["Sanjana"] },
      REPAIRS: { name: "Repairs", people: ["Sanjana"] },
      STOCK_JEWELLERY: { name: "Stock Jewellery", people: ["Sanjana"] },
      CUSTOM_JEWELLERY: { name: "Custom Jewellery", people: ["Sanjana"] },
    },
    people: ["Sanjana"],
  },
  PRODUCT_INVENTORY: {
    name: "Product Inventory",
    head: "Sanjana",
    subDepartments: {},
    people: ["Sanjana"],
  },
  LOGISTICS: {
    name: "Logistics",
    head: "Pradip Bhai",
    subDepartments: {
      LOCAL: { name: "Local", people: ["Pradip Bhai"] },
      SHIPPING: { name: "Shipping", people: ["Pradip Bhai"] },
    },
    people: ["Pradip Bhai"],
  },
};

// Generate departments list from structure
const DEPARTMENTS = Object.entries(COMPANY_STRUCTURE).map(([value, data]) => ({
  value,
  label: data.name,
}));

// All people in the company with IDs
const ALL_PEOPLE = [
  { id: "1", name: "Niti" },
  { id: "2", name: "Mehul" },
  { id: "3", name: "Jinu Bhai" },
  { id: "4", name: "Sandhya" },
  { id: "5", name: "Sanjana" },
  { id: "6", name: "Pradip Bhai" },
];

const URGENCY_LEVELS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    urgency: "MEDIUM",
    department: "",
    sub_department: "",
    assignees: [] as string[], // Array of user IDs
    assigned_to: "", // For backward compatibility (will take first selection)
    output_medium: "",
    requires_completion_proof: false,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tasks/current_user_info/`,
          {
            headers: { Accept: "application/json" },
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.is_authenticated);
          // If authenticated, clear any simulated user from localStorage
          if (data.is_authenticated) {
            localStorage.removeItem("currentTaskUser");
            localStorage.removeItem("currentTaskUserName");
            localStorage.removeItem("currentTaskUserRole");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  // Get available sub-departments based on selected department
  const availableSubDepartments = useMemo(() => {
    if (!formData.department) return [];
    const dept = COMPANY_STRUCTURE[formData.department];
    if (!dept) return [];
    return Object.entries(dept.subDepartments).map(([value, data]) => ({
      value,
      label: data.name,
    }));
  }, [formData.department]);

  // Get available people based on selected department and sub-department
  const availablePeople = useMemo(() => {
    if (!formData.department) return ALL_PEOPLE;

    const dept = COMPANY_STRUCTURE[formData.department];
    if (!dept) return ALL_PEOPLE;

    let people: typeof ALL_PEOPLE = [];

    // If sub-department is selected, get people from that sub-department
    if (
      formData.sub_department &&
      dept.subDepartments[formData.sub_department]
    ) {
      const subDeptPeople = dept.subDepartments[formData.sub_department].people;
      people = ALL_PEOPLE.filter((p) => subDeptPeople.includes(p.name));
    } else {
      // Otherwise, get all people from the department
      people = ALL_PEOPLE.filter((p) => dept.people.includes(p.name));
    }

    // ALWAYS include Founder(s) in the list if not already present
    const founderNames = COMPANY_STRUCTURE.FOUNDER?.people || [];
    const founders = ALL_PEOPLE.filter((p) => founderNames.includes(p.name));

    founders.forEach((founder) => {
      if (!people.some((p) => p.id === founder.id)) {
        people = [founder, ...people];
      }
    });

    return people;
  }, [formData.department, formData.sub_department]);

  // Reset sub-department and assigned_to when department changes
  const handleDepartmentChange = (newDepartment: string) => {
    setFormData((prev) => ({
      ...prev,
      department: newDepartment,
      sub_department: "",
      assignees: [],
    }));
  };

  // Reset assigned_to when sub-department changes
  const handleSubDepartmentChange = (newSubDepartment: string) => {
    setFormData((prev) => ({
      ...prev,
      sub_department: newSubDepartment,
      assignees: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Prepare clean JSON payload
      const payload: any = {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        urgency: formData.urgency,
        department: formData.department,
      };

      if (formData.sub_department) {
        payload.sub_department = formData.sub_department;
      }

      // Send multiple assignees as actual array (not stringified)
      if (formData.assignees.length > 0) {
        payload.assignees = formData.assignees; // Clean array: ["1", "2", "3"]

        // Backward compatibility: Set 'assigned_to' to FIRST person
        const firstUserId = formData.assignees[0];
        const firstUser = availablePeople.find((u) => u.id === firstUserId);

        if (firstUserId) {
          payload.assigned_to = firstUserId;
        }
        if (firstUser) {
          payload.assigned_to_name = firstUser.name;
        }
      }

      if (formData.output_medium) {
        payload.output_medium = formData.output_medium;
      }

      if (formData.requires_completion_proof) {
        payload.requires_completion_proof = true;
      }

      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json", // Send as JSON
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Only send simulated user header if NOT authenticated
      if (!isAuthenticated) {
        const simulatedUserId = localStorage.getItem("currentTaskUser");
        if (simulatedUserId) {
          headers["X-Simulated-User-Id"] = simulatedUserId;
        }
      }

      console.log("Payload being sent:", payload);
      console.log(
        "Assignees type:",
        typeof payload.assignees,
        Array.isArray(payload.assignees)
      );
      console.log("Assigned_to type:", typeof payload.assigned_to);

      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload), // Send clean JSON
      });

      if (response.ok) {
        const createdTask = await response.json();

        // If there's an attachment, upload it separately
        if (attachment) {
          const formDataForFile = new FormData();
          formDataForFile.append("attachment", attachment);

          await fetch(
            `${API_BASE_URL}/tasks/${createdTask.id}/upload_attachment/`,
            {
              method: "PATCH",
              headers: {
                ...headers,
                "Content-Type": undefined as any, // Let browser set multipart boundary
              },
              credentials: "include",
              body: formDataForFile,
            }
          );
        }

        // Get the assigned people names for event/logging
        const assignedNames = availablePeople
          .filter((u) => formData.assignees.includes(u.id))
          .map((u) => u.name);

        // Emit event for real-time updates
        emitTaskEvent(TASK_EVENTS.TASK_CREATED, {
          taskId: createdTask.id,
          department: formData.department,
          assignedTo: assignedNames.join(", "), // Pass distinct names
        });
        toast({
          title: "Success",
          description: "Task created successfully!",
        });
        router.push("/tasks/dashboard");
      } else {
        const error = await response.json();
        console.error("Error response:", error);

        // Show user-friendly error message
        let errorMessage = "Failed to create task. ";
        if (error.assigned_to) {
          errorMessage += "Please select a valid user. ";
        }
        if (error.deadline) {
          errorMessage += error.deadline[0] || "Invalid deadline. ";
        }
        if (error.detail) {
          errorMessage += error.detail;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select
                  id="urgency"
                  value={formData.urgency}
                  onChange={(e) =>
                    setFormData({ ...formData, urgency: e.target.value })
                  }
                  required
                >
                  {URGENCY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  required
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="sub_department">Sub-Department</Label>
                <Select
                  id="sub_department"
                  value={formData.sub_department}
                  onChange={(e) => handleSubDepartmentChange(e.target.value)}
                  disabled={
                    !formData.department || availableSubDepartments.length === 0
                  }
                >
                  <option value="">
                    {!formData.department
                      ? "Select department first"
                      : availableSubDepartments.length === 0
                        ? "No sub-departments"
                        : "Select sub-department"}
                  </option>
                  {availableSubDepartments.map((subDept) => (
                    <option key={subDept.value} value={subDept.value}>
                      {subDept.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="relative">
              <Label className="mb-2 block">Assignees</Label>
              <div
                className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() =>
                  setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)
                }
              >
                <div className="flex flex-wrap gap-1">
                  {formData.assignees.length > 0 ? (
                    formData.assignees.length <= 2 ? (
                      availablePeople
                        .filter((p) => formData.assignees.includes(p.id))
                        .map((p) => p.name)
                        .join(", ")
                    ) : (
                      `${formData.assignees.length} people selected`
                    )
                  ) : (
                    <span className="text-muted-foreground">
                      Select assignees...
                    </span>
                  )}
                </div>
                {isAssigneeDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 opacity-50" />
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-50" />
                )}
              </div>

              {isAssigneeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsAssigneeDropdownOpen(false)}
                  />
                  <div className="absolute top-full z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-60 overflow-auto p-2">
                      {availablePeople.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2 text-center">
                          {formData.department
                            ? "No people found."
                            : "Select a department."}
                        </p>
                      ) : (
                        availablePeople.map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                            onClick={(e) => {
                              // Prevent closing when clicking an item
                              e.stopPropagation();
                              const isSelected = formData.assignees.includes(
                                person.id
                              );
                              setFormData((prev) => {
                                const newAssignees = !isSelected
                                  ? [...prev.assignees, person.id]
                                  : prev.assignees.filter(
                                    (id) => id !== person.id
                                  );
                                return { ...prev, assignees: newAssignees };
                              });
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`person-${person.id}`}
                              checked={formData.assignees.includes(person.id)}
                              readOnly // Managed by parent div click
                              className="h-4 w-4 rounded border-gray-300 pointer-events-none"
                            />
                            <label
                              htmlFor={`person-${person.id}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {person.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                {formData.department
                  ? `Select from ${COMPANY_STRUCTURE[formData.department]?.name || "department"}`
                  : "Select a department first"}
              </p>
            </div>

            <div>
              <Label htmlFor="output_medium">Output Medium</Label>
              <Input
                id="output_medium"
                value={formData.output_medium}
                onChange={(e) =>
                  setFormData({ ...formData, output_medium: e.target.value })
                }
                placeholder="e.g., Report, Presentation, Code"
              />
            </div>

            <div>
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <Input
                id="attachment"
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_completion_proof"
                checked={formData.requires_completion_proof}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requires_completion_proof: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label
                htmlFor="requires_completion_proof"
                className="text-sm font-normal cursor-pointer"
              >
                Require proof of completion (assignee must upload file/image
                before marking complete)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/tasks/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
