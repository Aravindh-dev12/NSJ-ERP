import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock use-toast before importing logger
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

import { log } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("log.info", () => {
    it("logs info message in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      log.info("Test info message");
      expect(console.info).toHaveBeenCalledWith("[INFO]", "Test info message");
    });

    it("logs info with additional arguments", () => {
      vi.stubEnv("NODE_ENV", "development");
      log.info("Test message", { data: 123 }, "extra");
      expect(console.info).toHaveBeenCalledWith(
        "[INFO]",
        "Test message",
        { data: 123 },
        "extra"
      );
    });

    it("does not log in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      log.info("Test info message");
      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe("log.warn", () => {
    it("logs warning message in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      log.warn("Test warning message");
      expect(console.warn).toHaveBeenCalledWith(
        "[WARN]",
        "Test warning message"
      );
    });

    it("logs warning with additional arguments", () => {
      vi.stubEnv("NODE_ENV", "development");
      log.warn("Warning", { code: 404 });
      expect(console.warn).toHaveBeenCalledWith("[WARN]", "Warning", {
        code: 404,
      });
    });

    it("does not log in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      log.warn("Test warning");
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("log.error", () => {
    it("logs error message always", () => {
      vi.stubEnv("NODE_ENV", "production");
      log.error("Test error message");
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR]",
        "Test error message"
      );
    });

    it("logs error with additional arguments", () => {
      log.error("Error occurred", new Error("test"), { context: "test" });
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR]",
        "Error occurred",
        expect.any(Error),
        { context: "test" }
      );
    });

    it("shows toast notification on error", () => {
      log.error("Something went wrong");
      expect(toast).toHaveBeenCalledWith({
        title: "An error occurred",
        description: "Something went wrong",
        variant: "destructive",
      });
    });

    it("logs in development mode", () => {
      vi.stubEnv("NODE_ENV", "development");
      log.error("Dev error");
      expect(console.error).toHaveBeenCalledWith("[ERROR]", "Dev error");
    });

    it("logs in test mode", () => {
      vi.stubEnv("NODE_ENV", "test");
      log.error("Test error");
      expect(console.error).toHaveBeenCalledWith("[ERROR]", "Test error");
    });
  });
});
