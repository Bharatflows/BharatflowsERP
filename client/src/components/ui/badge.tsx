import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/components/ui/utils"

/**
 * BharatFlow v5 StatusBadge — 18 business status variants
 * Shape: Pill (rounded-full), 11px/500wt
 * Dark mode: rgba() bg tints, brighter text (handled via CSS vars)
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Core variants
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",

        // Status: Green family
        paid: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        active: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        verified: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        matched: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        delivered: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        dispatched: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        running: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        success: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",

        // Status: Amber family
        pending: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        halted: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        syncing: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",

        // Status: Red family
        overdue: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        error: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        destructive: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        danger: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        delayed: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        urgent: "border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white",

        // Status: Blue family
        info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        draft: "border-transparent bg-muted text-muted-foreground dark:bg-slate-500/15 dark:text-muted-foreground",
        "in-progress": "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        "in-transit": "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        new: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",

        // Status: Orange family
        processing: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",

        // Status: Neutral
        idle: "border-transparent bg-muted text-muted-foreground dark:bg-slate-500/15 dark:text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
