import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

describe("Card components", () => {
  describe("Card", () => {
    it("renders children", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("CardHeader", () => {
    it("renders children", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardHeader className="custom-header">Content</CardHeader>
      );
      expect(container.firstChild).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("renders children", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardTitle className="custom-title">Title</CardTitle>
      );
      expect(container.firstChild).toHaveClass("custom-title");
    });
  });

  describe("CardDescription", () => {
    it("renders children", () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardDescription className="custom-desc">Desc</CardDescription>
      );
      expect(container.firstChild).toHaveClass("custom-desc");
    });
  });

  describe("CardContent", () => {
    it("renders children", () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      expect(container.firstChild).toHaveClass("custom-content");
    });
  });

  describe("CardFooter", () => {
    it("renders children", () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      expect(container.firstChild).toHaveClass("custom-footer");
    });
  });

  describe("Card composition", () => {
    it("renders complete card structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("Test Footer")).toBeInTheDocument();
    });
  });
});
