import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const baseClasses =
  "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className, type = "text", ...rest } = props;
  return <input ref={ref} type={type} className={cn(baseClasses, className)} {...rest} />;
});

Input.displayName = "Input";
