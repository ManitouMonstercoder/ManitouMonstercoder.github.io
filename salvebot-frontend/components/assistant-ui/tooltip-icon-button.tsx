import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TooltipIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  children: React.ReactNode;
}

export const TooltipIconButton = React.forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({ tooltip, variant = "ghost", className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="sm"
      className={cn("h-8 w-8 p-1", className)}
      title={tooltip}
      {...props}
    >
      {children}
    </Button>
  );
});

TooltipIconButton.displayName = "TooltipIconButton";