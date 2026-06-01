"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Shield, ArrowRight } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
  task_role: string;
  task_role_display: string;
  department: string | null;
  department_display: string | null;
}

const roleColors: Record<string, string> = {
  FOUNDER: "bg-purple-200 text-purple-800",
  DEPT_HEAD: "bg-blue-200 text-blue-800",
  SUB_DEPT_HEAD: "bg-green-200 text-green-800",
  INDIVIDUAL: "bg-gray-200 text-gray-800",
};

const roleDescriptions: Record<string, string> = {
  FOUNDER: "Global view - Can see all tasks across the organization",
  DEPT_HEAD: "Department view - Can see all tasks in their department",
  SUB_DEPT_HEAD: "Sub-department view - Can see tasks in their sub-department",
  INDIVIDUAL: "Personal view - Can only see their own tasks",
};

export default function SwitchUserPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Check if user has access to this page
    const checkAccess = () => {
      const accessToken = localStorage.getItem("accessToken");
      const simulatedUserName = localStorage.getItem("currentTaskUserName");

      // If logged in with real auth, deny access (this is dev-only)
      if (accessToken) {
        setAccessDenied(true);
        return false;
      }

      // If simulated as a non-dev user, deny access
      if (
        simulatedUserName &&
        simulatedUserName !== "Admin1" &&
        simulatedUserName !== "Aryan"
      ) {
        setAccessDenied(true);
        return false;
      }

      return true;
    };

    if (checkAccess()) {
      fetchUsers();
      const savedUser = localStorage.getItem("currentTaskUser");
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users for switching (development only)
      const response = await fetch(`${API_BASE_URL}/tasks/users/`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Enhance with role info - we'll need to fetch this separately
        const usersWithRoles = await Promise.all(
          data.map(
            async (user: { id: string; name: string; email: string }) => {
              // For now, map known users to their roles
              const roleMap: Record<
                string,
                { task_role: string; department: string | null }
              > = {
                Niti: { task_role: "FOUNDER", department: "FOUNDER" },
                Mehul: { task_role: "DEPT_HEAD", department: "ACCOUNTS" },
                "Jinu Bhai": {
                  task_role: "DEPT_HEAD",
                  department: "RAW_MATERIAL_INVENTORY",
                },
                Sandhya: {
                  task_role: "DEPT_HEAD",
                  department: "ADMINISTRATION",
                },
                Sanjana: { task_role: "DEPT_HEAD", department: "PRODUCTION" },
                "Pradip Bhai": {
                  task_role: "DEPT_HEAD",
                  department: "LOGISTICS",
                },
              };

              const roleInfo = roleMap[user.name] || {
                task_role: "INDIVIDUAL",
                department: null,
              };
              const roleDisplayMap: Record<string, string> = {
                FOUNDER: "Founder",
                DEPT_HEAD: "Department Head",
                SUB_DEPT_HEAD: "Sub-Department Head",
                INDIVIDUAL: "Individual Contributor",
              };
              const deptDisplayMap: Record<string, string> = {
                FOUNDER: "Founder",
                ACCOUNTS: "Accounts",
                RAW_MATERIAL_INVENTORY: "Raw Material Inventory",
                ADMINISTRATION: "Administration",
                PRODUCTION: "Production",
                LOGISTICS: "Logistics",
              };

              return {
                ...user,
                task_role: roleInfo.task_role,
                task_role_display:
                  roleDisplayMap[roleInfo.task_role] || roleInfo.task_role,
                department: roleInfo.department,
                department_display: roleInfo.department
                  ? deptDisplayMap[roleInfo.department] || roleInfo.department
                  : null,
              };
            }
          )
        );
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: UserOption) => {
    // Save selected user to localStorage for simulation
    localStorage.setItem("currentTaskUser", user.id);
    localStorage.setItem("currentTaskUserName", user.name);
    localStorage.setItem("currentTaskUserRole", user.task_role);
    setCurrentUser(user.id);

    // Redirect to dashboard
    router.push("/tasks/dashboard");
  };

  const clearUser = () => {
    localStorage.removeItem("currentTaskUser");
    localStorage.removeItem("currentTaskUserName");
    localStorage.removeItem("currentTaskUserRole");
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading users...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-8 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
            <h2 className="mb-2 text-xl font-bold">Development Feature</h2>
            <p className="mb-4 text-muted-foreground">
              The Switch User feature is only available for development testing.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Please use the login page to sign in with your credentials.
            </p>
            <Button onClick={() => router.push("/tasks/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Switch User (Development)</h1>
        <p className="text-muted-foreground">
          Select a user to view the task dashboard from their perspective. This
          simulates role-based access control.
        </p>
      </div>

      {currentUser && (
        <Card className="mb-6 border-blue-300 bg-blue-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Currently viewing as:</p>
              <p className="text-muted-foreground">
                {localStorage.getItem("currentTaskUserName")} (
                {localStorage.getItem("currentTaskUserRole")})
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearUser}>
                Clear Selection
              </Button>
              <Button onClick={() => router.push("/tasks/dashboard")}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Role Hierarchy</h2>
        <div className="mt-2 grid gap-2 text-sm">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className="flex items-center gap-2">
              <Badge className={roleColors[role]}>
                {role.replace("_", " ")}
              </Badge>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => (
          <Card
            key={user.id}
            className={`cursor-pointer transition-all hover:border-blue-400 hover:shadow-md ${
              currentUser === user.id ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => selectUser(user)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                </div>
                <Badge className={roleColors[user.task_role]}>
                  {user.task_role_display}
                </Badge>
              </div>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{user.department_display || "No Department"}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{roleDescriptions[user.task_role]}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/tasks")}>
          Back to Tasks
        </Button>
      </div>
    </div>
  );
}
