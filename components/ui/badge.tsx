import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tono = "success" | "warning" | "danger" | "neutral";

const tonoClasses: Record<Tono, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-[#8a6206]",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-muted text-muted-foreground",
};

export function Badge({
  tono = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tonoClasses[tono],
        className
      )}
      {...props}
    />
  );
}
