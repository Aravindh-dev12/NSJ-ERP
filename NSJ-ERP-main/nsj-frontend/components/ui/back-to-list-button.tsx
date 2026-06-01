import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackToListButtonProps {
  href: string;
  label?: string;
}

export function BackToListButton({
  href,
  label = "Back to List",
}: BackToListButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="mb-4">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </Button>
  );
}
