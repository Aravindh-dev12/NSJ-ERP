// Centralized logger for the frontend
import { toast } from "@/hooks/use-toast";

export const log = {
  info: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[INFO]", msg, ...args);
    }
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WARN]", msg, ...args);
    }
  },
  error: (msg: string, ...args: unknown[]) => {
    // Always log errors

    console.error("[ERROR]", msg, ...args);
    toast({
      title: "An error occurred",
      description: msg,
      variant: "destructive",
    });
  },
};
