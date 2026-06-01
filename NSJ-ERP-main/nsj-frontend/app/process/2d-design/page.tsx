"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TwoDDesignApprovalPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>2D Design Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Approve 2D design images for orders
          </p>
          <div className="flex gap-4">
            <Link href="/process/2d-design/add">
              <Button>Add New 2D Design Approval</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
