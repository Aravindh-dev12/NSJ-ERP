"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Building2 } from "lucide-react";
import {
  departmentsMyDepartments,
  departmentsSetActive,
  departmentsCurrentActive,
  type Department,
} from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

export function DepartmentSwitcher() {
  const router = useRouter();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const [myDepts, currentActive] = await Promise.all([
        departmentsMyDepartments(),
        departmentsCurrentActive(),
      ]);

      setDepartments(myDepts);
      setActiveDepartment(currentActive);
    } catch (error: any) {
      console.error("Failed to load departments:", error);
      // If 404, user has no departments - this is expected, don't show error
      // The component will just not render
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSwitch = async (department: Department) => {
    if (switching || department.id === activeDepartment?.id) return;

    setSwitching(true);
    try {
      await departmentsSetActive(department.id);
      setActiveDepartment(department);

      toast({
        title: "Department Switched",
        description: `Now viewing ${department.name} dashboard`,
      });

      // Emit custom event for other components to listen
      window.dispatchEvent(
        new CustomEvent("departmentChanged", {
          detail: { departmentId: department.id, department },
        })
      );

      // Reload the page to refresh dashboard with new department data
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to switch department",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (loading) return null;

  // If user has no departments, don't show switcher
  if (departments.length === 0) return null;

  // If user has only one department, show it without dropdown
  if (departments.length === 1) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{activeDepartment?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={switching}>
          <Building2 className="h-4 w-4" />
          <span>{activeDepartment?.name || "Select Department"}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Switch Department View
        </div>
        {departments.map((dept) => (
          <DropdownMenuItem
            key={dept.id}
            onClick={() => handleDepartmentSwitch(dept)}
            className={activeDepartment?.id === dept.id ? "bg-accent" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{dept.name}</span>
              {dept.description && (
                <span className="text-xs text-muted-foreground">
                  {dept.description}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
