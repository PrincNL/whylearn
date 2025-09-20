import * as React from "react";
import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const baseClasses = "text-sm font-medium leading-none text-foreground";

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { className, ...rest } = props;
  return <label ref={ref} className={cn(baseClasses, className)} {...rest} />;
});

Label.displayName = "Label";
