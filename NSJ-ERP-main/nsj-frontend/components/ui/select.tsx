import * as React from "react";
import { cn } from "@/lib/utils";

// Simple native select wrapper with consistent styling
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    // Handle both onValueChange (shadcn/radix style) and native onChange
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      console.log("[Select] handleChange triggered, value:", e.target.value);
      if (onValueChange) {
        console.log("[Select] Calling onValueChange with:", e.target.value);
        onValueChange(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    const filterSelectChildren = (
      children: React.ReactNode
    ): React.ReactNode => {
      const filtered = React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null;

        const elementChild = child as React.ReactElement<any>;

        const isOptionElement = elementChild.type === "option";

        const hasValueProp =
          elementChild.props && elementChild.props.value !== undefined;

        if (isOptionElement || hasValueProp) {
          return elementChild;
        }

        if (elementChild.props && elementChild.props.children) {
          return filterSelectChildren(elementChild.props.children);
        }

        return null;
      });

      console.log("[Select] Filtered children:", filtered);
      return filtered;
    };

    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {filterSelectChildren(children)}
      </select>
    );
  }
);
Select.displayName = "Select";

// Wrapper components for API compatibility
// These are pass-through components that don't render anything
const SelectTrigger = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => <>{children}</>;

const SelectValue = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
const SelectItem = ({
  value,
  children,
  displayText,
}: {
  value: string;
  children: React.ReactNode;
  displayText?: string;
}) => {
  const optionText =
    displayText || (typeof children === "string" ? children : "");
  console.log("[SelectItem] Rendering:", { value, optionText });
  return <option value={value}>{optionText}</option>;
};
const SelectGroup = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
const SelectLabel = ({ children }: { children: React.ReactNode }) => (
  <option disabled>{children}</option>
);

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
};
