import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/features/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 hover:scale-105",
        outline: "text-foreground border-border hover:bg-accent hover:scale-105",
        // Modern status colors using CSS variables
        available: "border-transparent bg-[hsl(var(--status-available-bg))] text-[hsl(var(--status-available))] hover:bg-[hsl(var(--status-available-bg))] hover:scale-105",
        "in-use": "border-transparent bg-[hsl(var(--status-in-use-bg))] text-[hsl(var(--status-in-use))] hover:bg-[hsl(var(--status-in-use-bg))] hover:scale-105",
        reserved: "border-transparent bg-[hsl(var(--status-reserved-bg))] text-[hsl(var(--status-reserved))] hover:bg-[hsl(var(--status-reserved-bg))] hover:scale-105",
        maintenance: "border-transparent bg-[hsl(var(--status-maintenance-bg))] text-[hsl(var(--status-maintenance))] hover:bg-[hsl(var(--status-maintenance-bg))] hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
