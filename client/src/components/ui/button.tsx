import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/components/ui/utils"

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        brand: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        accent: "bg-brand-accent text-white hover:bg-teal-700",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        danger:
          "bg-red-600 text-white hover:bg-red-700",
        success:
          "bg-green-600 text-white hover:bg-green-700",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600",
        info:
          "bg-blue-600 text-white hover:bg-blue-700",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-white border border-border text-foreground hover:bg-muted dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted",
        ghost: "text-[var(--color-primary-text)] hover:bg-[var(--color-primary-light)] font-medium",
        link: "text-[var(--color-primary-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",       // 40px — md default
        sm: "h-8 rounded-md px-3",        // 32px
        md: "h-10 px-5 py-2",             // 40px
        lg: "h-12 rounded-md px-8 text-base", // 48px — mobile CTAs
        icon: "h-10 w-10",               // 40×40 icon button
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
