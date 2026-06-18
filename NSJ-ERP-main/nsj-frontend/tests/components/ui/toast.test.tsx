import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "@/components/ui/toast";

describe("Toast components", () => {
  it("renders ToastProvider with children", () => {
    render(
      <ToastProvider>
        <div>Toast content</div>
      </ToastProvider>
    );
    expect(screen.getByText("Toast content")).toBeInTheDocument();
  });

  it("renders ToastViewport", () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="viewport" />
      </ToastProvider>
    );
    expect(screen.getByTestId("viewport")).toBeInTheDocument();
  });

  it("renders Toast with default variant", () => {
    render(
      <ToastProvider>
        <Toast data-testid="toast">
          <ToastTitle>Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByTestId("toast")).toBeInTheDocument();
  });

  it("renders Toast with destructive variant", () => {
    render(
      <ToastProvider>
        <Toast variant="destructive" data-testid="toast">
          <ToastTitle>Error</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByTestId("toast")).toHaveClass("destructive");
  });

  it("renders ToastTitle", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastTitle>Test Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders ToastDescription", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastDescription>Test Description</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders ToastClose button", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastClose data-testid="close" />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByTestId("close")).toBeInTheDocument();
  });

  it("renders ToastAction", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastAction altText="Undo">Undo</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("applies custom className to Toast", () => {
    render(
      <ToastProvider>
        <Toast className="custom-class" data-testid="toast">
          <ToastTitle>Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByTestId("toast")).toHaveClass("custom-class");
  });

  it("applies custom className to ToastViewport", () => {
    render(
      <ToastProvider>
        <ToastViewport className="custom-viewport" data-testid="viewport" />
      </ToastProvider>
    );
    expect(screen.getByTestId("viewport")).toHaveClass("custom-viewport");
  });

  it("applies custom className to ToastTitle", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastTitle className="custom-title">Title</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByText("Title")).toHaveClass("custom-title");
  });

  it("applies custom className to ToastDescription", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastDescription className="custom-desc">Desc</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    expect(screen.getByText("Desc")).toHaveClass("custom-desc");
  });

  it("renders complete toast with all parts", () => {
    render(
      <ToastProvider>
        <Toast>
          <div className="grid gap-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Your action was completed.</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Your action was completed.")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });
});
