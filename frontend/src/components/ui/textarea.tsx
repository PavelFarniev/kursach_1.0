import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return (
    <textarea
      className={cn(
        "min-h-[90px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-card/88 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
      {...props}
    />
  );
}
