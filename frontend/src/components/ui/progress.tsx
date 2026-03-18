import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/utils";

interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
}

export function Progress({ className, value, ...props }: ProgressProps): JSX.Element {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
