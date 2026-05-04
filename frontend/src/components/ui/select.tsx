import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-card/88 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
