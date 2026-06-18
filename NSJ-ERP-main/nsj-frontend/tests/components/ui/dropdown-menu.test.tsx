import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenu components", () => {
  describe("DropdownMenu basic structure", () => {
    it("renders trigger", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("Open Menu")).toBeInTheDocument();
    });
  });

  describe("DropdownMenuLabel", () => {
    it("renders label text", () => {
      render(<DropdownMenuLabel>My Label</DropdownMenuLabel>);
      expect(screen.getByText("My Label")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <DropdownMenuLabel className="custom">Label</DropdownMenuLabel>
      );
      expect(container.firstChild).toHaveClass("custom");
    });

    it("renders with inset prop", () => {
      const { container } = render(
        <DropdownMenuLabel inset>Label</DropdownMenuLabel>
      );
      expect(container.firstChild).toHaveClass("pl-8");
    });
  });

  describe("DropdownMenuSeparator", () => {
    it("renders separator", () => {
      const { container } = render(<DropdownMenuSeparator />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <DropdownMenuSeparator className="custom" />
      );
      expect(container.firstChild).toHaveClass("custom");
    });
  });

  describe("DropdownMenuShortcut", () => {
    it("renders shortcut text", () => {
      render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
      expect(screen.getByText("⌘K")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <DropdownMenuShortcut className="custom">⌘K</DropdownMenuShortcut>
      );
      expect(container.firstChild).toHaveClass("custom");
    });
  });

  describe("DropdownMenuGroup", () => {
    it("renders children", () => {
      render(
        <DropdownMenuGroup>
          <div>Group Item</div>
        </DropdownMenuGroup>
      );
      expect(screen.getByText("Group Item")).toBeInTheDocument();
    });
  });

  describe("DropdownMenuRadioGroup", () => {
    it("renders children", () => {
      render(
        <DropdownMenuRadioGroup>
          <div>Radio Item</div>
        </DropdownMenuRadioGroup>
      );
      expect(screen.getByText("Radio Item")).toBeInTheDocument();
    });
  });

  describe("DropdownMenuSub", () => {
    it("renders sub menu structure", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Main</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(screen.getByText("Main")).toBeInTheDocument();
    });
  });
});
