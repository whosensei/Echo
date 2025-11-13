"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Zap } from "lucide-react"

interface PlanBadgeProps {
  plan: "free" | "pro" | "enterprise"
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const planConfig = {
    free: {
      label: "Free",
      variant: "secondary" as const,
      icon: null,
    },
    pro: {
      label: "Pro",
      variant: "default" as const,
      icon: Zap,
    },
    enterprise: {
      label: "Max",
      variant: "default" as const,
      icon: Crown,
    },
  }

  const config = planConfig[plan]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}



