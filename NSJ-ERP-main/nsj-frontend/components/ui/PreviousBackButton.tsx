"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PreviousBackButtonProps {
  className?: string;
  fallbackHref?: string;
}

export function PreviousBackButton({
  className,
  fallbackHref,
}: PreviousBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="ghost"
      className="h-10 w-10 p-0 rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm"
      onClick={handleClick}
    >
      <ArrowLeft className="h-5 w-5 text-gray-500" />
    </Button>
  );
}
