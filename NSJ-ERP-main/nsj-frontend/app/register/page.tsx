"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import { setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Please select a department"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { checkAuth } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      department: "ACCOUNTS",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.detail || "Registration failed");
      }

      if (resData.access_token) {
        setAuthToken(resData.access_token);
      }

      await checkAuth();

      toast({
        title: "Account Created",
        description: "Welcome to NSJ ERP! Redirecting to dashboard...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-white p-2 shadow-md">
              <Image
                src="/logo.png"
                alt="NSJ ERP"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="mt-3">
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                Create Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Register for NSJ Jewelry ERP System access
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Rahul Mehta"
                  {...register("name")}
                  className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rahul@nsj.com"
                  autoComplete="email"
                  {...register("email")}
                  className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 text-sm"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-semibold text-slate-700">
                  Department
                </Label>
                <select
                  id="department"
                  {...register("department")}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ACCOUNTS">Accounts & Finance</option>
                  <option value="SALES">Sales / Customer Queries</option>
                  <option value="PRODUCTION">Production & Manufacturing</option>
                  <option value="RAW_MATERIAL">Raw Material & Inventory</option>
                  <option value="LOGISTICS">Logistics & Shipping</option>
                  <option value="ADMINISTRATION">Administration</option>
                </select>
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    {...register("password")}
                    className="bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account & Sign In</span>
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4 text-center text-xs text-slate-600">
              <span>Already registered? </span>
              <Link
                href="/login"
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Sign In here
              </Link>
            </div>

            <div className="mt-2 text-center">
              <Link
                href="/"
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
