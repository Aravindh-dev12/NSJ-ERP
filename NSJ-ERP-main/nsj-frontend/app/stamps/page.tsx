"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Gem,
  Diamond,
  Palette,
  Eye,
  FlaskConical,
  Scaling,
  Globe,
  Scissors,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function StampMasterPage() {
  const router = useRouter();

  const stampMasters = [
    {
      title: "Gemstone Types",
      description: "Types of gemstones",
      icon: Gem,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      route: "/masters-hub/item-master/stamps/gemstone-types",
    },
    {
      title: "Gemstone Shapes",
      description: "Gemstone shapes",
      icon: Diamond,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      route: "/masters-hub/item-master/stamps/gemstone-shapes",
    },
    {
      title: "Gemstone Colors",
      description: "Gemstone color options",
      icon: Palette,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      route: "/masters-hub/item-master/stamps/gemstone-colors",
    },
    {
      title: "Gemstone Clarities",
      description: "Gemstone clarity grades",
      icon: Eye,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      route: "/masters-hub/item-master/stamps/gemstone-clarities",
    },
    {
      title: "Gemstone Treatments",
      description: "Treatment types for gemstones",
      icon: FlaskConical,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      route: "/masters-hub/item-master/stamps/gemstone-treatments",
    },
    {
      title: "Sizes",
      description: "Material sizes",
      icon: Scaling,
      color: "text-red-600",
      bgColor: "bg-red-50",
      route: "/masters-hub/item-master/stamps/sizes",
    },
    {
      title: "Shapes",
      description: "Material shapes",
      icon: Diamond,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      route: "/masters-hub/item-master/stamps/shapes",
    },
    {
      title: "Clarities",
      description: "Diamond clarity grades",
      icon: Eye,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      route: "/masters-hub/item-master/stamps/clarities",
    },
    {
      title: "Labs",
      description: "Certification labs",
      icon: FlaskConical,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      route: "/masters-hub/item-master/stamps/labs",
    },
    {
      title: "Origins",
      description: "Material origins",
      icon: Globe,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      route: "/masters-hub/item-master/stamps/origins",
    },
    {
      title: "Cuts",
      description: "Diamond cut grades",
      icon: Scissors,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      route: "/masters-hub/item-master/stamps/cuts",
    },
    {
      title: "Polishes",
      description: "Diamond polish grades",
      icon: Sparkles,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      route: "/masters-hub/item-master/stamps/polishes",
    },
    {
      title: "Symmetries",
      description: "Diamond symmetry grades",
      icon: Scaling,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      route: "/masters-hub/item-master/stamps/symmetries",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stamp Master</h1>
          <p className="text-muted-foreground">
            Manage raw material and diamond/gemstone certification data
          </p>
        </div>
      </div>

      {/* Stamp Masters Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stampMasters.map((category) => (
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
              <div className="flex items-center justify-end">
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
